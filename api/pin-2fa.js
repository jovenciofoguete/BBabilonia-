// api/pin-2fa.js — BBabilônia: PIN próprio da BBabilônia (6 números), pedido DEPOIS da impressão digital.
// Para todos os painéis (vendedores, funcionários, agentes e dono). Os clientes não usam.
// - O PIN fica guardado cifrado (scrypt + sal): ninguém consegue ver os números, nem no Supabase.
// - Só dá para pôr o PIN depois de confirmar a chave de acesso (impressão digital) há menos de 10 minutos.
// - 5 PINs errados = bloqueio de 15 minutos; se voltar a errar 5 vezes = conta bloqueada (só o dono/agente desbloqueia).
// - Só com PIN certo a sessão fica "verificada" (tabela sessoes_2fa, com_pin = true), que é o que as regras do Supabase exigem.
// Não altera o api/passkey.js.
const crypto = require('crypto');

const SUPA = 'https://dsfoqoeawvjafypycldz.supabase.co';
const SERV = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PERMITIDOS = /^([a-z0-9-]+\.)*bbabilonia\.com$|^bbabilonia-produto\.vercel\.app$/;
const DONO = 'jovenciofoguete1904@gmail.com';
const JANELA_CHAVE = 10 * 60 * 1000;   // tempo para pôr o PIN depois da impressão digital
const MAX_TENT = 5;                     // tentativas antes de bloquear
const BLOQ_MIN = 15;                    // minutos do 1.º bloqueio
const SEMPRE = '9999-12-31T00:00:00Z';  // bloqueio até o dono/agente desbloquear

const deB64u = s => Buffer.from(String(s || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64');
function jwt(tok) { try { return JSON.parse(deB64u(tok.split('.')[1]).toString('utf8')); } catch (e) { return {}; } }

async function db(caminho, op = {}) {
  const r = await fetch(SUPA + '/rest/v1/' + caminho, {
    method: op.method || 'GET',
    headers: Object.assign({ apikey: SERV, Authorization: 'Bearer ' + SERV, 'Content-Type': 'application/json' }, op.headers || {}),
    body: op.body ? JSON.stringify(op.body) : undefined
  });
  const t = await r.text();
  if (!r.ok) throw new Error('Base de dados: ' + t.slice(0, 200));
  return t ? JSON.parse(t) : null;
}

function pinFraco(p) {
  if (/^(\d)\1{5}$/.test(p)) return true;                         // 000000, 111111…
  if ('0123456789'.includes(p) || '9876543210'.includes(p)) return true; // 123456, 654321…
  if (/^(\d\d)\1\1$/.test(p) || /^(\d{3})\1$/.test(p)) return true; // 121212, 123123
  return false;
}
function cifrar(pin, sal) { return crypto.scryptSync(pin, sal, 32, { N: 16384, r: 8, p: 1 }).toString('hex'); }
function igual(a, b) { const x = Buffer.from(a, 'hex'), y = Buffer.from(b, 'hex'); return x.length === y.length && crypto.timingSafeEqual(x, y); }

async function alerta(user_id, email, texto) {
  try { await db('alertas_seguranca', { method: 'POST', body: { user_id, email, texto } }); } catch (e) {}
}
async function marcarComPin(sid, uid) {
  await db('sessoes_2fa?on_conflict=session_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
    body: { session_id: sid, user_id: uid, verificado_em: new Date().toISOString(), com_pin: true } });
  await db('sessoes_chave?session_id=eq.' + encodeURIComponent(sid), { method: 'DELETE' });
}
/* PIN errado: conta a tentativa e bloqueia (15 min; depois para sempre). Devolve [código, resposta]. */
async function falhou(pinRow, uid, email) {
  let tent = (pinRow.tentativas || 0) + 1, bloqs = pinRow.bloqueios || 0, ate = null;
  if (tent >= MAX_TENT) {
    bloqs += 1; tent = 0;
    ate = bloqs >= 2 ? SEMPRE : new Date(Date.now() + BLOQ_MIN * 60000).toISOString();
    await alerta(uid, email, bloqs >= 2 ? 'Conta bloqueada: PIN errado 10 vezes' : 'PIN errado 5 vezes: bloqueado 15 min');
  }
  await db('pins_2fa?user_id=eq.' + uid, { method: 'PATCH', body: { tentativas: tent, bloqueios: bloqs, bloqueado_ate: ate } });
  if (ate === SEMPRE) return [423, { erro: 'Conta bloqueada por PINs errados. Fale com a BBabilônia para desbloquear.', bloqueado: 'sempre' }];
  if (ate) return [423, { erro: 'PIN errado 5 vezes. Bloqueado por ' + BLOQ_MIN + ' min.', bloqueado: BLOQ_MIN }];
  const resta = MAX_TENT - tent;
  return [401, { erro: 'PIN errado. ' + (resta === 1 ? 'Resta 1 tentativa.' : 'Restam ' + resta + ' tentativas.') }];
}
function minutosAte(iso) { return Math.max(1, Math.ceil((new Date(iso) - Date.now()) / 60000)); }

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const resp = (c, o) => res.status(c).json(o);
  try {
    if (req.method !== 'POST') return resp(405, { erro: 'Use POST' });
    if (!SERV) return resp(500, { erro: 'Falta SUPABASE_SERVICE_ROLE_KEY na Vercel' });
    const origem = String(req.headers.origin || '');
    let host = ''; try { const u = new URL(origem); if (u.protocol === 'https:') host = u.hostname; } catch (e) {}
    if (!host || !PERMITIDOS.test(host)) return resp(403, { erro: 'Origem não permitida' });

    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!tok) return resp(401, { erro: 'Entre primeiro na conta' });
    const ur = await fetch(SUPA + '/auth/v1/user', { headers: { apikey: SERV, Authorization: 'Bearer ' + tok } });
    if (!ur.ok) return resp(401, { erro: 'Sessão expirada. Entre de novo.' });
    const user = await ur.json();
    const uid = user.id, sid = jwt(tok).session_id, email = String(user.email || '').toLowerCase();
    if (!uid || !sid) return resp(401, { erro: 'Sessão inválida. Entre de novo.' });

    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};

    const [pinRow] = (await db('pins_2fa?user_id=eq.' + uid + '&select=*')) || [];
    const [ver] = (await db('sessoes_2fa?session_id=eq.' + encodeURIComponent(sid) + '&com_pin=eq.true&select=session_id')) || [];
    const [ch] = (await db('sessoes_chave?session_id=eq.' + encodeURIComponent(sid) + '&user_id=eq.' + uid + '&select=chave_em')) || [];
    const chaveOk = !!(ch && Date.now() - new Date(ch.chave_em).getTime() < JANELA_CHAVE);
    const bloqueado = pinRow && pinRow.bloqueado_ate && new Date(pinRow.bloqueado_ate) > new Date()
      ? (pinRow.bloqueado_ate >= '9999' ? 'sempre' : minutosAte(pinRow.bloqueado_ate)) : null;

    if (b.acao === 'estado') return resp(200, { tem_pin: !!pinRow, chave_ok: chaveOk, verificado: !!ver, bloqueado });

    if (b.acao === 'criar' || b.acao === 'confirmar') {
      if (!chaveOk) return resp(403, { erro: 'Confirme primeiro com a impressão digital.', voltar_chave: true });
      const pin = String(b.pin || '');
      if (!/^\d{6}$/.test(pin)) return resp(400, { erro: 'O PIN tem de ter 6 números.' });

      if (b.acao === 'criar') {
        if (pinRow) return resp(409, { erro: 'Já tem PIN. Escreva o seu PIN.' });
        if (pinFraco(pin)) return resp(400, { erro: 'PIN fácil demais (ex.: 123456, 000000). Escolha outro.' });
        const sal = crypto.randomBytes(16).toString('hex');
        await db('pins_2fa', { method: 'POST', body: { user_id: uid, email, hash: cifrar(pin, sal), sal } });
        await marcarComPin(sid, uid);
        return resp(200, { ok: true });
      }

      if (!pinRow) return resp(409, { erro: 'Ainda não tem PIN. Crie o seu PIN.', criar: true });
      if (bloqueado === 'sempre') return resp(423, { erro: 'Conta bloqueada por PINs errados. Fale com a BBabilônia para desbloquear.', bloqueado });
      if (bloqueado) return resp(423, { erro: 'PIN bloqueado por ' + bloqueado + ' min (muitos PINs errados).', bloqueado });

      if (igual(cifrar(pin, pinRow.sal), pinRow.hash)) {
        if (pinRow.tentativas || pinRow.bloqueios) await db('pins_2fa?user_id=eq.' + uid, { method: 'PATCH', body: { tentativas: 0, bloqueios: 0, bloqueado_ate: null } });
        await marcarComPin(sid, uid);
        return resp(200, { ok: true });
      }
      return resp(...(await falhou(pinRow, uid, email)));
    }

    /* ---- dentro do painel: trocar ou eliminar o próprio PIN (pede o PIN atual) ---- */
    if (b.acao === 'trocar' || b.acao === 'eliminar') {
      if (!ver) return resp(403, { erro: 'Confirme primeiro a entrada (impressão digital + PIN).' });
      if (!pinRow) return resp(409, { erro: 'Esta conta não tem PIN.' });
      if (bloqueado === 'sempre') return resp(423, { erro: 'Conta bloqueada por PINs errados. Fale com a BBabilônia.', bloqueado });
      if (bloqueado) return resp(423, { erro: 'PIN bloqueado por ' + bloqueado + ' min (muitos PINs errados).', bloqueado });
      const atual = String(b.atual || '');
      if (!/^\d{6}$/.test(atual)) return resp(400, { erro: 'Escreva o PIN atual (6 números).' });
      if (!igual(cifrar(atual, pinRow.sal), pinRow.hash)) return resp(...(await falhou(pinRow, uid, email)));
      if (b.acao === 'trocar') {
        const novoPin = String(b.novo || '');
        if (!/^\d{6}$/.test(novoPin)) return resp(400, { erro: 'O PIN novo tem de ter 6 números.' });
        if (novoPin === atual) return resp(400, { erro: 'O PIN novo tem de ser diferente do atual.' });
        if (pinFraco(novoPin)) return resp(400, { erro: 'PIN fácil demais (ex.: 123456, 000000). Escolha outro.' });
        const sal = crypto.randomBytes(16).toString('hex');
        await db('pins_2fa?user_id=eq.' + uid, { method: 'PATCH', body: { hash: cifrar(novoPin, sal), sal, tentativas: 0, bloqueios: 0, bloqueado_ate: null } });
        await alerta(uid, email, 'PIN trocado pelo próprio');
        return resp(200, { ok: true });
      }
      // eliminar: apaga o PIN e fecha a verificação de todas as sessões; na próxima entrada cria um PIN novo
      await db('pins_2fa?user_id=eq.' + uid, { method: 'DELETE' });
      await db('sessoes_2fa?user_id=eq.' + uid, { method: 'DELETE' });
      await db('sessoes_chave?user_id=eq.' + uid, { method: 'DELETE' });
      await alerta(uid, email, 'PIN eliminado pelo próprio (cria um novo na próxima entrada)');
      return resp(200, { ok: true });
    }

    /* ---- só o dono e os agentes ativos (já verificados com PIN) ---- */
    if (b.acao === 'admin-lista' || b.acao === 'admin-apagar') {
      let pode = email === DONO;
      if (!pode) { const ag = await db('agentes?email=ilike.' + encodeURIComponent(email) + '&ativo=eq.true&select=email'); pode = !!(ag && ag.length); }
      if (!pode) return resp(403, { erro: 'Só o dono ou os agentes da BBabilônia.' });
      if (!ver) return resp(403, { erro: 'Confirme primeiro a sua entrada (impressão digital + PIN).' });

      if (b.acao === 'admin-lista') {
        const alertas = await db('alertas_seguranca?select=email,texto,criado_em&order=criado_em.desc&limit=50');
        const bloq = await db('pins_2fa?bloqueado_ate=gt.' + encodeURIComponent(new Date().toISOString()) + '&select=email,bloqueado_ate&order=bloqueado_ate.desc');
        return resp(200, { alertas, bloqueados: bloq });
      }
      const alvo = String(b.email || '').trim().toLowerCase();
      if (!alvo) return resp(400, { erro: 'Escreva o email da conta.' });
      const [p] = (await db('pins_2fa?email=eq.' + encodeURIComponent(alvo) + '&select=user_id')) || [];
      if (!p) return resp(404, { erro: 'Esta conta não tem PIN BBabilônia.' });
      await db('pins_2fa?user_id=eq.' + p.user_id, { method: 'DELETE' });
      await db('sessoes_2fa?user_id=eq.' + p.user_id, { method: 'DELETE' });   // tem de entrar de novo
      await db('sessoes_chave?user_id=eq.' + p.user_id, { method: 'DELETE' });
      await alerta(p.user_id, alvo, 'PIN apagado por ' + email + ' (vai criar um novo na próxima entrada)');
      return resp(200, { ok: true });
    }

    return resp(400, { erro: 'Ação desconhecida' });
  } catch (e) {
    return resp(500, { erro: String(e.message || e) });
  }
};

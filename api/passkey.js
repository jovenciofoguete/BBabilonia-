// api/passkey.js — BBabilônia: verificação em 2 passos com chave de acesso
// (impressão digital, rosto ou PIN do telemóvel ou do computador). Sem bibliotecas externas.
const crypto = require('crypto');

const SUPA = 'https://dsfoqoeawvjafypycldz.supabase.co';
const SERV = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PERMITIDOS = /^([a-z0-9-]+\.)*bbabilonia\.com$|^bbabilonia-produto\.vercel\.app$/;
const VALIDADE_DESAFIO = 5 * 60 * 1000;

/* ---------- ajudas ---------- */
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64u = s => Buffer.from(String(s || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const sha256 = b => crypto.createHash('sha256').update(b).digest();
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

/* ---------- CBOR mínimo (só o que a WebAuthn usa) ---------- */
function cbor(buf) {
  let p = 0;
  function len(ai) {
    if (ai < 24) return ai;
    if (ai === 24) return buf[p++];
    if (ai === 25) { const v = buf.readUInt16BE(p); p += 2; return v; }
    if (ai === 26) { const v = buf.readUInt32BE(p); p += 4; return v; }
    if (ai === 27) { const v = Number(buf.readBigUInt64BE(p)); p += 8; return v; }
    throw new Error('CBOR inválido');
  }
  function item() {
    const b = buf[p++], mt = b >> 5, ai = b & 31;
    if (mt === 7) { if (ai === 20) return false; if (ai === 21) return true; if (ai === 22 || ai === 23) return null; throw new Error('CBOR não suportado'); }
    const n = len(ai);
    switch (mt) {
      case 0: return n;
      case 1: return -1 - n;
      case 2: { const v = buf.subarray(p, p + n); p += n; return v; }
      case 3: { const v = buf.subarray(p, p + n).toString('utf8'); p += n; return v; }
      case 4: { const a = []; for (let i = 0; i < n; i++) a.push(item()); return a; }
      case 5: { const m = new Map(); for (let i = 0; i < n; i++) { const k = item(); m.set(k, item()); } return m; }
      case 6: return item();
    }
    throw new Error('CBOR inválido');
  }
  const v = item();
  return { v, fim: p };
}

/* chave COSE -> JWK */
function coseJwk(m) {
  const kty = m.get(1), alg = m.get(3);
  if (kty === 2 && m.get(-1) === 1) return { alg, jwk: { kty: 'EC', crv: 'P-256', x: b64u(m.get(-2)), y: b64u(m.get(-3)) } };
  if (kty === 3) return { alg, jwk: { kty: 'RSA', n: b64u(m.get(-1)), e: b64u(m.get(-2)) } };
  if (kty === 1 && m.get(-1) === 6) return { alg, jwk: { kty: 'OKP', crv: 'Ed25519', x: b64u(m.get(-2)) } };
  throw new Error('Tipo de chave não suportado');
}

function lerAuthData(ad, rpId) {
  if (ad.length < 37) throw new Error('Dados do aparelho inválidos');
  if (!ad.subarray(0, 32).equals(sha256(Buffer.from(rpId)))) throw new Error('A chave não pertence a este site');
  const flags = ad[32];
  if (!(flags & 1)) throw new Error('Confirmação no aparelho não feita');
  if (!(flags & 4)) throw new Error('É preciso confirmar com impressão digital, rosto ou PIN');
  const contador = ad.readUInt32BE(33);
  const r = { flags, contador };
  if (flags & 64) {
    let p = 37 + 16;
    const n = ad.readUInt16BE(p); p += 2;
    r.credId = ad.subarray(p, p + n); p += n;
    const c = cbor(ad.subarray(p));
    r.chave = coseJwk(c.v);
  }
  return r;
}

function verificarCliente(cdBuf, tipo, desafio, origem) {
  let cd; try { cd = JSON.parse(cdBuf.toString('utf8')); } catch (e) { throw new Error('Resposta do aparelho inválida'); }
  if (cd.type !== tipo) throw new Error('Tipo de pedido errado');
  if (cd.challenge !== desafio) throw new Error('O pedido expirou. Tente de novo.');
  if (cd.origin !== origem) throw new Error('Origem não permitida');
}

function verificarAssinatura(chaveGuardada, alg, dados, assinatura) {
  const key = crypto.createPublicKey({ key: JSON.parse(chaveGuardada), format: 'jwk' });
  if (alg === -7) return crypto.verify('sha256', dados, { key, dsaEncoding: 'der' }, assinatura);
  if (alg === -257) return crypto.verify('sha256', dados, key, assinatura);
  if (alg === -8) return crypto.verify(null, dados, key, assinatura);
  throw new Error('Algoritmo não suportado');
}

async function guardarDesafio(uid, tipo) {
  const d = b64u(crypto.randomBytes(32));
  await db('passkey_desafios?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
    body: { user_id: uid, desafio: d, tipo, criado_em: new Date().toISOString() } });
  return d;
}
async function tirarDesafio(uid, tipo) {
  const r = await db('passkey_desafios?user_id=eq.' + uid + '&select=*');
  await db('passkey_desafios?user_id=eq.' + uid, { method: 'DELETE' });
  const d = r && r[0];
  if (!d || d.tipo !== tipo || Date.now() - new Date(d.criado_em).getTime() > VALIDADE_DESAFIO) throw new Error('O pedido expirou. Tente de novo.');
  return d.desafio;
}
async function marcarVerificado(sid, uid) {
  await db('sessoes_2fa?on_conflict=session_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
    body: { session_id: sid, user_id: uid, verificado_em: new Date().toISOString() } });
}

/* ---------- pedido ---------- */
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const resp = (c, o) => res.status(c).json(o);
  try {
    if (req.method !== 'POST') return resp(405, { erro: 'Use POST' });
    if (!SERV) return resp(500, { erro: 'Falta SUPABASE_SERVICE_ROLE_KEY na Vercel' });
    const origem = String(req.headers.origin || '');
    let host = ''; try { const u = new URL(origem); if (u.protocol === 'https:') host = u.hostname; } catch (e) {}
    if (!host || !PERMITIDOS.test(host)) return resp(403, { erro: 'Origem não permitida' });
    const rpId = /(^|\.)bbabilonia\.com$/.test(host) ? 'bbabilonia.com' : host;

    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!tok) return resp(401, { erro: 'Entre primeiro na conta' });
    const ur = await fetch(SUPA + '/auth/v1/user', { headers: { apikey: SERV, Authorization: 'Bearer ' + tok } });
    if (!ur.ok) return resp(401, { erro: 'Sessão expirada. Entre de novo.' });
    const user = await ur.json();
    const uid = user.id, sid = jwt(tok).session_id;
    if (!uid || !sid) return resp(401, { erro: 'Sessão inválida. Entre de novo.' });

    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};

    const minhas = await db('passkeys?user_id=eq.' + uid + '&rp_id=eq.' + encodeURIComponent(rpId) + '&select=id,public_key,alg,counter');
    const ver = await db('sessoes_2fa?session_id=eq.' + sid + '&select=session_id');
    const verificado = !!(ver && ver.length);

    if (b.acao === 'estado') return resp(200, { tem: minhas.length, verificado });

    if (b.acao === 'registo-inicio') {
      if (minhas.length && !verificado) return resp(403, { erro: 'Confirme primeiro com a chave que já tem' });
      const desafio = await guardarDesafio(uid, 'registo');
      return resp(200, { publicKey: {
        challenge: desafio,
        rp: { id: rpId, name: 'BBabilônia' },
        user: { id: b64u(Buffer.from(uid)), name: user.email || uid, displayName: user.email || 'BBabilônia' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }, { type: 'public-key', alg: -8 }],
        authenticatorSelection: { userVerification: 'required', residentKey: 'preferred' },
        attestation: 'none', timeout: 180000,
        excludeCredentials: minhas.map(k => ({ type: 'public-key', id: k.id }))
      } });
    }

    if (b.acao === 'registo-fim') {
      if (minhas.length && !verificado) return resp(403, { erro: 'Confirme primeiro com a chave que já tem' });
      const desafio = await tirarDesafio(uid, 'registo');
      verificarCliente(deB64u(b.clientDataJSON), 'webauthn.create', desafio, origem);
      const att = cbor(deB64u(b.attestationObject)).v;
      if (!(att instanceof Map) || !att.get('authData')) throw new Error('Resposta do aparelho inválida');
      const ad = lerAuthData(Buffer.from(att.get('authData')), rpId);
      if (!ad.credId || !ad.chave) throw new Error('O aparelho não criou a chave');
      if (b64u(ad.credId) !== b.id) throw new Error('Chave inválida');
      await db('passkeys', { method: 'POST', body: {
        id: b.id, user_id: uid, public_key: JSON.stringify(ad.chave.jwk), alg: ad.chave.alg,
        counter: ad.contador, rp_id: rpId, aparelho: String(b.aparelho || '').slice(0, 80)
      } });
      await marcarVerificado(sid, uid);
      return resp(200, { ok: true });
    }

    if (b.acao === 'login-inicio') {
      if (!minhas.length) return resp(400, { erro: 'Ainda não ativou a chave de acesso' });
      const desafio = await guardarDesafio(uid, 'login');
      return resp(200, { publicKey: {
        challenge: desafio, rpId, timeout: 180000, userVerification: 'required',
        allowCredentials: minhas.map(k => ({ type: 'public-key', id: k.id }))
      } });
    }

    if (b.acao === 'login-fim') {
      const desafio = await tirarDesafio(uid, 'login');
      const k = minhas.find(x => x.id === b.id);
      if (!k) throw new Error('Esta chave não é desta conta');
      const cd = deB64u(b.clientDataJSON), adBuf = deB64u(b.authenticatorData);
      verificarCliente(cd, 'webauthn.get', desafio, origem);
      const ad = lerAuthData(adBuf, rpId);
      const ok = verificarAssinatura(k.public_key, k.alg, Buffer.concat([adBuf, sha256(cd)]), deB64u(b.signature));
      if (!ok) throw new Error('Confirmação inválida');
      if (ad.contador && Number(k.counter) && ad.contador <= Number(k.counter)) throw new Error('Chave copiada ou repetida. Fale com o administrador.');
      await db('passkeys?id=eq.' + encodeURIComponent(k.id), { method: 'PATCH', body: { counter: ad.contador, usado_em: new Date().toISOString() } });
      await marcarVerificado(sid, uid);
      return resp(200, { ok: true });
    }

    return resp(400, { erro: 'Ação desconhecida' });
  } catch (e) {
    return resp(400, { erro: e.message || String(e) });
  }
};

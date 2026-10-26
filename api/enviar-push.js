// B-Babilônia - /api/enviar-push
// Chamado pelo Supabase (bb_enviar_push) sempre que entra um aviso novo.
// Envia a notificação para todos os telemóveis do dono do aviso.
// Chaves lidas da tabela bb_config (não precisa de variáveis novas na Vercel).
const crypto = require('crypto');
const SUPABASE_URL = 'https://dsfoqoeawvjafypycldz.supabase.co';
const CONTACTO = 'https://bbabilonia-produto.vercel.app';

async function sb(path, opts) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, Object.assign({}, opts, {
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }
  }));
  const t = await r.text();
  if (!r.ok) throw new Error('Supabase: ' + t);
  return t ? JSON.parse(t) : null;
}

const b64 = (s) => Buffer.from(String(s), 'base64url');
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();

// Cifra a mensagem (RFC 8291, aes128gcm)
function cifrar(texto, p256dh, auth) {
  const uaPub = b64(p256dh), segredo = b64(auth);
  const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
  const asPub = ecdh.getPublicKey();
  const partilhado = ecdh.computeSecret(uaPub);
  const prkKey = hmac(segredo, partilhado);
  const info = Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub, Buffer.from([1])]);
  const ikm = hmac(prkKey, info).subarray(0, 32);
  const sal = crypto.randomBytes(16);
  const prk = hmac(sal, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const corpo = Buffer.concat([c.update(Buffer.concat([Buffer.from(texto), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([sal, rs, Buffer.from([asPub.length]), asPub, corpo]);
}

// Assinatura VAPID (RFC 8292)
function vapid(endpoint, pub, priv) {
  const p = b64(pub);
  const chave = crypto.createPrivateKey({ key: {
    kty: 'EC', crv: 'P-256', d: priv,
    x: p.subarray(1, 33).toString('base64url'), y: p.subarray(33, 65).toString('base64url')
  }, format: 'jwk' });
  const cab = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).toString('base64url');
  const dados = Buffer.from(JSON.stringify({
    aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: CONTACTO
  })).toString('base64url');
  const ass = crypto.sign('sha256', Buffer.from(cab + '.' + dados), { key: chave, dsaEncoding: 'ieee-p1363' });
  return 'vapid t=' + cab + '.' + dados + '.' + ass.toString('base64url') + ', k=' + pub;
}

async function enviar(sub, texto, pub, priv) {
  const r = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
      TTL: '86400', Urgency: 'high', Authorization: vapid(sub.endpoint, pub, priv)
    },
    body: cifrar(texto, sub.p256dh, sub.auth)
  });
  return r.status;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método inválido' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const cfg = {};
    (await sb('bb_config?select=nome,valor') || []).forEach((l) => { cfg[l.nome] = l.valor; });
    if (!cfg.push_segredo || req.headers['x-segredo'] !== cfg.push_segredo) return res.status(401).json({ erro: 'Sem permissão' });
    if (!cfg.vapid_publica || !cfg.vapid_privada) return res.status(500).json({ erro: 'Faltam chaves em bb_config' });

    const av = (await sb('avisos?id=eq.' + encodeURIComponent(body.aviso_id || '') + '&select=*'))[0];
    if (!av || !av.user_id) return res.status(404).json({ erro: 'Aviso não encontrado' });
    const subs = await sb('push_subscricoes?user_id=eq.' + av.user_id + '&select=*') || [];
    const texto = JSON.stringify({ titulo: av.titulo || 'B-Babilônia', texto: av.texto || '', link: av.link || 'avisos.html', id: av.id });

    let ok = 0;
    for (const s of subs) {
      try {
        const st = await enviar(s, texto, cfg.vapid_publica, cfg.vapid_privada);
        if (st === 404 || st === 410) await sb('push_subscricoes?id=eq.' + s.id, { method: 'DELETE' });
        else if (st < 300) ok++;
      } catch (e) { /* um telemóvel com erro não trava os outros */ }
    }
    return res.status(200).json({ enviados: ok, aparelhos: subs.length });
  } catch (e) {
    return res.status(500).json({ erro: String(e.message || e) });
  }
};
    

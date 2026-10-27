// B-Babilônia - /api/livekit-token
// Dá a "entrada" na live do LiveKit.
// Vendedor (com sessão iniciada): transmite na sala dele (live-ID_DO_VENDEDOR).
// Cliente: só assiste, não transmite.
const crypto = require('crypto');
const SUPABASE_URL = 'https://dsfoqoeawvjafypycldz.supabase.co';

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');

function criarToken(chave, segredo, identidade, nome, sala, podeTransmitir) {
  const agora = Math.floor(Date.now() / 1000);
  const cabecalho = b64({ alg: 'HS256', typ: 'JWT' });
  const corpo = b64({
    iss: chave, sub: identidade, name: nome, nbf: agora - 10, exp: agora + 6 * 3600,
    video: { room: sala, roomJoin: true, canSubscribe: true, canPublish: podeTransmitir, canPublishData: false }
  });
  const assinatura = crypto.createHmac('sha256', segredo).update(cabecalho + '.' + corpo).digest('base64url');
  return cabecalho + '.' + corpo + '.' + assinatura;
}

async function utilizador(tokenSessao) {
  if (!tokenSessao) return null;
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: k, Authorization: 'Bearer ' + tokenSessao } });
  return r.ok ? r.json() : null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const url = (process.env.LIVEKIT_URL || '').trim();
    const chave = (process.env.LIVEKIT_API_KEY || '').trim();
    const segredo = (process.env.LIVEKIT_API_SECRET || '').trim();
    if (!url || !chave || !segredo) return res.status(500).json({ erro: 'Faltam as chaves do LiveKit na Vercel' });

    const q = req.query || {};
    const papel = q.papel === 'vendedor' ? 'vendedor' : 'cliente';
    const sessao = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = await utilizador(sessao);

    if (papel === 'vendedor') {
      if (!user || !user.id) return res.status(401).json({ erro: 'Inicie sessão para fazer live' });
      const sala = 'live-' + user.id;
      const token = criarToken(chave, segredo, 'vendedor-' + user.id, user.email || 'Vendedor', sala, true);
      return res.status(200).json({ token, url, sala });
    }

    const sala = String(q.sala || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 80);
    if (!sala) return res.status(400).json({ erro: 'Falta a sala da live' });
    const id = user && user.id ? 'cliente-' + user.id : 'visitante-' + crypto.randomBytes(6).toString('hex');
    const token = criarToken(chave, segredo, id, 'Cliente', sala, false);
    return res.status(200).json({ token, url, sala });
  } catch (e) {
    return res.status(500).json({ erro: String(e.message || e) });
  }
};

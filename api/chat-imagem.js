// api/chat-imagem.js — BBabilônia: dá links temporários (1 hora) para as fotos do chat.
// A pasta chat-imagens passa a ser privada. Cada foto está dentro da pasta da conversa
// (ID_DA_CONVERSA/ficheiro.jpg). Só recebe o link quem já consegue abrir essa conversa
// (as mesmas regras do chat: cliente, vendedor, funcionários, atendimento e dono).
const SUPA = 'https://dsfoqoeawvjafypycldz.supabase.co';
const PUB = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
const BUCKET = 'chat-imagens';
const VALIDADE = 3600;
const MAX = 60;
const CAMINHO_OK = /^[A-Za-z0-9-]{1,64}\/[A-Za-z0-9._-]{1,120}$/;

async function podeVerConversa(conversaId, tokenUtilizador) {
  const r = await fetch(SUPA + '/rest/v1/conversas?select=id&id=eq.' + encodeURIComponent(conversaId) + '&limit=1', {
    headers: { apikey: PUB, Authorization: 'Bearer ' + tokenUtilizador }
  });
  if (!r.ok) return false;
  const l = await r.json();
  return Array.isArray(l) && l.length > 0;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST' });
    const serv = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serv) return res.status(500).json({ erro: 'Configuração em falta' });

    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!tok || tok === PUB) return res.status(401).json({ erro: 'Entre na conta para ver as fotos' });

    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    const pedidos = Array.isArray(b && b.caminhos) ? b.caminhos : [];
    const caminhos = [...new Set(pedidos.map(String))]
      .filter((c) => CAMINHO_OK.test(c) && !c.includes('..'))
      .slice(0, MAX);
    if (!caminhos.length) return res.status(200).json({ urls: {} });

    // Verifica cada conversa uma vez, com a sessão do próprio utilizador
    const pastas = [...new Set(caminhos.map((c) => c.split('/')[0]))];
    const permitidas = new Set();
    await Promise.all(pastas.map(async (p) => { if (await podeVerConversa(p, tok)) permitidas.add(p); }));
    const ok = caminhos.filter((c) => permitidas.has(c.split('/')[0]));
    if (!ok.length) return res.status(200).json({ urls: {} });

    const r = await fetch(SUPA + '/storage/v1/object/sign/' + BUCKET, {
      method: 'POST',
      headers: { apikey: serv, Authorization: 'Bearer ' + serv, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: VALIDADE, paths: ok })
    });
    if (!r.ok) { console.error('chat-imagem sign', r.status, await r.text()); return res.status(502).json({ erro: 'Não foi possível abrir as fotos' }); }
    const lista = await r.json();
    const urls = {};
    (Array.isArray(lista) ? lista : []).forEach((x) => {
      const u = x && (x.signedURL || x.signedUrl);
      if (x && x.path && u && !x.error) urls[x.path] = SUPA + '/storage/v1' + u;
    });
    return res.status(200).json({ urls, validade: VALIDADE });
  } catch (e) {
    console.error('chat-imagem:', e && e.message);
    return res.status(500).json({ erro: 'Erro interno. Tente de novo.' });
  }
};

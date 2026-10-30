// api/traduzir.js — BBabilônia: traduz textos do painel pelo servidor (funciona também na China,
// onde o Google Tradutor está bloqueado no telemóvel). Recebe { para: "zh", textos: ["...", ...] }
// e devolve { textos: ["...", ...] } pela mesma ordem. Se não conseguir traduzir um texto, devolve o original.
const MAPA = { zh: 'zh-CN', he: 'iw', jv: 'jw', nb: 'no', fil: 'tl' };
const CACHE = new Map();
const MAX_TEXTOS = 60, MAX_LETRAS = 500, MAX_TOTAL = 12000;

async function comTempo(url, ms) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { signal: c.signal, headers: { 'User-Agent': 'Mozilla/5.0' } }); } finally { clearTimeout(t); }
}
async function google(txt, para) {
  const r = await comTempo('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + encodeURIComponent(para) + '&dt=t&q=' + encodeURIComponent(txt), 6000);
  if (!r.ok) throw new Error('google ' + r.status);
  const j = await r.json();
  const s = (j && j[0] || []).map(x => (x && x[0]) || '').join('');
  if (!s) throw new Error('vazio');
  return s;
}
async function mymemory(txt, para) {
  const r = await comTempo('https://api.mymemory.translated.net/get?langpair=pt|' + encodeURIComponent(para) + '&q=' + encodeURIComponent(txt.slice(0, 480)), 6000);
  if (!r.ok) throw new Error('mymemory ' + r.status);
  const j = await r.json();
  const s = j && j.responseData && j.responseData.translatedText;
  if (!s || /MYMEMORY WARNING|INVALID/i.test(s)) throw new Error('mymemory falhou');
  return s;
}
async function traduzirUm(txt, l) {
  const k = l + '|' + txt;
  if (CACHE.has(k)) return CACHE.get(k);
  let s = txt;
  try { s = await google(txt, MAPA[l] || l); }
  catch (e) { try { s = await mymemory(txt, l === 'zh' ? 'zh-CN' : l); } catch (e2) { return txt; } }
  if (CACHE.size > 20000) CACHE.clear();
  CACHE.set(k, s);
  return s;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ erro: 'Use POST.' })); }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  const l = String((b && b.para) || '').toLowerCase().split('-')[0];
  const textos = b && Array.isArray(b.textos) ? b.textos : null;
  if (!/^[a-z]{2,3}$/.test(l) || !textos || !textos.length || textos.length > MAX_TEXTOS) {
    res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ erro: 'Pedido inválido.' }));
  }
  const lista = textos.map(t => String(t == null ? '' : t).slice(0, MAX_LETRAS));
  if (lista.reduce((s, t) => s + t.length, 0) > MAX_TOTAL) { res.statusCode = 413; return res.end(JSON.stringify({ erro: 'Texto demasiado grande.' })); }
  const saida = new Array(lista.length);
  let i = 0;
  async function trabalhador() { while (i < lista.length) { const n = i++; saida[n] = l === 'pt' || !lista[n].trim() ? lista[n] : await traduzirUm(lista[n], l); } }
  await Promise.all(Array.from({ length: Math.min(6, lista.length) }, trabalhador));
  res.statusCode = 200; res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ textos: saida }));
};

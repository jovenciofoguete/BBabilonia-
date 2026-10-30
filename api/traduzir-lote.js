// api/traduzir-lote.js — BBabilônia: tradução rápida do painel e das páginas do fornecedor.
// Junta muitos textos num só pedido ao tradutor (em vez de um pedido por texto), por isso responde em ~1 segundo
// e nunca passa o tempo limite da Vercel. Recebe { para: "en", textos: [...] } e devolve { textos: [...] } pela
// mesma ordem; um texto que não deu para traduzir vem como null (o navegador volta a pedir depois).
const MAPA = { zh: 'zh-CN', he: 'iw', jv: 'jw', nb: 'no', fil: 'tl' };
const CACHE = new Map();
const MAX_TEXTOS = 120, MAX_LETRAS = 500, MAX_TOTAL = 20000, LOTE = 2500, PRAZO = 8000;
const NL = String.fromCharCode(10);

function limpo(t) { return String(t).replace(/\s+/g, ' ').trim(); }
async function comTempo(url, opc, ms) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, Object.assign({ signal: c.signal }, opc)); } finally { clearTimeout(t); }
}
async function google(lista, para, ms) {
  const r = await comTempo('https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=' + encodeURIComponent(para) + '&dt=t', {
    method: 'POST',
    headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: 'q=' + encodeURIComponent(lista.join(NL))
  }, ms);
  if (!r.ok) throw new Error('google ' + r.status);
  const j = await r.json();
  const s = (j && j[0] || []).map(x => (x && x[0]) || '').join('');
  const partes = s.split(NL).map(x => x.trim());
  while (partes.length > lista.length && partes[partes.length - 1] === '') partes.pop();
  if (partes.length !== lista.length || partes.some(x => !x)) throw new Error('contagem');
  return partes;
}
async function mymemory(txt, para, ms) {
  const r = await comTempo('https://api.mymemory.translated.net/get?langpair=pt|' + encodeURIComponent(para) + '&q=' + encodeURIComponent(txt.slice(0, 480)), { headers: { 'User-Agent': 'Mozilla/5.0' } }, ms);
  if (!r.ok) throw new Error('mymemory ' + r.status);
  const j = await r.json();
  const s = j && j.responseData && j.responseData.translatedText;
  if (!s || /MYMEMORY WARNING|INVALID/i.test(s)) throw new Error('mymemory falhou');
  return s;
}

// traduz um grupo; se o tradutor baralhar as linhas, divide ao meio e tenta de novo
async function grupo(lista, l, fim, saida, idx) {
  const resta = fim - Date.now(); if (resta < 400) return;
  const para = MAPA[l] || l;
  try {
    const r = await google(lista, para, Math.min(5000, resta - 200));
    r.forEach((s, i) => { saida[idx[i]] = s; CACHE.set(l + '|' + lista[i], s); });
    return;
  } catch (e) {
    if (/google \d/.test(String(e.message))) { // tradutor recusou (ex.: 429): usa o de reserva, texto a texto
      let k = 0;
      const trab = async () => { while (k < lista.length && fim - Date.now() > 600) { const n = k++; try { const s = await mymemory(lista[n], l === 'zh' ? 'zh-CN' : l, Math.min(4000, fim - Date.now() - 200)); saida[idx[n]] = s; CACHE.set(l + '|' + lista[n], s); } catch (e2) {} } };
      await Promise.all(Array.from({ length: Math.min(5, lista.length) }, trab));
      return;
    }
    if (lista.length > 1 && fim - Date.now() > 1500) {
      const m = Math.ceil(lista.length / 2);
      await Promise.all([grupo(lista.slice(0, m), l, fim, saida, idx.slice(0, m)), grupo(lista.slice(m), l, fim, saida, idx.slice(m))]);
      return;
    }
    if (lista.length === 1) {
      try { const s = await mymemory(lista[0], l === 'zh' ? 'zh-CN' : l, Math.min(4000, fim - Date.now() - 200)); saida[idx[0]] = s; CACHE.set(l + '|' + lista[0], s); } catch (e2) {}
    }
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ erro: 'Use POST.' })); }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  const l = String((b && b.para) || '').toLowerCase().split('-')[0];
  const textos = b && Array.isArray(b.textos) ? b.textos : null;
  if (!/^[a-z]{2,3}$/.test(l) || !textos || !textos.length || textos.length > MAX_TEXTOS) { res.statusCode = 400; return res.end(JSON.stringify({ erro: 'Pedido inválido.' })); }
  const lista = textos.map(t => String(t == null ? '' : t).slice(0, MAX_LETRAS));
  if (lista.reduce((s, t) => s + t.length, 0) > MAX_TOTAL) { res.statusCode = 413; return res.end(JSON.stringify({ erro: 'Texto demasiado grande.' })); }
  const fim = Date.now() + PRAZO;
  const saida = new Array(lista.length).fill(null);
  const grupos = []; let g = null, tam = 0;
  lista.forEach((t, i) => {
    const c = limpo(t);
    if (l === 'pt' || !c) { saida[i] = t; return; }
    const k = l + '|' + c; if (CACHE.has(k)) { saida[i] = CACHE.get(k); return; }
    if (!g || tam + c.length > LOTE) { g = { lista: [], idx: [] }; grupos.push(g); tam = 0; }
    g.lista.push(c); g.idx.push(i); tam += c.length + 1;
  });
  await Promise.all(grupos.map(x => grupo(x.lista, l, fim, saida, x.idx)));
  if (CACHE.size > 30000) CACHE.clear();
  res.statusCode = 200;
  res.end(JSON.stringify({ textos: saida }));
};

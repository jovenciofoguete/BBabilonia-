// api/sitemap.js — BBabilônia: mapa do site para o Google (lista a loja, as lojas aprovadas e os produtos)
const SUPA = 'https://dsfoqoeawvjafypycldz.supabase.co';
const KEY = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
const BASE = 'https://bbabilonia.com';

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
function dia(d) { try { return new Date(d).toISOString().slice(0, 10); } catch (e) { return ''; } }
async function ler(caminho) {
  const tudo = [];
  for (let ini = 0; ini < 45000; ini += 1000) {
    const r = await fetch(SUPA + '/rest/v1/' + caminho + '&offset=' + ini + '&limit=1000', { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    if (!r.ok) break;
    const p = await r.json();
    tudo.push(...p);
    if (p.length < 1000) break;
  }
  return tudo;
}

module.exports = async function handler(req, res) {
  const urls = [
    { loc: BASE + '/', freq: 'daily', pri: '1.0' },
    { loc: 'https://suppliers.bbabilonia.com/', freq: 'monthly', pri: '0.5' },
    { loc: BASE + '/termos.html', freq: 'yearly', pri: '0.2' },
    { loc: BASE + '/privacidade.html', freq: 'yearly', pri: '0.2' }
  ];
  try {
    const [prods, lojas] = await Promise.all([
      ler('products?select=id,created_at,active&order=created_at.desc').catch(() => []),
      ler('lojas_publicas?select=dono_id').catch(() => [])
    ]);
    lojas.forEach(l => { if (l.dono_id) urls.push({ loc: BASE + '/loja.html?f=' + l.dono_id, freq: 'weekly', pri: '0.6' }); });
    prods.filter(p => p.active !== false && p.id).forEach(p => urls.push({ loc: BASE + '/produto-bbabilonia.html?id=' + p.id, mod: dia(p.created_at), freq: 'weekly', pri: '0.8' }));
  } catch (e) {}
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.slice(0, 50000).map(u => '<url><loc>' + esc(u.loc) + '</loc>' + (u.mod ? '<lastmod>' + u.mod + '</lastmod>' : '') + '<changefreq>' + u.freq + '</changefreq><priority>' + u.pri + '</priority></url>').join('\n') +
    '\n</urlset>\n';
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
};

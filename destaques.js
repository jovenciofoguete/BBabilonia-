/* destaques.js — B-Babilônia: fila "⭐ Em destaque" no topo da página inicial.
   Mostra primeiro os produtos com destaque PAGO ainda dentro do prazo (saem sozinhos quando o tempo acaba),
   depois os escolhidos pelo dono no Painel do dono › Destaques da página inicial. Sem nenhum, não aparece nada. Não altera index.html. */
(function () {
  if (window.__bbDestaques) return; window.__bbDestaques = 1;
  var pg = location.pathname.split("/").pop() || "index.html";
  if (pg !== "index.html") return;
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var H = { apikey: KEY, Authorization: "Bearer " + KEY };
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function arr(x) { if (typeof x === "string") { try { x = JSON.parse(x); } catch (e) { x = []; } } return Array.isArray(x) ? x : []; }
  function foto(p) { if (p.image_url) return p.image_url; var a = arr(p.images)[0]; return typeof a === "string" ? a : (a && (a.url || a.foto || a.src)) || ""; }
  function preco(p, tx) {
    try { if (window.BBPrefs && BBPrefs.converter && tx) { var c = BBPrefs.converter(Number(p.price || 0), p.currency || "MZN", tx); return Number(c.valor).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + c.moeda; } } catch (e) {}
    return Number(p.price || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (p.currency || "MZN");
  }
  var css = document.createElement("style");
  css.textContent = "#bb-dest{margin:2px 0 12px}#bb-dest h2{font-family:'Sora',sans-serif;font-size:15px;margin:0 4px 8px}" +
    "#bb-dest .fila{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}#bb-dest .fila::-webkit-scrollbar{display:none}" +
    "#bb-dest a{flex:0 0 38%;max-width:170px;background:#fff;border-radius:8px;overflow:hidden;color:inherit;text-decoration:none;position:relative}" +
    "#bb-dest img,#bb-dest .sf{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:#fafafa}" +
    "#bb-dest span{display:block;font-size:12.5px;padding:5px 7px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    "#bb-dest b{display:block;font-size:14px;padding:0 7px 7px}#bb-dest i{position:absolute;left:6px;top:6px;font-style:normal;background:#FF6A00;color:#fff;font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:5px}";
  document.head.appendChild(css);

  async function iniciar() {
    try {
      var ids = [], visto = {};
      function juntar(l) { (Array.isArray(l) ? l : []).forEach(function (x) { var k = String(x.produto_id); if (!visto[k]) { visto[k] = 1; ids.push(x.produto_id); } }); }
      /* pagos: só os que ainda não acabaram (o servidor também esconde os acabados) */
      try {
        var pg2 = await (await fetch(SUPA + "/rest/v1/destaque_ativos?select=produto_id,ate&ate=gt." + encodeURIComponent(new Date().toISOString()) + "&limit=200", { headers: H })).json();
        /* muitos pagos: baralha de cada vez que a página abre, para todos aparecerem de forma justa */
        if (Array.isArray(pg2)) { for (var i = pg2.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = pg2[i]; pg2[i] = pg2[j]; pg2[j] = t; } }
        juntar(pg2);
      } catch (e) {}
      try {
        var d = await (await fetch(SUPA + "/rest/v1/destaques?select=produto_id,ordem&order=ordem.asc&limit=20", { headers: H })).json();
        juntar(d);
      } catch (e) {}
      ids = ids.slice(0, 24);
      if (!ids.length) return;
      var l = await (await fetch(SUPA + "/rest/v1/products?select=*&id=in.(" + ids.map(encodeURIComponent).join(",") + ")", { headers: H })).json();
      if (!Array.isArray(l)) return;
      var por = {}; l.forEach(function (p) { if (p.active !== false) por[String(p.id)] = p; });
      var lista = ids.map(function (i) { return por[String(i)]; }).filter(Boolean);
      if (!lista.length) return;
      var tx = null; try { if (window.BBPrefs && BBPrefs.taxas) tx = await BBPrefs.taxas(); } catch (e) {}
      var antes = document.querySelector("main .titulo"); if (!antes) return;
      var s = document.createElement("section"); s.id = "bb-dest";
      s.innerHTML = "<h2>⭐ Em destaque</h2><div class=\"fila\">" + lista.map(function (p) {
        var f = foto(p);
        return '<a href="produto-bbabilonia.html?id=' + encodeURIComponent(p.id) + '"><i>⭐</i>' + (f ? '<img loading="lazy" alt="' + esc(p.name) + '" src="' + esc(f) + '">' : '<div class="sf"></div>') +
          "<span>" + esc(p.name || "Produto") + "</span><b>" + esc(preco(p, tx)) + "</b></a>";
      }).join("") + "</div>";
      antes.parentNode.insertBefore(s, antes);
    } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();

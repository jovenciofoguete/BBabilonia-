/* destaques.js — B-Babilônia: faixa "⭐ Em destaque" no topo da página inicial, como um slide.
   Cada grupo entra em fila da esquerda para a direita e sai: só fotos (5 ou mais de uma vez, conforme o ecrã, 5 s) ou só vídeos (1 ou 2 sozinhos, 10 s). Nunca misturados. O tempo corre sempre, sem esperar pelo cliente. Clicar leva à loja do produto.
   Só carrega lotes pequenos ao acaso do servidor, por isso funciona igual com milhões de destaques.
   Pagos (dentro do prazo) primeiro; depois os escolhidos pelo dono. Os produtos são os mesmos da lista:
   vídeo fica no grupo dos vídeos (etiqueta "Vídeo") e foto entre as fotos. Não altera index.html. */
(function () {
  if (window.__bbDestaques) return; window.__bbDestaques = 1;
  var pg = location.pathname.split("/").pop() || "index.html";
  if (pg !== "index.html") return;
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var H = { apikey: KEY, Authorization: "Bearer " + KEY };
  var T_FOTO = 5000, T_VIDEO = 10000, LOTE = 24;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function arr(x) { if (typeof x === "string") { try { x = JSON.parse(x); } catch (e) { x = []; } } return Array.isArray(x) ? x : []; }
  function foto(p) { if (p.image_url) return p.image_url; var a = arr(p.images)[0]; return typeof a === "string" ? a : (a && (a.url || a.foto || a.src)) || ""; }
  function preco(p, tx) {
    try { if (window.BBPrefs && BBPrefs.converter && tx) { var c = BBPrefs.converter(Number(p.price || 0), p.currency || "MZN", tx); return Number(c.valor).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + c.moeda; } } catch (e) {}
    return Number(p.price || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (p.currency || "MZN");
  }
  var css = document.createElement("style");
  css.textContent = "#bb-dest{margin:2px 0 12px;overflow:hidden}#bb-dest h2{font-family:'Sora',sans-serif;font-size:15px;margin:0 4px 8px}" +
    "#bb-dest .fila{display:flex;gap:6px;min-height:60px}" +
    "#bb-dest a{position:relative;display:block;flex:1 1 0;min-width:0;background:#fff;border-radius:8px;overflow:hidden;color:inherit;text-decoration:none;animation:bbe .45s both}" +
    "#bb-dest .fila.sai a{animation:bbs .35s both}" +
    "@keyframes bbe{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}" +
    "@keyframes bbs{to{opacity:0;transform:translateX(40px)}}" +
    "#bb-dest .m{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:#111}" +
    "#bb-dest .vd .m{aspect-ratio:9/12}" +
    "#bb-dest .nm{display:block;font-size:11.5px;padding:4px 6px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    "#bb-dest .pr{display:block;font-size:12.5px;font-weight:700;padding:0 6px 6px}" +
    "#bb-dest i{position:absolute;left:5px;top:5px;font-style:normal;background:#FF6A00;color:#fff;font-size:10px;font-weight:800;padding:1px 6px;border-radius:5px}";
  document.head.appendChild(css);

  var imgs = [], vids = [], vistos = {}, sec = null, caixa = null, tx = null, timer = null, ativo = true, primeiro = true, aCarregar = false, fixos = [], vez = 0, naFila = {}, passados = {}, nPassados = 0, visivel = true, gesto = false;

  async function contar() {
    try {
      var r = await fetch(SUPA + "/rest/v1/destaque_ativos?select=produto_id&ate=gt." + encodeURIComponent(new Date().toISOString()), { headers: Object.assign({ Prefer: "count=exact", "Range-Unit": "items", Range: "0-0" }, H) });
      var c = (r.headers.get("content-range") || "").split("/")[1]; return Number(c) || 0;
    } catch (e) { return 0; }
  }
  async function lote() {
    if (aCarregar) return; aCarregar = true;
    try {
      var ids = [];
      if (primeiro) {
        primeiro = false;
        try { var d = await (await fetch(SUPA + "/rest/v1/destaques?select=produto_id,ordem&order=ordem.asc&limit=20", { headers: H })).json(); if (Array.isArray(d)) fixos = d.map(function (x) { return x.produto_id; }); } catch (e) {}
      }
      var n = await contar();
      if (n > 0) {
        var off = n > LOTE ? Math.floor(Math.random() * (n - LOTE + 1)) : 0;
        try {
          var l = await (await fetch(SUPA + "/rest/v1/destaque_ativos?select=produto_id,ate&ate=gt." + encodeURIComponent(new Date().toISOString()) + "&offset=" + off + "&limit=" + LOTE, { headers: H })).json();
          if (Array.isArray(l)) { for (var i = l.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = l[i]; l[i] = l[j]; l[j] = t; } ids = l.map(function (x) { return x.produto_id; }); }
        } catch (e) {}
      }
      fixos.forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
      if (!ids.length) return;
      var ps = await (await fetch(SUPA + "/rest/v1/products?select=*&id=in.(" + ids.map(encodeURIComponent).join(",") + ")", { headers: H })).json();
      if (!Array.isArray(ps)) return;
      var por = {}; ps.forEach(function (p) { if (p.active !== false) por[String(p.id)] = p; });
      ids.forEach(function (id) {
        var p = por[String(id)]; if (!p || naFila[String(id)] || passados[String(id)]) return; naFila[String(id)] = 1;
        if (p.video_url) vids.push(p); else if (foto(p)) imgs.push(p);
      });
    } catch (e) {} finally { aCarregar = false; }
  }

  function larg() { return (sec && sec.clientWidth) || document.documentElement.clientWidth || 360; }
  function nImgs() { return Math.min(10, Math.max(5, Math.floor(larg() / 90))); }
  function nVids() { return Math.max(2, Math.floor(larg() / 170)); }
  function tirar(lista, n) { var g = []; while (g.length < n && lista.length) { var p = lista.shift(); delete naFila[String(p.id)]; g.push(p); } return g; }

  /* som: o 1.º vídeo da fila toca com o seu áudio (voz/música) quando a faixa está no ecrã e o cliente já tocou/mexeu na página
     (os telemóveis só deixam ter som depois disso); fora do ecrã fica sem som, mas o tempo continua a contar */
  function somAjustar() {
    if (!caixa) return;
    caixa.querySelectorAll("video").forEach(function (v) {
      var quer = gesto && visivel && v.getAttribute("data-som") === "1";
      if (v.muted === quer) { v.muted = !quer; if (quer) { try { var pr = v.play(); if (pr && pr.catch) pr.catch(function () { v.muted = true; }); } catch (e) {} } }
    });
  }
  function parar() { if (timer) { clearTimeout(timer); timer = null; } }
  async function proximo() {
    parar();
    var querVideo = (vez++ % 2) === 1;
    if (imgs.length < nImgs() || vids.length < nVids()) await lote();
    var grupo, video = querVideo;
    if (video && !vids.length) video = false;
    if (!video && !imgs.length) video = vids.length > 0;
    grupo = video ? tirar(vids, nVids()) : tirar(imgs, nImgs());
    grupo.forEach(function (p) { passados[String(p.id)] = 1; });
    if (++nPassados % 40 === 0) passados = {};
    if (!grupo.length) { if (sec && !caixa.children.length) sec.style.display = "none"; var tinha = Object.keys(passados).length; passados = {}; timer = setTimeout(proximo, tinha ? 1000 : 15000); return; }
    var anterior = caixa.querySelector(".fila");
    if (anterior) { anterior.classList.add("sai"); await new Promise(function (r) { setTimeout(r, 350); }); }
    mostrar(grupo, video);
  }
  function mostrar(grupo, video) {
    sec.style.display = "";
    var dur = video ? T_VIDEO : T_FOTO;
    var fila = document.createElement("div"); fila.className = "fila" + (video ? " vd" : "");
    fila.innerHTML = grupo.map(function (p, k) {
      var f = foto(p);
      var m = video ? '<video class="m" muted playsinline autoplay loop preload="metadata"' + (f ? ' poster="' + esc(f) + '"' : "") + ' src="' + esc(p.video_url) + '"></video>'
        : '<img class="m" alt="' + esc(p.name) + '" src="' + esc(f) + '">';
      return '<a style="animation-delay:' + (k * 90) + 'ms" href="' + (p.supplier_id ? 'loja.html?f=' + encodeURIComponent(p.supplier_id) : 'produto-bbabilonia.html?id=' + encodeURIComponent(p.id)) + '"><i>⭐' + (video ? " Vídeo" : "") + "</i>" + m +
        '<span class="nm">' + esc(p.name || "Produto") + '</span><span class="pr">' + esc(preco(p, tx)) + "</span></a>";
    }).join("");
    caixa.innerHTML = ""; caixa.appendChild(fila);
    fila.querySelectorAll("video").forEach(function (v, k) {
      v.muted = true; try { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
      v.setAttribute("data-som", k === 0 ? "1" : "0");
      v.addEventListener("error", function () { var a = v.closest("a"); if (a) a.remove(); if (!fila.querySelector("a")) proximo(); });
    });
    somAjustar();
    timer = setTimeout(proximo, dur);
  }

  async function iniciar() {
    try {
      var antes = document.querySelector("main .titulo"); if (!antes) return;
      await lote(); if (!imgs.length && !vids.length) return;
      try { if (window.BBPrefs && BBPrefs.taxas) tx = await BBPrefs.taxas(); } catch (e) {}
      sec = document.createElement("section"); sec.id = "bb-dest";
      sec.innerHTML = "<h2>⭐ Em destaque</h2><div class=\"caixa\"></div>";
      caixa = sec.querySelector(".caixa");
      antes.parentNode.insertBefore(sec, antes);
      try { new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; somAjustar(); }, { threshold: 0.4 }).observe(sec); } catch (e) {}
      ["touchstart", "click", "keydown", "scroll"].forEach(function (ev) { window.addEventListener(ev, function () { gesto = true; somAjustar(); }, { passive: true }); });
      vez = imgs.length ? 0 : 1;
      proximo();
    } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();

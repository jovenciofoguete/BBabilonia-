/* imagem-na-loja.js — B-Babilônia
   Pesquisa por imagem igual ao Alibaba:
   1) foto em ecrã inteiro escuro com "A pesquisar…" e botão ✕
   2) sobe uma janela com os objetos da foto no topo, pesquisa, categorias,
      "Ordenar por" e a grelha de produtos parecidos.
   A página inicial por baixo não é alterada. */
(function () {
  if (window.__bbImgLoja) return; window.__bbImgLoja = true;

  var LIBS = [
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js",
    "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js",
    "forma-comum.js"
  ];
  var F = null, indice = [], semForma = [], preparar = null, vez = 0, urlAnt = null, aCompletar = null;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- estilos ---------- */
  var css = document.createElement("style");
  css.textContent = [
    "#bbiLoad{position:fixed;inset:0;z-index:100000;background:#000;display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:inherit}",
    "#bbiLoad .ft{position:relative;width:100%;max-height:58vh;display:flex;justify-content:center;overflow:hidden}",
    "#bbiLoad .ft img{max-width:100%;max-height:58vh;object-fit:contain;filter:brightness(.6)}",
    "#bbiLoad .ft i{position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#FF6A00,transparent);animation:bbiScan 1.6s linear infinite}",
    "@keyframes bbiScan{from{top:0}to{top:100%}}",
    "#bbiLoad .gira{width:38px;height:38px;border:3px solid #fff;border-right-color:transparent;border-radius:50%;margin:26px 0 14px;animation:bbiGira .8s linear infinite}",
    "@keyframes bbiGira{to{transform:rotate(360deg)}}",
    "#bbiLoad p{margin:0 20px;font-size:16px;text-align:center}",
    "#bbiLoad button{margin-top:30px;width:44px;height:44px;border-radius:50%;border:1.5px solid #fff;background:transparent;color:#fff;font-size:20px;cursor:pointer}",
    "#bbiFolha{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.45);display:none}",
    "#bbiFolha .caixa{position:absolute;left:0;right:0;bottom:0;top:4vh;background:#fff;border-radius:16px 16px 0 0;display:flex;flex-direction:column;transform:translateY(100%);transition:transform .28s ease}",
    "#bbiFolha.on .caixa{transform:none}",
    "#bbiFolha .puxa{width:42px;height:4px;border-radius:2px;background:#ddd;margin:8px auto 4px;flex:none}",
    "#bbiFolha .topo{display:flex;align-items:center;gap:8px;padding:4px 10px 8px;flex:none}",
    "#bbiObjs{display:flex;gap:6px;overflow-x:auto;flex:0 1 auto;max-width:48%;scrollbar-width:none;padding-bottom:6px}",
    "#bbiObjs::-webkit-scrollbar{display:none}",
    "#bbiObjs canvas{flex:none;width:50px;height:50px;border-radius:6px;border:2px solid transparent;background:#f3f3f3;cursor:pointer;position:relative}",
    "#bbiObjs canvas.on{border-color:#222}",
    "#bbiFolha .busca{flex:1;min-width:0;display:flex;align-items:center;gap:6px;background:#f2f2f2;border-radius:999px;padding:0 12px;height:40px}",
    "#bbiFolha .busca svg{flex:none;width:18px;height:18px;color:#555}",
    "#bbiFolha .busca input{flex:1;min-width:0;border:0;background:transparent;font:inherit;font-size:14.5px;outline:none}",
    "#bbiFechar{flex:none;border:0;background:transparent;font-size:24px;line-height:1;width:34px;height:34px;cursor:pointer;color:#222}",
    "#bbiCats{display:flex;gap:18px;overflow-x:auto;padding:10px 14px 6px;border-top:1px solid #eee;flex:none;scrollbar-width:none}",
    "#bbiCats::-webkit-scrollbar{display:none}",
    "#bbiCats button{flex:none;border:0;background:none;font:inherit;font-size:14.5px;color:#444;padding:4px 0;cursor:pointer;white-space:nowrap}",
    "#bbiCats button.on{font-weight:800;color:#111}",
    "#bbiFolha .filtros{display:flex;gap:8px;padding:6px 12px 10px;flex:none}",
    "#bbiOrdem{border:1.5px solid #222;border-radius:999px;background:#fff;font:inherit;font-size:14px;font-weight:700;padding:7px 12px;color:#111}",
    "#bbiInfo{align-self:center;font-size:12.5px;color:#777}",
    "#bbiLista{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(2,1fr);gap:6px;padding:0 0 30px;align-content:start;background:#fff}",
    "@media(min-width:640px){#bbiLista{grid-template-columns:repeat(4,1fr)}}",
    "#bbiLista a{display:block;color:#222;text-decoration:none;background:#fff}",
    "#bbiLista img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:#f5f5f5}",
    "#bbiLista .n{padding:6px 8px 0;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "#bbiLista .p{padding:2px 8px 0;font-size:17px;font-weight:800}",
    "#bbiLista .m{padding:1px 8px 8px;font-size:12.5px;color:#666}",
    "#bbiLista .vazio{grid-column:1/-1;text-align:center;color:#777;padding:40px 16px;font-size:14px}",
    "#bbiLista .vazio button{margin-top:12px;border:0;background:#FF6A00;color:#fff;font:inherit;font-weight:700;padding:10px 20px;border-radius:999px}"
  ].join("");
  document.head.appendChild(css);

  /* ---------- ecrã de carregamento ---------- */
  var load = document.createElement("div"); load.id = "bbiLoad";
  load.innerHTML = '<div class="ft"><img alt=""><i></i></div><div class="gira"></div><p id="bbiMsg">A pesquisar entre todos os produtos…</p>' +
    '<button type="button" aria-label="Cancelar">✕</button>';
  document.body.appendChild(load);
  load.querySelector("button").onclick = function () { fechar(); };

  /* ---------- janela de resultados ---------- */
  var folha = document.createElement("div"); folha.id = "bbiFolha";
  folha.innerHTML =
    '<div class="caixa"><div class="puxa"></div>' +
    '<div class="topo"><div id="bbiObjs"></div>' +
    '<label class="busca"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
    '<input id="bbiTxt" type="search" placeholder="Inserir detalhes" autocomplete="off"></label>' +
    '<button type="button" id="bbiFechar" aria-label="Fechar">✕</button></div>' +
    '<div id="bbiCats"></div>' +
    '<div class="filtros"><select id="bbiOrdem" aria-label="Ordenar por">' +
    '<option value="parecido">Ordenar por: mais parecidos</option><option value="baixo">Preço mais baixo</option><option value="alto">Preço mais alto</option></select>' +
    '<span id="bbiInfo"></span></div>' +
    '<div id="bbiLista"></div></div>';
  document.body.appendChild(folha);
  folha.addEventListener("click", function (e) { if (e.target === folha) fechar(); });
  $("bbiFechar").onclick = function () { fechar(); };
  $("bbiTxt").addEventListener("input", function () { desenharLista(); });
  $("bbiOrdem").addEventListener("change", function () { desenharLista(); });

  /* ---------- campo de ficheiro escondido (câmara ou galeria) ---------- */
  var fich = document.createElement("input");
  fich.type = "file"; fich.accept = "image/*"; fich.hidden = true;
  document.body.appendChild(fich);
  fich.addEventListener("change", procurar);

  /* o botão da câmara abre a foto aqui, sem ir para outra página */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#bb-camara");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    prepararTudo();
    fich.click();
  }, true);

  /* botão "voltar" do telemóvel fecha a pesquisa por imagem */
  var aberto = false;
  window.addEventListener("popstate", function () { if (aberto) fechar(true); });
  function abrirHistoria() { if (!aberto) { aberto = true; try { history.pushState({ bbImg: 1 }, ""); } catch (e) {} } }

  /* ---------- preparar analisador e produtos ---------- */
  function js(src) {
    return new Promise(function (ok, falha) {
      var ja = Array.prototype.some.call(document.scripts, function (s) { return s.src && s.src.indexOf(src) !== -1; });
      if (ja && (src !== "forma-comum.js" || window.FormaBB)) return ok();
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = function () { falha(new Error("Sem internet")); };
      document.head.appendChild(s);
    });
  }
  function prepararTudo() {
    if (!preparar) {
      preparar = (async function () {
        for (var i = 0; i < LIBS.length; i++) await js(LIBS[i]);
        F = window.FormaBB;
        await Promise.all([F.carregarModelo(), lerIndice()]);
      })();
      preparar.catch(function () { preparar = null; });
    }
    return preparar;
  }
  async function lerIndice() {
    var h = { apikey: F.SUPA_KEY, Authorization: "Bearer " + F.SUPA_KEY };
    var lista = [];
    for (var ini = 0; ini < 20000; ini += 1000) {
      var r = await fetch(F.SUPA_URL + "/rest/v1/products?select=*&offset=" + ini + "&limit=1000", { headers: h });
      if (!r.ok) throw new Error("Não foi possível ler os produtos (" + r.status + ")");
      var parte = await r.json(); lista = lista.concat(parte);
      if (parte.length < 1000) break;
    }
    indice = []; semForma = [];
    lista.forEach(function (p) {
      var f = p.forma;
      if (typeof f === "string") { try { f = JSON.parse(f); } catch (e) { f = null; } }
      var fotos = F.fotosDe(p);
      if (!fotos.length) return;
      if (!Array.isArray(f) || !f.length) { semForma.push(p); return; }
      f.forEach(function (txt, i) { try { indice.push({ p: p, foto: fotos[i] || fotos[0], v: F.descodificar(txt) }); } catch (e) {} });
    });
  }
  /* produtos novos sem forma guardada: calcula em segundo plano */
  async function completar() {
    var falta = semForma.splice(0, 40);
    for (var i = 0; i < falta.length; i++) {
      var p = falta[i], foto = F.fotosDe(p)[0];
      try { var im = await F.carregarImg(foto); indice.push({ p: p, foto: foto, v: await F.vetor(im) }); } catch (e) {}
    }
  }

  /* ---------- zonas da foto (objetos) — igual ao busca-imagem-v3 ---------- */
  function caixasDe(base, R, juntar) {
    var gw = 120, gh = Math.max(1, Math.round(120 * R.h / R.w));
    var g = document.createElement("canvas"); g.width = gw; g.height = gh;
    var gx = g.getContext("2d", { willReadFrequently: true }); gx.drawImage(base, R.x, R.y, R.w, R.h, 0, 0, gw, gh);
    var px = gx.getImageData(0, 0, gw, gh).data, cz = new Float32Array(gw * gh), i, x, y;
    for (i = 0; i < gw * gh; i++) cz[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    var borda = new Uint8Array(gw * gh);
    for (y = 1; y < gh - 1; y++) for (x = 1; x < gw - 1; x++) {
      i = y * gw + x;
      if (Math.abs(cz[i + 1] - cz[i - 1]) + Math.abs(cz[i + gw] - cz[i - gw]) > 28) borda[i] = 1;
    }
    for (var r = 0; r < juntar; r++) {
      var n = new Uint8Array(gw * gh);
      for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) {
        var v = 0;
        for (var dy = -1; dy <= 1 && !v; dy++) for (var dx = -1; dx <= 1; dx++) {
          var xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < gw && yy < gh && borda[yy * gw + xx]) { v = 1; break; }
        }
        n[y * gw + x] = v;
      }
      borda = n;
    }
    var visto = new Uint8Array(gw * gh), caixas = [], fila = new Int32Array(gw * gh);
    for (i = 0; i < gw * gh; i++) {
      if (!borda[i] || visto[i]) continue;
      var ini = 0, fim = 0, x0 = gw, y0 = gh, x1 = 0, y1 = 0; fila[fim++] = i; visto[i] = 1;
      while (ini < fim) {
        var k = fila[ini++], kx = k % gw, ky = (k - kx) / gw;
        if (kx < x0) x0 = kx; if (kx > x1) x1 = kx; if (ky < y0) y0 = ky; if (ky > y1) y1 = ky;
        var viz = [k - 1, k + 1, k - gw, k + gw];
        for (var t = 0; t < 4; t++) {
          var j = viz[t];
          if (j < 0 || j >= gw * gh || visto[j] || !borda[j]) continue;
          if ((j === k - 1 && kx === 0) || (j === k + 1 && kx === gw - 1)) continue;
          visto[j] = 1; fila[fim++] = j;
        }
      }
      var bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      if (bw < 8 || bh < 8 || bw * bh < gw * gh * 0.02) continue;
      if (bw * bh > gw * gh * 0.85) continue;
      var pad = Math.round(Math.max(bw, bh) * 0.06);
      var X0 = Math.max(0, x0 - pad), Y0 = Math.max(0, y0 - pad), X1 = Math.min(gw - 1, x1 + pad), Y1 = Math.min(gh - 1, y1 + pad);
      caixas.push({ x: R.x + Math.round(X0 / gw * R.w), y: R.y + Math.round(Y0 / gh * R.h), w: Math.round((X1 - X0 + 1) / gw * R.w), h: Math.round((Y1 - Y0 + 1) / gh * R.h), objeto: true });
    }
    return caixas;
  }
  function zonas(base) {
    var W = base.width, H = base.height, A = W * H, toda = { x: 0, y: 0, w: W, h: H, inteira: true };
    var obj = caixasDe(base, toda, 2);
    obj.slice().forEach(function (c) {
      if (c.w * c.h < A * 0.1) return;
      caixasDe(base, c, 0).forEach(function (d) { if (d.w * d.h < c.w * c.h * 0.8) obj.push(d); });
    });
    obj.sort(function (a, b) { return b.w * b.h - a.w * a.h; }); obj = obj.slice(0, 16);
    var R = (obj[0] && obj[0].w * obj[0].h >= A * 0.1) ? obj[0] : toda;
    var g = document.createElement("canvas"), gw = 48, gh = Math.max(1, Math.round(48 * H / W));
    g.width = gw; g.height = gh; var gx = g.getContext("2d", { willReadFrequently: true }); gx.drawImage(base, 0, 0, gw, gh);
    var px = gx.getImageData(0, 0, gw, gh).data;
    function variedade(z) {
      var x0 = Math.floor(z.x / W * gw), y0 = Math.floor(z.y / H * gh), x1 = Math.ceil((z.x + z.w) / W * gw), y1 = Math.ceil((z.y + z.h) / H * gh);
      var s = 0, s2 = 0, n = 0;
      for (var y = y0; y < y1 && y < gh; y++) for (var x = x0; x < x1 && x < gw; x++) {
        var k = (y * gw + x) * 4, v = 0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2]; s += v; s2 += v * v; n++;
      }
      return n ? Math.sqrt(Math.max(0, s2 / n - (s / n) * (s / n))) : 0;
    }
    var grelha = [], m = Math.min(R.w, R.h);
    [0.9, 0.7, 0.5].forEach(function (f) {
      var t = Math.max(1, Math.round(m * f)), passo = Math.max(1, Math.round(t / 2)), xs = [], ys = [], x, y;
      for (x = R.x; x + t <= R.x + R.w; x += passo) xs.push(x); if (xs.length && xs[xs.length - 1] + t < R.x + R.w) xs.push(R.x + R.w - t);
      for (y = R.y; y + t <= R.y + R.h; y += passo) ys.push(y); if (ys.length && ys[ys.length - 1] + t < R.y + R.h) ys.push(R.y + R.h - t);
      ys.forEach(function (yy) { xs.forEach(function (xx) { var z = { x: xx, y: yy, w: t, h: t, grelha: true }; z.v = variedade(z); if (z.v >= 20) grelha.push(z); }); });
    });
    grelha.sort(function (a, b) { return b.v - a.v; });
    return [toda].concat(obj, grelha.slice(0, 12));
  }
  function recorte(base, z, lado) {
    var c = document.createElement("canvas"), e = lado ? lado / Math.max(z.w, z.h) : 1;
    c.width = Math.max(1, Math.round(z.w * e)); c.height = Math.max(1, Math.round(z.h * e));
    c.getContext("2d").drawImage(base, z.x, z.y, z.w, z.h, 0, 0, c.width, c.height);
    return c;
  }
  async function vetores(base, lista) {
    var m = await F.carregarModelo(), L = F.LADO, out = [];
    try {
      for (var i = 0; i < lista.length; i += 8) {
        var parte = lista.slice(i, i + 8), cvs = [];
        parte.forEach(function (z) {
          var cv = F.prepararForma(recorte(base, z, 320));
          var esp = document.createElement("canvas"); esp.width = esp.height = L;
          var e = esp.getContext("2d"); e.translate(L, 0); e.scale(-1, 1); e.drawImage(cv, 0, 0);
          cvs.push(cv, esp);
        });
        var lote = tf.tidy(function () { return tf.stack(cvs.map(function (c) { return tf.browser.fromPixels(c); })); });
        var r = m.infer(lote, true); lote.dispose();
        var d = await r.data(), n = d.length / cvs.length; r.dispose();
        for (var k = 0; k < parte.length; k++) {
          var v = new Float32Array(n), s = 0, j;
          for (j = 0; j < n; j++) { v[j] = (d[(2 * k) * n + j] + d[(2 * k + 1) * n + j]) / 2; s += v[j] * v[j]; }
          s = Math.sqrt(s) || 1; for (j = 0; j < n; j++) v[j] /= s;
          out.push(v);
        }
      }
    } catch (e) {
      out.length = 0;
      for (var q = 0; q < lista.length; q++) out.push(await F.vetor(recorte(base, lista[q], 320)));
    }
    return out;
  }
  function comparar(q) {
    var melhor = new Map();
    indice.forEach(function (it) {
      var s = 0, v = it.v;
      for (var i = 0; i < v.length; i++) s += q[i] * v[i];
      var ant = melhor.get(it.p.id);
      if (!ant || s > ant.nota) melhor.set(it.p.id, { p: it.p, foto: it.foto, nota: s });
    });
    var ord = Array.from(melhor.values()).sort(function (a, b) { return b.nota - a.nota; });
    var topo = ord.length ? ord[0].nota : 0;
    return { topo: topo, res: ord.filter(function (x) { return x.nota >= 0.6 && x.nota >= topo - 0.12; }).slice(0, 40) };
  }
  function sobrepoe(a, b) {
    var ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    var iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return ix * iy / Math.min(a.w * a.h, b.w * b.h) > 0.5;
  }
  function dentro(p, g) {
    var ix = Math.max(0, Math.min(p.x + p.w, g.x + g.w) - Math.max(p.x, g.x)), iy = Math.max(0, Math.min(p.y + p.h, g.y + g.h) - Math.max(p.y, g.y));
    return p !== g && p.w * p.h < g.w * g.h && ix * iy > p.w * p.h * 0.8;
  }

  /* ---------- mostrar ---------- */
  var atual = null;   // { escolhas:[{z,res}], sel, base, cat }
  function txt(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function semAc(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function preco(p) {
    try { if (typeof precoConv === "function") return precoConv(p); } catch (e) {}
    return Number(p.price || 0).toLocaleString("pt-PT") + " " + (p.currency || "MZN");
  }
  function listaCats() { try { return (typeof categorias !== "undefined" && Array.isArray(categorias)) ? categorias : []; } catch (e) { return []; } }
  function nomeCat(id) {
    var c = listaCats().find(function (x) { return x.id === id; });
    return c ? (c.name || c.nome || "") : "";
  }
  function minimo(p) {
    var v = p.pedido_minimo || p.min_order || p.moq || p.quantidade_minima || p.min_qty;
    return v ? "Pedido mínimo: " + v + (Number(v) === 1 ? " peça" : " peças") : "";
  }

  function mostrarCarregar(url) {
    load.querySelector("img").src = url;
    $("bbiMsg").textContent = (!F || !indice.length) ? "A preparar a pesquisa (só demora na primeira vez)…" : "A pesquisar entre todos os produtos…";
    folha.classList.remove("on"); folha.style.display = "none";
    load.style.display = "flex";
    abrirHistoria();
  }
  function mostrarFolha() {
    load.style.display = "none";
    folha.style.display = "block";
    requestAnimationFrame(function () { requestAnimationFrame(function () { folha.classList.add("on"); }); });
    document.documentElement.style.overflow = "hidden";
  }
  function fechar(vindoDoVoltar) {
    vez++;
    load.style.display = "none";
    folha.classList.remove("on"); folha.style.display = "none";
    document.documentElement.style.overflow = "";
    var estava = aberto; aberto = false;
    if (estava && !vindoDoVoltar) { try { history.back(); } catch (e) {} }
  }

  function desenharObjetos() {
    var o = $("bbiObjs"); o.innerHTML = "";
    atual.escolhas.forEach(function (a, i) {
      var c = recorte(atual.base, a.z, 100), q = document.createElement("canvas"); q.width = q.height = 100;
      var qx = q.getContext("2d"); qx.fillStyle = "#f3f3f3"; qx.fillRect(0, 0, 100, 100);
      qx.drawImage(c, (100 - c.width) / 2, (100 - c.height) / 2);
      if (i === atual.sel) q.className = "on";
      q.setAttribute("aria-label", i === 0 ? "Foto inteira" : "Objeto " + i);
      q.onclick = function () { atual.sel = i; atual.cat = null; desenharObjetos(); desenharCats(); desenharLista(); $("bbiLista").scrollTop = 0; };
      o.appendChild(q);
    });
    var on = o.querySelector(".on"); if (on && on.scrollIntoView) try { on.scrollIntoView({ inline: "nearest", block: "nearest" }); } catch (e) {}
  }
  function resAtual() { var a = atual &&

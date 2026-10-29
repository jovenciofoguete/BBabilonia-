/* imagem-na-loja.js — B-Babilônia
   Pesquisa por imagem como no Alibaba: toca na câmara, escolhe/tira a foto
   e os resultados aparecem na própria página inicial (mesmo cabeçalho, mesma grelha).
   Ficheiro novo: não altera nada do que já funciona. */
(function () {
  if (window.__bbImgLoja) return; window.__bbImgLoja = true;

  var LIBS = [
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js",
    "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js",
    "forma-comum.js"
  ];
  var F = null, indice = [], semForma = [], preparar = null, vez = 0, urlAnt = null;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- estilos ---------- */
  var css = document.createElement("style");
  css.textContent =
    "#bbImgThumb{flex:none;position:relative;width:34px;height:34px;margin-left:4px;border-radius:8px;overflow:hidden;border:1.5px solid #FF6A00}" +
    "#bbImgThumb img{width:100%;height:100%;object-fit:cover;display:block}" +
    "#bbImgSair{flex:none;border:0;background:#eee;color:#333;width:24px;height:24px;border-radius:50%;margin:0 2px 0 4px;font-size:13px;line-height:24px;cursor:pointer}" +
    "#bbImgObjs{display:none;gap:8px;overflow-x:auto;padding:2px 4px 10px;scrollbar-width:none}" +
    "#bbImgObjs::-webkit-scrollbar{display:none}" +
    "#bbImgObjs canvas{flex:none;width:62px;height:62px;border-radius:8px;border:2px solid #ddd;background:#fff;cursor:pointer}" +
    "#bbImgObjs canvas.on{border-color:#FF6A00}" +
    "#bbImgObjs p{flex:none;align-self:center;font-size:12px;color:#777;margin:0 4px 0 0;max-width:70px;line-height:1.2}" +
    ".card .bbParec{font-size:11px;color:#2e7d32;margin-top:2px}";
  document.head.appendChild(css);

  /* ---------- campo de ficheiro escondido (câmara ou galeria) ---------- */
  var fich = document.createElement("input");
  fich.type = "file"; fich.accept = "image/*"; fich.hidden = true;
  document.body.appendChild(fich);
  fich.addEventListener("change", procurar);

  /* o botão da câmara deixa de abrir outra página e abre a foto aqui */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#bb-camara");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    prepararTudo();               // começa a preparar enquanto escolhe a foto
    fich.click();
  }, true);

  /* escrever na pesquisa ou tocar numa categoria sai do modo imagem */
  document.addEventListener("input", function (e) { if (e.target && e.target.id === "q") sair(false); }, true);
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#cats button")) sair(false); }, true);

  /* se a página inicial se redesenhar sozinha (taxas, moeda), mantém os resultados da imagem */
  var modo = null;   // null = normal; {aviso:"…"} ou {lista:[…]} = pesquisa por imagem
  if (typeof window.desenhar === "function") {
    var desenharOriginal = window.desenhar;
    window.desenhar = function () {
      if (modo && $("bbImgThumb")) { if (modo.lista) mostrar(modo.lista); else aviso(modo.aviso); return; }
      return desenharOriginal.apply(this, arguments);
    };
  }

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
        await completar();
      })();
      preparar.catch(function () { preparar = null; });
    }
    return preparar;
  }
  async function lerIndice() {
    var h = { apikey: F.SUPA_KEY, Authorization: "Bearer " + F.SUPA_KEY };
    var lista = [];
    for (var ini = 0; ini < 20000; ini += 1000) {
      var r = await fetch(F.SUPA_URL + "/rest/v1/products?select=id,name,price,currency,image_url,images,forma,video_url,variants&offset=" + ini + "&limit=1000", { headers: h });
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
  /* produtos novos sem forma guardada: calcula aqui, para também aparecerem */
  async function completar() {
    var falta = semForma.splice(0, 60);
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

  /* ---------- mostrar na página inicial ---------- */
  function txt(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function preco(p) {
    try { if (typeof precoConv === "function") return precoConv(p); } catch (e) {}
    return Number(p.price || 0).toLocaleString("pt-PT") + " " + (p.currency || "MZN");
  }
  function cabecalho(titulo, n) {
    if ($("tituloLista")) $("tituloLista").textContent = titulo;
    if ($("contagem")) $("contagem").textContent = n == null ? "" : n + (n === 1 ? " produto" : " produtos");
  }
  function aviso(t) {
    var g = $("grelha"); if (!g) return;
    modo = { aviso: t };
    g.innerHTML = '<div class="estado"><p>' + txt(t) + "</p></div>";
  }
  function mostrar(lista) {
    var g = $("grelha"); if (!g) return;
    modo = { lista: lista };
    cabecalho("Pesquisa por imagem", lista.length);
    if (!lista.length) {
      g.innerHTML = '<div class="estado"><p>Não encontrámos produtos com esta forma. Tente outra foto com o objeto inteiro.</p><button type="button" id="bbImgOutra">Tentar outra foto</button></div>';
      $("bbImgOutra").onclick = function () { fich.click(); };
      return;
    }
    g.innerHTML = "";
    lista.forEach(function (it) {
      var p = it.p, a = document.createElement("a");
      a.className = "card";
      a.href = "produto-bbabilonia.html?id=" + encodeURIComponent(p.id);
      a.innerHTML =
        '<div class="foto"><img src="' + txt(it.foto || p.image_url) + '" alt="' + txt(p.name) + '" loading="lazy">' +
        (p.video_url ? '<span class="tag">Vídeo</span>' : "") + "</div>" +
        '<div class="info"><h2>' + txt(p.name || "Produto") + '</h2><div class="preco">' + preco(p) + "</div>" +
        '<div class="bbParec">' + Math.round(it.nota * 100) + "% parecido</div></div>";
      g.appendChild(a);
    });
  }
  function linhaObjetos() {
    var o = $("bbImgObjs");
    if (!o) {
      o = document.createElement("div"); o.id = "bbImgObjs";
      var tit = document.querySelector("main .titulo");
      if (tit) tit.parentNode.insertBefore(o, tit); else document.querySelector("main").prepend(o);
    }
    return o;
  }
  function mostrarObjetos(base, achados) {
    var o = linhaObjetos(); o.innerHTML = "";
    if (achados.length < 2) { o.style.display = "none"; return; }
    var t = document.createElement("p"); t.textContent = "Toque no objeto"; o.appendChild(t);
    var melhor = achados[0];
    achados.slice().sort(function (a, b) {
      return Math.abs(a.z.y - b.z.y) > Math.min(a.z.h, b.z.h) / 2 ? a.z.y - b.z.y : a.z.x - b.z.x;
    }).forEach(function (a) {
      var c = recorte(base, a.z, 124), q = document.createElement("canvas"); q.width = q.height = 124;
      var qx = q.getContext("2d"); qx.fillStyle = "#fff"; qx.fillRect(0, 0, 124, 124);
      qx.drawImage(c, (124 - c.width) / 2, (124 - c.height) / 2);
      if (a === melhor) q.className = "on";
      q.onclick = function () {
        o.querySelectorAll("canvas").forEach(function (x) { x.className = ""; });
        q.className = "on"; mostrar(a.res); window.scrollTo({ top: 0, behavior: "smooth" });
      };
      o.appendChild(q);
    });
    o.style.display = "flex";
  }
  function miniatura(url) {
    var form = document.querySelector("header .pesquisa"); if (!form) return;
    var th = $("bbImgThumb");
    if (!th) {
      th = document.createElement("span"); th.id = "bbImgThumb";
      form.insertBefore(th, form.firstChild);
      var x = document.createElement("button"); x.type = "button"; x.id = "bbImgSair"; x.textContent = "✕";
      x.setAttribute("aria-label", "Sair da pesquisa por imagem");
      x.onclick = function () { sair(true); };
      var cam = $("bb-camara");
      if (cam && cam.parentNode === form) form.insertBefore(x, cam); else form.appendChild(x);
    }
    th.innerHTML = '<img alt="Foto pesquisada" src="' + url + '">';
    var q = $("q"); if (q) { q.value = ""; q.placeholder = "Pesquisa por imagem"; }
  }
  function sair(redesenhar) {
    vez++; modo = null;
    ["bbImgThumb", "bbImgSair", "bbImgObjs"].forEach(function (id) { var e = $(id); if (e) e.remove(); });
    var q = $("q"); if (q) q.placeholder = "Pesquisar produtos";
    if (redesenhar && typeof limpar === "function") { try { limpar(); } catch (e) {} }
  }

  /* ---------- procurar ---------- */
  async function procurar() {
    var f = fich.files && fich.files[0];
    fich.value = "";
    if (!f) return;
    var minha = ++vez;
    if (urlAnt) URL.revokeObjectURL(urlAnt);
    var url = urlAnt = URL.createObjectURL(f);
    miniatura(url);
    var o = $("bbImgObjs"); if (o) o.style.display = "none";
    window.scrollTo({ top: 0 });
    cabecalho("Pesquisa por imagem", null);
    aviso("A procurar produtos parecidos…");
    try {
      await prepararTudo();
      if (minha !== vez) return;
      var im = await F.carregarImg(url);
      var e = Math.min(1, 720 / Math.max(im.width, im.height));
      var base = document.createElement("canvas");
      base.width = Math.max(1, Math.round(im.width * e)); base.height = Math.max(1, Math.round(im.height * e));
      base.getContext("2d").drawImage(im, 0, 0, base.width, base.height);
      var lista = zonas(base), vs = await vetores(base, lista);
      if (minha !== vez) return;
      var todas = lista.map(function (z, i) { return Object.assign({ z: z }, comparar(vs[i])); }).filter(function (a) { return a.res.length; });
      todas.sort(function (a, b) { return b.topo - a.topo; });
      var objetos = todas.filter(function (a) { return a.z.objeto; });
      var achados = [];
      for (var i = 0; i < todas.length; i++) {
        var a = todas[i];
        if (!a.z.objeto) continue;
        if (objetos.filter(function (b) { return dentro(b.z, a.z); }).length >= 2) continue;
        if (achados.length && a.topo < 0.65) continue;
        if (!achados.some(function (b) { return sobrepoe(a.z, b.z); })) achados.push(a);
        if (achados.length >= 6) break;
      }
      if (achados.length < 2) achados = todas.length ? [todas[0]] : [];
      mostrarObjetos(base, achados);
      mostrar(achados.length ? achados[0].res : []);
    } catch (err) {
      if (minha === vez) aviso("Não foi possível pesquisar: " + err.message);
    }
  }
})();
    

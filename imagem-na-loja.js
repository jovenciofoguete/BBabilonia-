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
    "forma-comum.js",
    "imagem-analise.js"
  ];
  var F = null, indice = [], semForma = [], preparar = null, vez = 0, urlAnt = null, aCompletar = null;
  var A = null;   // parte 2 (imagem-analise.js)
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
      var pronto = src === "forma-comum.js" ? window.FormaBB : src === "imagem-analise.js" ? window.BBImgAnalise : true;
      if (ja && pronto) return ok();
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = function () { falha(new Error("Sem internet")); };
      document.head.appendChild(s);
    });
  }
  function prepararTudo() {
    if (!preparar) {
      preparar = (async function () {
        for (var i = 0; i < LIBS.length; i++) await js(LIBS[i]);
        F = window.FormaBB; A = window.BBImgAnalise;
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
      var c = A.recorte(atual.base, a.z, 100), q = document.createElement("canvas"); q.width = q.height = 100;
      var qx = q.getContext("2d"); qx.fillStyle = "#f3f3f3"; qx.fillRect(0, 0, 100, 100);
      qx.drawImage(c, (100 - c.width) / 2, (100 - c.height) / 2);
      if (i === atual.sel) q.className = "on";
      q.setAttribute("aria-label", i === 0 ? "Foto inteira" : "Objeto " + i);
      q.onclick = function () { atual.sel = i; atual.cat = null; desenharObjetos(); desenharCats(); desenharLista(); $("bbiLista").scrollTop = 0; };
      o.appendChild(q);
    });
    var on = o.querySelector(".on"); if (on && on.scrollIntoView) try { on.scrollIntoView({ inline: "nearest", block: "nearest" }); } catch (e) {}
  }
  function resAtual() { var a = atual && atual.escolhas[atual.sel]; return a ? a.res : []; }
  function desenharCats() {
    var cont = {}, ordem = [];
    resAtual().forEach(function (it) {
      var n = nomeCat(it.p.category_id); if (!n) return;
      if (!cont[n]) { cont[n] = 0; ordem.push(n); } cont[n]++;
    });
    ordem.sort(function (a, b) { return cont[b] - cont[a]; });
    var box = $("bbiCats"); box.innerHTML = "";
    ["Todos"].concat(ordem.slice(0, 12)).forEach(function (n, i) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = n;
      if ((i === 0 && !atual.cat) || atual.cat === n) b.className = "on";
      b.onclick = function () { atual.cat = i === 0 ? null : n; desenharCats(); desenharLista(); $("bbiLista").scrollTop = 0; };
      box.appendChild(b);
    });
  }
  function desenharLista() {
    if (!atual) return;
    var lista = resAtual().slice(), t = semAc($("bbiTxt").value.trim());
    if (atual.cat) lista = lista.filter(function (it) { return nomeCat(it.p.category_id) === atual.cat; });
    if (t) {
      var pal = t.split(/\s+/);
      lista = lista.filter(function (it) {
        var s = semAc((it.p.name || "") + " " + nomeCat(it.p.category_id) + " " + (it.p.description || it.p.descricao || ""));
        return pal.every(function (w) { return s.indexOf(w) !== -1; });
      });
    }
    var ord = $("bbiOrdem").value;
    if (ord === "baixo") lista.sort(function (a, b) { return Number(a.p.price || 0) - Number(b.p.price || 0); });
    if (ord === "alto") lista.sort(function (a, b) { return Number(b.p.price || 0) - Number(a.p.price || 0); });
    $("bbiInfo").textContent = lista.length + (lista.length === 1 ? " produto" : " produtos");
    var g = $("bbiLista");
    if (!lista.length) {
      g.innerHTML = '<div class="vazio"><p>Não encontrámos produtos parecidos.</p><p>Tente outra foto com o objeto inteiro, ou toque noutro objeto lá em cima.</p><button type="button" id="bbiOutra">Tirar outra foto</button></div>';
      $("bbiOutra").onclick = function () { fich.click(); };
      return;
    }
    g.innerHTML = "";
    lista.forEach(function (it) {
      var p = it.p, a = document.createElement("a"), m = minimo(p);
      a.href = "produto-bbabilonia.html?id=" + encodeURIComponent(p.id);
      a.innerHTML = '<img loading="lazy" alt="' + txt(p.name) + '" src="' + txt(it.foto || p.image_url) + '">' +
        '<div class="n">' + txt(p.name || "Produto") + '</div><div class="p">' + preco(p) + "</div>" +
        (m ? '<div class="m">' + txt(m) + "</div>" : '<div class="m"></div>');
      g.appendChild(a);
    });
  }

  /* ---------- procurar ---------- */
  async function procurar() {
    var f = fich.files && fich.files[0];
    fich.value = "";
    if (!f) return;
    var minha = ++vez;
    if (urlAnt) URL.revokeObjectURL(urlAnt);
    var url = urlAnt = URL.createObjectURL(f);
    mostrarCarregar(url);
    try {
      await prepararTudo();
      if (minha !== vez) return;
      $("bbiMsg").textContent = "A pesquisar entre todos os produtos…";
      var im = await F.carregarImg(url);
      var e = Math.min(1, 720 / Math.max(im.width, im.height));
      var base = document.createElement("canvas");
      base.width = Math.max(1, Math.round(im.width * e)); base.height = Math.max(1, Math.round(im.height * e));
      base.getContext("2d").drawImage(im, 0, 0, base.width, base.height);
      A.usar(F, indice);
      var lista = A.zonas(base), vs = await A.vetores(base, lista);
      if (minha !== vez) return;
      resultado(base, lista, vs, true);
      mostrarFolha();
      /* produtos novos sem forma: calcula depois, sem fazer esperar, e atualiza */
      if (semForma.length && !aCompletar) {
        aCompletar = completar().then(function () {
          aCompletar = null;
          if (minha === vez && aberto) resultado(base, lista, vs, false);
        });
      }
    } catch (err) {
      if (minha !== vez) return;
      $("bbiMsg").textContent = "Não foi possível pesquisar: " + err.message;
      load.querySelector(".gira").style.visibility = "hidden";
      setTimeout(function () { load.querySelector(".gira").style.visibility = ""; }, 4000);
    }
  }
  function resultado(base, lista, vs, novo) {
    A.usar(F, indice);
    var todas = lista.map(function (z, i) { return Object.assign({ z: z }, A.comparar(vs[i])); });
    var inteira = todas[0];                                  // a foto inteira vem sempre primeiro
    var comRes = todas.filter(function (a) { return a.res.length; }).sort(function (a, b) { return b.topo - a.topo; });
    var objetos = comRes.filter(function (a) { return a.z.objeto; });
    var achados = [];
    for (var i = 0; i < comRes.length; i++) {
      var a = comRes[i];
      if (!a.z.objeto) continue;
      if (objetos.filter(function (b) { return A.dentro(b.z, a.z); }).length >= 2) continue;
      if (achados.length && a.topo < 0.65) continue;
      if (!achados.some(function (b) { return A.sobrepoe(a.z, b.z); })) achados.push(a);
      if (achados.length >= 5) break;
    }
    /* a foto inteira usa a melhor zona encontrada, para nunca ficar vazia sem razão */
    var melhor = comRes[0];
    var primeira = { z: inteira.z, res: (inteira.res.length ? inteira : (melhor || inteira)).res, topo: inteira.topo };
    var escolhas = [primeira].concat(achados);
    var sel = 0;
    if (achados.length && achados[0].topo > primeira.topo + 0.02) sel = 1;   // objeto mais parecido fica marcado
    var antes = atual;
    atual = { escolhas: escolhas, sel: (!novo && antes) ? Math.min(antes.sel, escolhas.length - 1) : sel, base: base, cat: (!novo && antes) ? antes.cat : null };
    if (novo) $("bbiTxt").value = "";
    desenharObjetos(); desenharCats(); desenharLista();
  }
})();
    

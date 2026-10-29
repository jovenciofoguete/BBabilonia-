/* imagem-na-loja.js — B-Babilônia: pesquisa por imagem igual ao Alibaba.
   Parte 1: botão da câmara, ecrã "A pesquisar…" e preparação.
   Usa também imagem-analise.js (parte 2) e imagem-cartoes.js (parte 3). */
(function () {
  if (window.__bbImgLoja) return; window.__bbImgLoja = true;

  var LIBS = [
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js",
    "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js",
    "forma-comum.js", "imagem-analise.js", "imagem-cartoes.js"
  ];
  var PRONTO = { "forma-comum.js": "FormaBB", "imagem-analise.js": "BBImgAnalise", "imagem-cartoes.js": "BBImgCartoes" };
  var F = null, A = null, C = null, indice = [], semForma = [], lojas = [], preparar = null, aCompletar = null;
  var vez = 0, urlAnt = null, aberto = false;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- ecrã "A pesquisar…" (foto em ecrã inteiro escuro) ---------- */
  var css = document.createElement("style");
  css.textContent =
    "#bbiLoad{position:fixed;inset:0;z-index:100002;background:#000;display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:inherit}" +
    "#bbiLoad .ft{position:relative;width:100%;max-height:60vh;display:flex;justify-content:center;overflow:hidden}" +
    "#bbiLoad .ft img{max-width:100%;max-height:60vh;object-fit:contain;filter:brightness(.6)}" +
    "#bbiLoad .gi{width:40px;height:40px;border:3px solid #fff;border-right-color:transparent;border-radius:50%;margin:28px 0 16px;animation:bbiG .8s linear infinite}" +
    "@keyframes bbiG{to{transform:rotate(360deg)}}" +
    "#bbiLoad p{margin:0 20px;font-size:16px;text-align:center;line-height:1.4}" +
    "#bbiLoad button{margin-top:34px;width:46px;height:46px;border-radius:50%;border:1.5px solid #fff;background:none;color:#fff;font-size:20px;cursor:pointer}";
  document.head.appendChild(css);
  var load = document.createElement("div"); load.id = "bbiLoad";
  load.innerHTML = '<div class="ft"><img alt=""></div><div class="gi"></div><p id="bbiMsg"></p><button type="button" aria-label="Cancelar">✕</button>';
  document.body.appendChild(load);
  load.querySelector("button").onclick = function () { fechar(); };

  /* ---------- câmara / galeria ---------- */
  var fich = document.createElement("input");
  fich.type = "file"; fich.accept = "image/*"; fich.hidden = true;
  document.body.appendChild(fich);
  fich.addEventListener("change", procurar);
  document.addEventListener("click", function (e) {
    if (!(e.target.closest && e.target.closest("#bb-camara"))) return;
    e.preventDefault(); e.stopPropagation();
    prepararTudo().catch(function () {});
    fich.click();
  }, true);

  /* botão "voltar" do telemóvel fecha a pesquisa */
  window.addEventListener("popstate", function () { if (aberto) fechar(true); });
  function fechar(doVoltar) {
    vez++;
    load.style.display = "none";
    if (C) C.fechar();
    var estava = aberto; aberto = false;
    if (estava && !doVoltar) { try { history.back(); } catch (e) {} }
  }

  /* ---------- preparar (em segundo plano, logo que a página abre) ---------- */
  function js(src) {
    return new Promise(function (ok, falha) {
      if (PRONTO[src] && window[PRONTO[src]]) return ok();
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = function () { falha(new Error("Sem internet")); };
      document.head.appendChild(s);
    });
  }
  function prepararTudo() {
    if (!preparar) {
      preparar = (async function () {
        for (var i = 0; i < LIBS.length; i++) await js(LIBS[i]);
        F = window.FormaBB; A = window.BBImgAnalise; C = window.BBImgCartoes;
        await Promise.all([F.carregarModelo(), lerProdutos(), lerLojas()]);
        if (semForma.length && !aCompletar) aCompletar = completar().then(function () { aCompletar = null; });
      })();
      preparar.catch(function () { preparar = null; });
    }
    return preparar;
  }
  function cab() { return { apikey: F.SUPA_KEY, Authorization: "Bearer " + F.SUPA_KEY }; }
  async function lerProdutos() {
    var lista = [];
    for (var ini = 0; ini < 20000; ini += 1000) {
      var r = await fetch(F.SUPA_URL + "/rest/v1/products?select=*&offset=" + ini + "&limit=1000", { headers: cab() });
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
      f.forEach(function (t, i) { try { indice.push({ p: p, foto: fotos[i] || fotos[0], v: F.descodificar(t) }); } catch (e) {} });
    });
  }
  async function lerLojas() {   // para "anos · país" e a aba Fornecedores; se não der, a pesquisa funciona na mesma
    try { var r = await fetch(F.SUPA_URL + "/rest/v1/lojas?select=*&limit=5000", { headers: cab() }); lojas = r.ok ? await r.json() : []; }
    catch (e) { lojas = []; }
    if (!Array.isArray(lojas)) lojas = [];
  }
  async function completar() {   // produtos novos sem forma guardada
    var falta = semForma.splice(0, 40);
    for (var i = 0; i < falta.length; i++) {
      var p = falta[i], foto = F.fotosDe(p)[0];
      try { var im = await F.carregarImg(foto); indice.push({ p: p, foto: foto, v: await F.vetor(im) }); } catch (e) {}
    }
  }
  function antecipar() {
    var c = navigator.connection;
    if (c && c.saveData) return;
    setTimeout(function () { prepararTudo().catch(function () {}); }, 2500);
  }
  if (document.readyState === "complete") antecipar(); else window.addEventListener("load", antecipar);

  /* ---------- comparar ---------- */
  function poucas(z) {   // foto inteira, até 6 objetos e 4 quadrados
    return [z[0]].concat(z.filter(function (a) { return a.objeto; }).slice(0, 6), z.filter(function (a) { return a.grelha; }).slice(0, 4));
  }
  function comparar(q) {   // todos com alguma semelhança, do mais parecido para o menos
    var melhor = new Map();
    indice.forEach(function (it) {
      var s = 0, v = it.v;
      for (var i = 0; i < v.length; i++) s += q[i] * v[i];
      var ant = melhor.get(it.p.id);
      if (!ant || s > ant.nota) melhor.set(it.p.id, { p: it.p, foto: it.foto, nota: s });
    });
    var ord = Array.from(melhor.values()).sort(function (a, b) { return b.nota - a.nota; });
    return { topo: ord.length ? ord[0].nota : 0, res: ord.filter(function (x) { return x.nota >= 0.3; }).slice(0, 80) };
  }
  function preco(p) {
    try { if (typeof precoConv === "function") return precoConv(p); } catch (e) {}
    return Number(p.price || 0).toLocaleString("pt-PT") + " " + (p.currency || "MZN");
  }
  function cats() { try { return (typeof categorias !== "undefined" && Array.isArray(categorias)) ? categorias : []; } catch (e) { return []; } }
  function dados(base, lista, vs) {
    var todas = lista.map(function (z, i) { return Object.assign({ z: z }, comparar(vs[i])); });
    var inteira = todas[0];
    var comRes = todas.filter(function (a) { return a.res.length; }).sort(function (a, b) { return b.topo - a.topo; });
    var obj = comRes.filter(function (a) { return a.z.objeto; }), achados = [];
    for (var i = 0; i < comRes.length && achados.length < 5; i++) {
      var a = comRes[i];
      if (!a.z.objeto) continue;
      if (obj.filter(function (b) { return A.dentro(b.z, a.z); }).length >= 2) continue;
      if (achados.length && a.topo < 0.65) continue;
      if (!achados.some(function (b) { return A.sobrepoe(a.z, b.z); })) achados.push(a);
    }
    var primeira = { z: inteira.z, res: inteira.res.length ? inteira.res : (comRes[0] ? comRes[0].res : []), topo: inteira.topo };
    var sel = (achados.length && achados[0].topo > primeira.topo + 0.02) ? 1 : 0;
    return { escolhas: [primeira].concat(achados), sel: sel, base: base, recorte: A.recorte, preco: preco,
      categorias: cats(), lojas: lojas, fechar: function () { fechar(); }, outraFoto: function () { fich.click(); } };
  }

  /* ---------- procurar ---------- */
  async function procurar() {
    var f = fich.files && fich.files[0];
    fich.value = "";
    if (!f) return;
    var minha = ++vez;
    if (urlAnt) URL.revokeObjectURL(urlAnt);
    var url = urlAnt = URL.createObjectURL(f);
    if (C) C.fechar();
    load.querySelector("img").src = url;
    load.querySelector(".gi").style.visibility = "";
    $("bbiMsg").textContent = indice.length ? "A pesquisar entre todos os produtos…" : "A preparar a pesquisa (só demora na primeira vez)…";
    load.style.display = "flex";
    if (!aberto) { aberto = true; try { history.pushState({ bbImg: 1 }, ""); } catch (e) {} }
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
      var lista = poucas(A.zonas(base)), vs = await A.vetores(base, lista);
      if (minha !== vez) return;
      C.abrir(dados(base, lista, vs));
      load.style.display = "none";
      if (semForma.length && !aCompletar) aCompletar = completar().then(function () { aCompletar = null; });
      if (aCompletar) aCompletar.then(function () { if (minha === vez && aberto) C.atualizar(dados(base, lista, vs)); });
    } catch (err) {
      if (minha !== vez) return;
      $("bbiMsg").textContent = "Não foi possível pesquisar: " + err.message;
      load.querySelector(".gi").style.visibility = "hidden";
    }
  }
})();
      

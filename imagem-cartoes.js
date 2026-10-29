/* imagem-cartoes.js — B-Babilônia
   Parte 3 da pesquisa por imagem: a janela de resultados igual ao Alibaba
   (objetos da foto, pesquisa, abas Produtos/Fornecedores, filtros e cartões).
   É carregado sozinho pelo imagem-na-loja.js. Ficheiro novo. */
(function () {
  var css = document.createElement("style");
  css.textContent = [
    "#bbiFolha{position:fixed;inset:0;z-index:100001;background:#000;display:none;font-family:inherit}",
    "#bbiFolha .cx{position:absolute;left:0;right:0;bottom:0;top:8px;background:#fff;border-radius:16px 16px 0 0;display:flex;flex-direction:column;overflow:hidden;transform:translateY(100%);transition:transform .25s ease}",
    "#bbiFolha.on .cx{transform:none}",
    "#bbiFolha .px{width:44px;height:5px;border-radius:3px;background:#d9d9d9;margin:8px auto 6px;flex:none}",
    "#bbiFolha .tp{display:flex;align-items:center;gap:10px;padding:2px 12px 12px;flex:none}",
    "#bbiObjs{display:flex;gap:8px;overflow-x:auto;flex:0 1 auto;max-width:46%;scrollbar-width:none;padding:0 2px 8px}",
    "#bbiObjs::-webkit-scrollbar{display:none}",
    "#bbiObjs .ob{flex:none;position:relative;width:52px;height:52px}",
    "#bbiObjs canvas{width:52px;height:52px;border-radius:6px;border:2px solid transparent;display:block;background:#f2f2f2}",
    "#bbiObjs .on canvas{border-color:#111}",
    "#bbiObjs .on:after{content:'';position:absolute;left:50%;bottom:-7px;margin-left:-5px;border:5px solid transparent;border-top-color:#111}",
    "#bbiFolha .bu{flex:1;min-width:0;display:flex;align-items:center;gap:8px;background:#f2f2f2;border-radius:999px;padding:0 14px;height:44px}",
    "#bbiFolha .bu svg{flex:none;width:22px;height:22px;color:#222}",
    "#bbiFolha .bu input{flex:1;min-width:0;border:0;background:transparent;font:inherit;font-size:15px;outline:none;color:#222}",
    "#bbiFechar{flex:none;border:0;background:none;width:36px;height:36px;padding:0;cursor:pointer;color:#111}",
    "#bbiFechar svg{width:26px;height:26px}",
    "#bbiAbas{display:flex;gap:26px;padding:0 16px;border-bottom:1px solid #e8e8e8;flex:none;overflow-x:auto;scrollbar-width:none}",
    "#bbiAbas button{flex:none;border:0;background:none;font:inherit;font-size:16px;color:#777;padding:10px 0 12px;position:relative;cursor:pointer}",
    "#bbiAbas button.on{color:#111;font-weight:700}",
    "#bbiAbas button.on:after{content:'';position:absolute;left:0;right:0;bottom:0;height:3px;border-radius:2px;background:#111}",
    "#bbiCats{display:flex;gap:22px;overflow-x:auto;padding:14px 16px 10px;flex:none;scrollbar-width:none}",
    "#bbiCats::-webkit-scrollbar,#bbiChips::-webkit-scrollbar{display:none}",
    "#bbiCats button{flex:none;border:0;background:none;font:inherit;font-size:15px;color:#333;padding:0;cursor:pointer;white-space:nowrap}",
    "#bbiCats button.on{font-weight:800;color:#111;font-size:16px}",
    "#bbiChips{display:flex;gap:8px;overflow-x:auto;padding:2px 12px 12px;flex:none;scrollbar-width:none}",
    "#bbiChips .ch{flex:none;display:flex;align-items:center;gap:6px;border:1.5px solid #ddd;border-radius:999px;background:#fff;font:inherit;font-size:14.5px;color:#222;padding:8px 14px;cursor:pointer;white-space:nowrap;position:relative}",
    "#bbiChips .ch.on{border-color:#111;font-weight:700}",
    "#bbiChips .ch select{position:absolute;inset:0;opacity:0;font-size:16px}",
    "#bbiChips .vf{color:#1b5fd6;font-weight:800;font-style:italic}",
    "#bbiCorpo{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#fff}",
    "#bbiLista{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 6px;padding:0 0 40px;align-content:start}",
    "@media(min-width:640px){#bbiLista{grid-template-columns:repeat(4,minmax(0,1fr))}}",
    "#bbiLista .cd{display:block;min-width:0;overflow:hidden;color:#222;text-decoration:none;position:relative;padding-bottom:6px}",
    "#bbiLista .cd img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:#f4f4f4}",
    "#bbiLista .nm{padding:8px 10px 0;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "#bbiLista .pr{padding:4px 10px 0;font-size:19px;font-weight:800;letter-spacing:-.2px}",
    "#bbiLista .mo{padding:3px 10px 0;font-size:13.5px;color:#333}",
    "#bbiLista .me{padding:3px 44px 0 10px;font-size:12.5px;color:#999;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "#bbiLista .ca{position:absolute;right:8px;bottom:6px;width:32px;height:32px;color:#222}",
    "#bbiLista .vz{grid-column:1/-1;text-align:center;color:#777;padding:40px 16px;font-size:14.5px}",
    "#bbiLista .vz button{margin-top:12px;border:0;background:#FF6A00;color:#fff;font:inherit;font-weight:700;padding:11px 22px;border-radius:999px}",
    "#bbiForn{display:none;padding:4px 12px 40px}",
    "#bbiForn .fo{border:1px solid #eee;border-radius:12px;padding:12px;margin-bottom:10px}",
    "#bbiForn .fn{font-size:16px;font-weight:700;color:#111}",
    "#bbiForn .fm{font-size:12.5px;color:#888;margin-top:2px}",
    "#bbiForn .fi{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}",
    "#bbiForn .fi a img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:6px;display:block;background:#f4f4f4}"
  ].join("");
  document.head.appendChild(css);

  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>';
  var LUPA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>';
  var CARR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h3l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.2L21 7H6"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/><path d="M14 8.5v4M12 10.5h4"/></svg>';

  var folha = null, d = null, aba = "p", cat = null, ordem = "parecido", soVerif = false;
  var $ = function (id) { return document.getElementById(id); };
  function txt(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function semAc(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  function criar() {
    folha = document.createElement("div"); folha.id = "bbiFolha";
    folha.innerHTML = '<div class="cx"><div class="px"></div>' +
      '<div class="tp"><div id="bbiObjs"></div><label class="bu">' + LUPA + '<input id="bbiTxt" type="search" placeholder="Inserir detalhes" autocomplete="off"></label>' +
      '<button type="button" id="bbiFechar" aria-label="Fechar">' + X + '</button></div>' +
      '<div id="bbiAbas"><button type="button" data-a="p" class="on">Produtos</button><button type="button" data-a="f">Fornecedores</button></div>' +
      '<div id="bbiCorpo"><div id="bbiCats"></div><div id="bbiChips"></div><div id="bbiLista"></div><div id="bbiForn"></div></div></div>';
    document.body.appendChild(folha);
    $("bbiFechar").onclick = function () { if (d && d.fechar) d.fechar(); };
    $("bbiTxt").addEventListener("input", lista);
    $("bbiAbas").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      aba = b.getAttribute("data-a"); abas(); lista();
    });
  }

  /* ---------- dados de cada produto ---------- */
  function nomeCat(id) {
    var c = (d.categorias || []).find(function (x) { return x.id === id; });
    return c ? (c.name || c.nome || "") : "";
  }
  function lojaDe(p) {
    var L = d.lojas || []; if (!L.length) return null;
    var id = p.loja_id || p.store_id || p.fornecedor_id || p.supplier_id;
    var u = p.user_id || p.owner_id || p.created_by || p.fornecedor_email;
    return L.find(function (l) { return (id != null && l.id === id) || (u != null && (l.user_id === u || l.owner_id === u || l.email === u)); }) || null;
  }
  function verificada(l) { return !!l && /aprov|verif|ativ|activ/i.test(String(l.estado || l.status || "")); }
  function anos(l) {
    var t = l && Date.parse(l.created_at || l.criado_em || ""); if (!t) return 1;
    return Math.max(1, Math.ceil((Date.now() - t) / 31557600000));
  }
  function minimo(p) {
    var v = Number(p.pedido_minimo || p.min_order || p.moq || p.quantidade_minima || p.min_qty || 1);
    return "Pedido mínimo: " + v + (v === 1 ? " peça" : " peças");
  }
  function meta(p) {
    var l = lojaDe(p); if (!l) return "";
    var n = anos(l);
    return n + (n === 1 ? " ano" : " anos") + (l.pais || l.country ? " · " + (l.pais || l.country) : "");
  }

  /* ---------- partes da janela ---------- */
  function objetos() {
    var o = $("bbiObjs"); o.innerHTML = "";
    d.escolhas.forEach(function (a, i) {
      var w = document.createElement("div"); w.className = "ob" + (i === d.sel ? " on" : "");
      var c = d.recorte(d.base, a.z, 104), q = document.createElement("canvas"); q.width = q.height = 104;
      var g = q.getContext("2d"); g.fillStyle = "#f2f2f2"; g.fillRect(0, 0, 104, 104);
      g.drawImage(c, (104 - c.width) / 2, (104 - c.height) / 2);
      w.appendChild(q);
      w.onclick = function () { d.sel = i; cat = null; objetos(); lista(); $("bbiCorpo").scrollTop = 0; };
      o.appendChild(w);
    });
  }
  function abas() {
    Array.prototype.forEach.call($("bbiAbas").children, function (b) { b.className = b.getAttribute("data-a") === aba ? "on" : ""; });
    $("bbiAbas").children[1].style.display = (d.lojas && d.lojas.length) ? "" : "none";
  }
  function resAtual() { var a = d.escolhas[d.sel]; return a ? a.res : []; }
  function cats(res) {
    var cont = {}, ord = [];
    res.forEach(function (it) { var n = nomeCat(it.p.category_id); if (!n) return; if (!cont[n]) { cont[n] = 0; ord.push(n); } cont[n]++; });
    ord.sort(function (a, b) { return cont[b] - cont[a]; });
    var box = $("bbiCats"); box.innerHTML = "";
    ["Todos"].concat(ord.slice(0, 12)).forEach(function (n, i) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = n;
      if ((i === 0 && !cat) || cat === n) b.className = "on";
      b.onclick = function () { cat = i === 0 ? null : n; lista(); };
      box.appendChild(b);
    });
  }
  function chips() {
    var box = $("bbiChips"); box.innerHTML = "";
    var o = document.createElement("label"); o.className = "ch on";
    o.innerHTML = (ordem === "baixo" ? "Preço mais baixo" : ordem === "alto" ? "Preço mais alto" : "Ordenar por") +
      ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg>' +
      '<select aria-label="Ordenar por"><option value="parecido">Mais parecidos</option><option value="baixo">Preço mais baixo</option><option value="alto">Preço mais alto</option></select>';
    var s = o.querySelector("select"); s.value = ordem; s.onchange = function () { ordem = s.value; lista(); };
    box.appendChild(o);
    if (d.lojas && d.lojas.length) {
      var v = document.createElement("button"); v.type = "button"; v.className = "ch" + (soVerif ? " on" : "");
      v.innerHTML = '<span class="vf">Verified</span> Fornecedor';
      v.onclick = function () { soVerif = !soVerif; lista(); };
      box.appendChild(v);
    }
  }
  function filtrados() {
    var res = resAtual().slice(), t = semAc($("bbiTxt").value.trim());
    if (cat) res = res.filter(function (it) { return nomeCat(it.p.category_id) === cat; });
    if (soVerif) res = res.filter(function (it) { return verificada(lojaDe(it.p)); });
    if (t) {
      var pal = t.split(/\s+/);
      res = res.filter(function (it) {
        var s = semAc((it.p.name || "") + " " + nomeCat(it.p.category_id) + " " + (it.p.description || it.p.descricao || ""));
        return pal.every(function (w) { return s.indexOf(w) !== -1; });
      });
    }
    if (ordem === "baixo") res.sort(function (a, b) { return Number(a.p.price || 0) - Number(b.p.price || 0); });
    if (ordem === "alto") res.sort(function (a, b) { return Number(b.p.price || 0) - Number(a.p.price || 0); });
    return res;
  }
  function lista() {
    if (!d) return;
    cats(resAtual()); chips();
    var res = filtrados(), g = $("bbiLista"), f = $("bbiForn");
    g.style.display = aba === "p" ? "" : "none"; f.style.display = aba === "f" ? "block" : "none";
    $("bbiCats").style.display = $("bbiChips").style.display = aba === "p" ? "" : "none";
    if (aba === "f") return fornecedores(res);
    if (!res.length) {
      g.innerHTML = '<div class="vz"><p>Não encontrámos produtos parecidos.</p><p>Tente outra foto com o objeto inteiro, ou toque noutro objeto lá em cima.</p><button type="button" id="bbiOutra">Tirar outra foto</button></div>';
      $("bbiOutra").onclick = function () { if (d.outraFoto) d.outraFoto(); };
      return;
    }
    g.innerHTML = "";
    res.forEach(function (it) {
      var p = it.p, a = document.createElement("a"), m = meta(p);
      a.className = "cd"; a.href = "produto-bbabilonia.html?id=" + encodeURIComponent(p.id);
      a.innerHTML = '<img loading="lazy" alt="' + txt(p.name) + '" src="' + txt(it.foto || p.image_url) + '">' +
        '<div class="nm">' + txt(p.name || "Produto") + '</div><div class="pr">' + d.preco(p) + '</div>' +
        '<div class="mo">' + minimo(p) + '</div>' + (m ? '<div class="me">' + txt(m) + '</div>' : '<div class="me">&nbsp;</div>') +
        '<span class="ca" aria-hidden="true">' + CARR + '</span>';
      g.appendChild(a);
    });
  }
  function fornecedores(res) {
    var f = $("bbiForn"), grupos = [], por = {};
    res.forEach(function (it) {
      var l = lojaDe(it.p); if (!l) return;
      if (!por[l.id]) { por[l.id] = { l: l, its: [] }; grupos.push(por[l.id]); }
      por[l.id].its.push(it);
    });
    if (!grupos.length) { f.innerHTML = '<p style="text-align:center;color:#777;padding:30px 0">Sem fornecedores para estes produtos.</p>'; return; }
    f.innerHTML = "";
    grupos.forEach(function (gr) {
      var l = gr.l, n = anos(l), el = document.createElement("div"); el.className = "fo";
      el.innerHTML = '<div class="fn">' + txt(l.nome || l.name || "Fornecedor") + (verificada(l) ? ' <span style="color:#1b5fd6;font-style:italic;font-size:13px">Verified</span>' : "") + '</div>' +
        '<div class="fm">' + n + (n === 1 ? " ano" : " anos") + (l.pais || l.country ? " · " + txt(l.pais || l.country) : "") + " · " + gr.its.length + (gr.its.length === 1 ? " produto parecido" : " produtos parecidos") + '</div>' +
        '<div class="fi">' + gr.its.slice(0, 3).map(function (it) { return '<a href="produto-bbabilonia.html?id=' + encodeURIComponent(it.p.id) + '"><img loading="lazy" alt="" src="' + txt(it.foto || it.p.image_url) + '"></a>'; }).join("") + '</div>';
      f.appendChild(el);
    });
  }

  /* ---------- abrir / atualizar / fechar ---------- */
  window.BBImgCartoes = {
    abrir: function (dados) {
      if (!folha) criar();
      d = dados; aba = "p"; cat = null; ordem = "parecido"; soVerif = false; $("bbiTxt").value = "";
      objetos(); abas(); lista(); $("bbiCorpo").scrollTop = 0;
      folha.style.display = "block";
      requestAnimationFrame(function () { requestAnimationFrame(function () { folha.classList.add("on"); }); });
      document.documentElement.style.overflow = "hidden";
    },
    atualizar: function (dados) {
      if (!folha || !d) return;
      var sel = Math.min(d.sel, dados.escolhas.length - 1); d = dados; d.sel = sel;
      objetos(); abas(); lista();
    },
    fechar: function () {
      if (!folha) return;
      folha.classList.remove("on"); folha.style.display = "none";
      document.documentElement.style.overflow = "";
    }
  };
})();
                                                                     

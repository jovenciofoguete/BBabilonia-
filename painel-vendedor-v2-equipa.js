/* painel-vendedor-v2-equipa.js — ecrãs da sub-conta de funcionário */
(function () {
  var F = window.PVF; if (!F || !window.PVsec) return;
  var H = F.H, esc = H.esc, arr = H.arr, data = H.data, num = H.num, PAP = F.PAP, eq = F.eq, pode = F.pode, modal = F.modal, fechar = F.fechar, bloq = F.bloq;
  var PR = null, PE = null, CV = null, CAR = {}, X = null, CH = null;
  function at() { X = F.X; CH = F.CH; }
  F.limpar = function () { PR = PE = CV = null; };
  F.inicioFunc = function () {
    at();
    var e = eq(), l = e._loja || {}, C = [];
    if (pode("produtos")) C.push(["c2", "📦", "Produtos da loja", "Ver, editar e publicar produtos", "#fprod"]);
    if (pode("encomendas")) C.push(["c8", "🧾", "Encomendas", "Encomendas dos clientes e estados", "#fenc"]);
    if (pode("mensagens")) C.push(["c5", "💬", "Mensagens", "Responder aos clientes em nome da loja", "#fmsg"]);
    C.push(["c12", "👤", "Conta", "Email, palavra-passe e sair", "#conta"], ["c6", "🎧", "Centro de ajuda", "Perguntas frequentes e regras", "#ajuda"]);
    return '<div class="cx loja1"><div class="ic">' + esc((l.nome || "?").charAt(0).toUpperCase()) + '</div><div style="min-width:0"><b>' + esc(l.nome || "Loja") + '</b> <span class="bdg b-az">👤 ' + esc((PAP[e.papel] || PAP.vendedor)[0]) + '</span><div class="m">Sub-conta de funcionário · ' + esc(X.S.user.email) + "</div>" +
      (F.EQ.length > 1 ? '<select class="cp" id="fLoja" style="margin-top:8px">' + F.EQ.map(function (x) { return '<option value="' + esc(x.dono_id) + '"' + (x.dono_id === CH ? " selected" : "") + ">" + esc((x._loja && x._loja.nome) || "Loja") + "</option>"; }).join("") + "</select>" : "") + "</div></div>" +
      '<div class="sec">Trabalho</div><div class="grid">' + C.map(function (c) { return '<a class="c ' + c[0] + '" href="' + c[4] + '"><span class="i">' + c[1] + "</span><b>" + c[2] + "</b><span>" + c[3] + "</span></a>"; }).join("") + "</div>" +
      '<div class="aviso">Saldo, levantamentos, conta bancária e documentos da loja são só do dono.</div>';
  }

  /* ---------- funcionário: produtos, encomendas, mensagens ---------- */
  function carregarF(qual) {
    if (CAR[qual]) return '<div class="cx"><p class="vazio">A carregar…</p></div>'; CAR[qual] = 1;
    var u = qual === "p" ? "products?select=*&supplier_id=eq." + CH + "&order=created_at.desc&limit=500" : "rpc/pedidos_da_loja";
    (qual === "e" ? X.api(u, "POST", { p_dono: CH }) : X.api(u)).then(function (r) { r = r || []; if (qual === "p") PR = r; else PE = r; }, function (e) { if (qual === "p") PR = []; else PE = []; X.aviso(e.message); }).then(function () { CAR[qual] = 0; X.desenhar(); });
    return '<div class="cx"><p class="vazio">A carregar…</p></div>';
  }
  PVsec.V.fprod = function () {
    at();
    if (!pode("produtos")) return bloq(); if (PR === null) return carregarF("p");
    return '<div class="cx"><h2>📦 Produtos da loja <a class="bt p" href="registar-produto.html" style="color:#fff">+ Publicar</a></h2>' + (PR.map(function (p) { return H.lnProd(p, false).replace('<div class="ac">', '<div class="ac"><button class="bt" data-fpe="' + esc(p.id) + '">Editar</button>'); }).join("") || '<p class="vazio">A loja ainda não tem produtos.</p>') + '</div><div class="cx"><a class="bt g" href="detalhes-fornecedor.html">📝 Detalhes e opções obrigatórias dos produtos</a></div>';
  };
  PVsec.V.fenc = function () {
    at();
    if (!pode("encomendas")) return bloq(); if (PE === null) return carregarF("e");
    return '<div class="cx"><h2>🧾 Encomendas da loja</h2>' + (PE.map(function (p) { var e = H.estPed(p), it = arr(p.items); return '<div class="ln"><div class="sf">🧾</div><div class="t"><b>#' + esc(String(p.id).slice(0, 8).toUpperCase()) + " · " + esc(p.customer_name || "Cliente") + "</b><span>" + num(p.total, p.currency || "MZN") + " · " + data(p.created_at) + " · " + it.map(function (i) { return esc((i.nome || "Produto") + " ×" + (i.qtd || 1)); }).join(", ") + '</span></div><span class="bdg ' + e[1] + '">' + e[0] + "</span></div>"; }).join("") || '<p class="vazio">Ainda não há encomendas.</p>') + "</div>";
  };
  PVsec.V.fmsg = function () {
    at();
    if (!pode("mensagens")) return bloq();
    return '<div class="cx" style="padding:0;overflow:hidden"><iframe title="Mensagens da loja" src="chat-novo2.html?dono=' + encodeURIComponent(CH) + '" style="display:block;width:100%;height:calc(100vh - 150px);min-height:520px;border:0"></iframe></div>';
  };
  function editarProd(id) {
    var p = (PR || []).filter(function (x) { return String(x.id) === String(id); })[0]; if (!p) return;
    modal('<h2>Editar produto</h2><label class="lb">Nome</label><input class="cp" id="pN" value="' + esc(p.name || "") + '"><label class="lb">Preço (' + esc(p.currency || "MZN") + ')</label><input class="cp" id="pP" type="number" min="0" step="0.01" value="' + esc(p.price || 0) + '"><label class="lb">Estado</label><select class="cp" id="pA"><option value="1"' + (p.active !== false ? " selected" : "") + '>Publicado</option><option value="0"' + (p.active === false ? " selected" : "") + '>Oculto</option></select><button class="bt p g" id="pG">Guardar</button><a class="bt g" style="margin-top:8px" href="detalhes-fornecedor.html">Fotos, cores, tamanhos e detalhes</a><button class="bt g" id="pF" style="margin-top:8px">Fechar</button><p class="msg" id="pM"></p>');
    var $ = function (i) { return document.getElementById(i); };
    $("pF").onclick = fechar;
    $("pG").onclick = async function () {
      var n = $("pN").value.trim(), pr = Number($("pP").value); if (!n || !(pr >= 0)) { $("pM").textContent = "Escreva o nome e um preço válido."; return; }
      this.disabled = true;
      try { var r = await X.api("products?id=eq." + encodeURIComponent(p.id) + "&supplier_id=eq." + CH, "PATCH", { name: n, price: pr, active: $("pA").value === "1" }); if (!r || !r.length) throw new Error("Sem permissão para este produto."); Object.assign(p, r[0]); fechar(); X.aviso("Produto guardado."); X.desenhar(); }
      catch (e) { $("pM").textContent = e.message; this.disabled = false; }
    };
  }
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    var b = t.closest("[data-fpe]"); if (!b) return; e.preventDefault(); at();
    editarProd(b.getAttribute("data-fpe"));
  });
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "fLoja") { F.CH = e.target.value; PR = PE = CV = null; F.X.desenhar(); } });
})();

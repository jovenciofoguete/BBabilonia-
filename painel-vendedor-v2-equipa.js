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
    var u = qual === "p" ? "products?select=*&supplier_id=eq." + CH + "&order=created_at.desc&limit=500" : qual === "e" ? "rpc/pedidos_da_loja" : "conversas?select=*&vendedor_id=eq." + CH + "&order=created_at.desc&limit=100";
    (qual === "e" ? X.api(u, "POST", { p_dono: CH }) : X.api(u)).then(function (r) { r = r || []; if (qual === "p") PR = r; else if (qual === "e") PE = r; else CV = r; }, function (e) { if (qual === "p") PR = []; else if (qual === "e") PE = []; else CV = []; X.aviso(e.message); }).then(function () { CAR[qual] = 0; X.desenhar(); });
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
    if (!pode("mensagens")) return bloq(); if (CV === null) return carregarF("m");
    return '<div class="cx"><h2>💬 Mensagens da loja</h2>' + (CV.map(function (c) { return '<a class="ln" href="#fmsg" data-fcv="' + esc(c.id) + '"><div class="av2" style="background:#ec4899">' + esc((c.assunto || "C").charAt(0).toUpperCase()) + '</div><div class="t"><b>' + esc(c.assunto || "Conversa") + "</b><span>" + data(c.created_at) + '</span></div><div class="ac"><span class="bt">Abrir</span></div></a>'; }).join("") || '<p class="vazio">Ainda não há conversas.</p>') + "</div>";
  };
  async function conversa(id) {
    var c = (CV || []).filter(function (x) { return String(x.id) === String(id); })[0]; if (!c) return;
    modal('<h2>💬 ' + esc(c.assunto || "Conversa") + '</h2><div class="fms" id="fMs"><p class="vazio">A carregar…</p></div><textarea class="cp" id="fTx" rows="2" maxlength="2000" placeholder="Escreva a sua mensagem"></textarea><button class="bt p g" id="fEnv">Enviar</button><button class="bt g" id="fLink" style="margin-top:8px">💳 Enviar link de pagamento</button><button class="bt g" id="fF2" style="margin-top:8px">Fechar</button><p class="msg" id="fM2"></p>');
    var $ = function (i) { return document.getElementById(i); };
    if (window.FiltroContactos && window.FiltroContactos.ligar) window.FiltroContactos.ligar($("fTx"), $("fEnv"), $("fM2"));
    $("fF2").onclick = fechar; var MS = [];
    $("fLink").onclick = function () { linkPag(c, MS); };
    async function ler() {
      try {
        var ms = await X.api("mensagens?select=*&conversa_id=eq." + c.id + "&order=created_at.asc&limit=300") || []; MS = ms;
        $("fMs").innerHTML = ms.map(function (m) { var eu = m.remetente_id === CH, t = m.tipo === "imagem" && m.anexo_url ? '<img src="' + esc(m.anexo_url) + '" alt="">' : m.tipo === "endereco" ? "📍 Endereço de entrega" : esc(m.texto || ""); return '<div class="' + (eu ? "eu" : "") + '"><small>' + (eu ? "Loja" : "Cliente") + " · " + H.hora(m.created_at) + "</small>" + t + "</div>"; }).join("") || '<p class="vazio">Sem mensagens.</p>';
        $("fMs").scrollTop = 1e6;
      } catch (e) { $("fMs").innerHTML = '<p class="msg">' + esc(e.message) + "</p>"; }
    }
    await ler();
    $("fEnv").onclick = async function () {
      var t = $("fTx").value.trim(), m = $("fM2"); m.textContent = ""; if (!t) return;
      if (window.FiltroContactos) { var r = window.FiltroContactos.verificar(t); if (!r.ok) { m.textContent = r.motivo; return; } }
      this.disabled = true;
      try { await X.api("mensagens", "POST", { conversa_id: c.id, remetente_id: CH, tipo: "texto", texto: t }); $("fTx").value = ""; await ler(); } catch (e) { m.textContent = e.message; }
      this.disabled = false;
    };
  }
    var MOEDAS = (function () {
    var top = ["USD", "EUR", "CNY", "MZN", "ZAR", "GBP", "AED"], l = [], d = null;
    try { l = Intl.supportedValuesOf("currency"); } catch (e) {}
    if (!l.length) l = "USD EUR CNY MZN ZAR GBP AED AOA BRL INR TRY KES TZS NGN MWK ZMW JPY KRW HKD SGD CAD AUD CHF SAR EGP MAD GHS XOF XAF BWP NAD UGX RWF ETB PKR BDT IDR MYR THB VND PHP MXN ARS CLP COP PEN RUB UAH PLN SEK NOK DKK CZK HUF RON".split(" ");
    try { d = new Intl.DisplayNames(["pt"], { type: "currency" }); } catch (e) {}
    var fora = "KPW XDR XSU HRK CUC SLL".split(" "); if (l.indexOf("SLE") < 0) l.push("SLE");
    return top.concat(l.filter(function (c) { return top.indexOf(c) < 0 && fora.indexOf(c) < 0; }).sort()).map(function (c) { var n = c === "SLE" ? "Leone (Serra Leoa)" : ""; try { n = n || (d ? d.of(c) : ""); } catch (e) {} return [c, n && n !== c ? c + " — " + n : c]; });
  })();
  function fotosDe(p) { var l = []; if (p.image_url) l.push(p.image_url); arr(p.images).concat(arr(p.colors)).forEach(function (a) { var u = typeof a === "string" ? a : a && (a.url || a.foto || a.src); if (u) l.push(u); }); return l; }
  async function linkPag(c, ms) {
    if (PR === null) { try { PR = await X.api("products?select=*&supplier_id=eq." + CH + "&order=created_at.desc&limit=200") || []; } catch (e) { PR = []; } }
    var op = [], sel = [];
    ms.forEach(function (m) { if (m.anexo_url && /^https?:/.test(m.anexo_url)) op.push(m.anexo_url); });
    PR.forEach(function (p) { fotosDe(p).forEach(function (u) { if (/^https?:/.test(u)) op.push(u); }); });
    op = op.filter(function (u, i) { return op.indexOf(u) === i; }).slice(0, 40);
    var mp = (PR[0] && PR[0].currency) || "USD";
    modal('<h2>💳 Link de pagamento</h2><label class="lb">O que o cliente vai pagar *</label><input class="cp" id="lD" maxlength="200">' +
      '<div style="display:flex;gap:8px"><div style="flex:1"><label class="lb">Quantidade *</label><input class="cp" id="lQ" type="number" min="1" value="1"></div><div style="flex:1"><label class="lb">Preço unitário *</label><input class="cp" id="lP" type="number" min="0" step="0.01"></div></div>' +
      '<div style="display:flex;gap:8px"><div style="flex:1"><label class="lb">Envio (negociado)</label><input class="cp" id="lE" type="number" min="0" step="0.01" value="0"></div><div style="flex:1"><label class="lb">Moeda *</label><select class="cp" id="lM">' + MOEDAS.map(function (m) { return '<option value="' + m[0] + '"' + (m[0] === mp ? " selected" : "") + ">" + esc(m[1]) + "</option>"; }).join("") + "</select></div></div>" +
      '<label class="lb">Prazo de produção</label><select class="cp" id="lZ"><option value="">Pronto a enviar</option>' + [2, 4, 7, 15, 22, 30, 45, 60].map(function (n) { return '<option value="' + n + '">' + n + " dias</option>"; }).join("") + "</select>" +
      '<label class="lb">Fotos (toque para escolher, mínimo 1) *</label><div id="lF" style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">' + (op.map(function (u, i) { return '<img data-lf="' + i + '" src="' + esc(u) + '" alt="" style="width:62px;height:62px;object-fit:cover;border-radius:8px;border:3px solid transparent">'; }).join("") || '<p class="sub">Sem fotos na conversa nem nos produtos da loja.</p>') + "</div>" +
      '<p id="lT" style="font-weight:800;margin:6px 0">Total: 0</p><button class="bt p g" id="lOk">Enviar link ao cliente</button><button class="bt g" id="lNo" style="margin-top:8px">Voltar à conversa</button><p class="msg" id="lMsg"></p>');
    var $ = function (i) { return document.getElementById(i); }, n = function (i) { return Number(String($(i).value || "").replace(",", ".")) || 0; };
    function tot() { return Math.round((Math.floor(n("lQ")) * n("lP") + n("lE")) * 100) / 100; }
    ["lQ", "lP", "lE", "lM"].forEach(function (i) { $(i).oninput = $(i).onchange = function () { $("lT").textContent = "Total: " + num(tot(), $("lM").value); }; });
    $("lF").onclick = function (e) { var im = e.target.closest("[data-lf]"); if (!im) return; var u = op[+im.getAttribute("data-lf")], k = sel.indexOf(u); if (k > -1) sel.splice(k, 1); else if (sel.length < 6) sel.push(u); im.style.borderColor = sel.indexOf(u) > -1 ? "#7c3aed" : "transparent"; };
    $("lNo").onclick = function () { conversa(c.id); };
    $("lOk").onclick = async function () {
      var d = $("lD").value.trim(), q = Math.floor(n("lQ")), p = n("lP"), en = n("lE"), m = $("lM").value, z = $("lZ").value, er = $("lMsg"); er.textContent = "";
      if (d.length < 3) { er.textContent = "Escreva o que o cliente vai pagar."; return; }
      if (q < 1 || p <= 0 || en < 0) { er.textContent = "Verifique a quantidade, o preço e o envio."; return; }
      if (!sel.length) { er.textContent = "Escolha pelo menos 1 foto."; return; }
      if (window.FiltroContactos && !window.FiltroContactos.verificar(d).ok) { er.textContent = "O texto tem contactos ou links. Não é permitido."; return; }
      var t = tot(); this.disabled = true;
      try {
        var r = await X.api("links_pagamento", "POST", { conversa_id: String(c.id), vendedor_id: CH, cliente_id: c.cliente_id, descricao: d, quantidade: q, preco_unitario: p, envio: en, total: t, moeda: m, prazo_dias: z ? Number(z) : null, fotos: sel });
        var L = r && r[0]; if (!L) throw new Error("Não foi possível criar o link.");
        await X.api("mensagens", "POST", { conversa_id: c.id, remetente_id: CH, tipo: "texto", texto: "💳 Link de pagamento: " + d + " — " + num(t, m), dados: { pagamento: { id: L.id } } });
        X.aviso("Link de pagamento enviado."); conversa(c.id);
      } catch (e2) { er.textContent = /row-level|policy/i.test(e2.message) ? "Falta correr o SQL dos links da equipa no Supabase." : e2.message; this.disabled = false; }
    };
  }
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
    var b = t.closest("[data-fpe],[data-fcv]"); if (!b) return; e.preventDefault(); at();
    if (b.hasAttribute("data-fpe")) editarProd(b.getAttribute("data-fpe")); else conversa(b.getAttribute("data-fcv"));
  });
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "fLoja") { F.CH = e.target.value; PR = PE = CV = null; F.X.desenhar(); } });
})();

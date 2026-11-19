/* checkout-mpesa.js — BBabilônia (12/11/2026): opção "📱 M-Pesa" no pagamento (checkout.html e pagar-link-v2.html).
   O cliente escreve o número M-Pesa e toca em Pagar: no telemóvel aparece só o pedido do PIN (USSD Push).
   O valor fica retido na BBabilônia até à verificação dos produtos. Servidor: api/mpesa-pagar.js
   (19/11/2026) Fornecedor de Moçambique + cliente de Moçambique: SÓ M-Pesa (cartão e cripto escondidos e recusados, com aviso).
   Fornecedor de Moçambique + cliente fora de Moçambique: cartão e cripto. Fornecedor de outro país (ex.: China):
   SÓ cartão Visa/Mastercard e cripto (USDT...), sem M-Pesa. O servidor também recusa M-Pesa (função bb_mpesa_carrinho / bb_mpesa_link / bb_mpesa_pedido). */
(function () {
  if (window.__bbMpesa) return; window.__bbMpesa = 1;
  var d = document, $ = function (i) { return d.getElementById(i); };
  var CHECKOUT = !!($("continuar") && $("pag")), LINK = !!($("cont") && $("payBox"));
  if (!CHECKOUT && !LINK) return;

  /* enquanto o servidor não responde, cartão/cripto ficam escondidos (evita piscar); depois: Moçambique = só M-Pesa, resto = só cartão/cripto */
  var est = d.createElement("style");
  est.textContent = "html.bb-espera #lc,html.bb-espera #lx,html.bb-espera #payBox .op,html.bb-solo #lc,html.bb-solo #lx,html.bb-solo #payBox .op:not(#bb-lmp){display:none!important}html.bb-nomp #bb-lmp{display:none!important}" +
    "#bb-avmz{display:none;margin:10px 0;padding:12px;border-radius:12px;border:2px solid #f59e0b;background:#fef3c7;color:#92400e;font-weight:700;font-size:14px;line-height:1.5}html.bb-solo #bb-avmz,html.bb-espera #bb-avmz.pais{display:block}";
  d.head.appendChild(est);
  d.documentElement.classList.add("bb-espera");
  var H = d.documentElement, FORN_MZ = null, PAIS = "", AV = "O fornecedor é de Moçambique e você também é de Moçambique: pague por M-Pesa. Cartão e cripto não são aceites neste pedido.";
  function liberar() { H.classList.remove("bb-espera", "bb-solo"); }
  function solo() { H.classList.remove("bb-espera"); H.classList.add("bb-solo"); }
  function paisCli() { try { return String((window.BBPais && window.BBPais.obter()) || "").toUpperCase(); } catch (e) { return ""; } }
  /* decide o que mostrar: fornecedor MZ + cliente MZ = só M-Pesa; fornecedor MZ + cliente de fora = cartão/cripto; fornecedor de fora = cartão/cripto */
  function aplicar() {
    if (FORN_MZ === null) return;
    if (!FORN_MZ) { liberar(); H.classList.add("bb-nomp"); return; }
    var p = paisCli(); PAIS = p;
    var av = $("bb-avmz");
    if (!p) { /* país ainda não escolhido: nada de pagamento até escolher */
      H.classList.remove("bb-solo"); H.classList.add("bb-espera", "bb-nomp"); if (av) { av.textContent = "Escolha o seu país para ver as formas de pagamento."; av.classList.add("pais"); } return;
    }
    if (av) { av.classList.remove("pais"); av.textContent = AV; }
    if (p === "MZ") { H.classList.remove("bb-nomp"); montar(); solo(); if (window.__bbMpAj) window.__bbMpAj(true); }
    else { liberar(); H.classList.add("bb-nomp"); if (window.__bbMpAj) window.__bbMpAj(false); }
  }
  function recusar() {
    var av = $("bb-avmz"); if (av) { av.textContent = AV; av.style.display = "block"; av.scrollIntoView({ behavior: "smooth", block: "center" }); }
    var m = $("msg"); if (m) m.textContent = AV;
  }
  setInterval(function () { if (FORN_MZ !== null && paisCli() !== PAIS) aplicar(); }, 400);
  try { if (window.BBPais) { window.BBPais.carregado.then(aplicar); window.BBPais.aoMudar(aplicar); } } catch (e) {}

  /* só mostra o M-Pesa se o servidor confirmar que o fornecedor é de Moçambique */
  function idsCarrinho() {
    try { return Array.from(new Set((JSON.parse(localStorage.getItem("carrinho") || "[]") || []).map(function (i) { return String(i.id || i.produto_id || i.product_id || ""); }).filter(Boolean))); } catch (e) { return []; }
  }
  function perguntar(n) {
    var p;
    try {
      if (typeof sb === "undefined") { FORN_MZ = false; aplicar(); return; }
      if (CHECKOUT) { var ids = idsCarrinho(); p = ids.length ? sb.rpc("bb_mpesa_carrinho", { p_produtos: ids }) : Promise.resolve({ data: false }); }
      else p = sb.rpc("bb_mpesa_link", { p_link: window.ID || new URLSearchParams(location.search).get("id") });
    } catch (e) { FORN_MZ = false; aplicar(); return; }
    var outra = function () { if ((n || 0) < 3) setTimeout(function () { perguntar((n || 0) + 1); }, 2000); else { FORN_MZ = false; aplicar(); } };
    p.then(function (r) { if (r.error) { outra(); return; } FORN_MZ = r.data === true; if (FORN_MZ) montar(); aplicar(); }, outra);
  }

  function montar() {
    if (window.__bbMpesaMontado) return; window.__bbMpesaMontado = 1;
    var css = d.createElement("style");
    css.textContent = "#bb-mp{margin-top:12px;padding:12px;border-radius:12px;border:2px solid #e11d48;background:" + (CHECKOUT ? "#1d1220" : "#fff1f2") + "}" +
      "#bb-mp label{display:block;font-size:14px;margin:0 0 4px;font-weight:700}#bb-mp input{width:100%;padding:12px;border-radius:10px;font-size:17px;border:2px solid #e2e8f0}" +
      "#bb-mp .tx{font-size:14px;line-height:1.6;margin-top:8px}#bb-mp button{width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;background:#e11d48;color:#fff;font-weight:800;font-size:16px}" +
      "#bb-mp button:disabled{opacity:.5}#bb-mp .es{font-size:14px;margin-top:10px;font-weight:700}#bb-mp .es.er{color:#ef4444}#bb-mp .es.ok{color:#10b981}" +
      ".bb-pin{display:flex;gap:10px;align-items:center;margin-top:10px;padding:10px;border-radius:10px;background:#fef3c7;color:#92400e;font-weight:700;font-size:14px}";
    d.head.appendChild(css);
    function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
    function radios() { return d.querySelectorAll("input[name=m]"); }
    function metodo() { var r = d.querySelector("input[name=m]:checked"); return r ? r.value : ""; }

    /* opção M-Pesa ao lado das outras */
    var primeira = radios()[0]; if (!primeira) return;
    var grupo = primeira.closest(".op") || primeira.closest("label").parentNode;
    var av = d.createElement("div"); av.id = "bb-avmz"; av.textContent = AV; grupo.parentNode.insertBefore(av, grupo);
    var op = d.createElement("label"); op.id = "bb-lmp";
    if (CHECKOUT) { op.innerHTML = '<input type="radio" name="m" value="mpesa">📱 M-Pesa'; grupo.appendChild(op); grupo.style.flexWrap = "wrap"; }
    else { op.className = "op"; op.innerHTML = '<input type="radio" name="m" value="mpesa"><div><b>📱 M-Pesa (Moçambique)</b><small>Toque em pagar e confirme com o PIN do M-Pesa no seu telemóvel.</small></div>'; primeira.closest(".op").parentNode.insertBefore(op, primeira.closest(".op")); }
    function marcar() {
      if (CHECKOUT) { var lc = $("lc"), lx = $("lx"); if (lc) lc.className = metodo() === "cartao" ? "on" : ""; if (lx) lx.className = metodo() === "cripto" ? "on" : ""; op.className = metodo() === "mpesa" ? "on" : ""; }
      else d.querySelectorAll("#payBox .op").forEach(function (o) { o.classList.toggle("on", o.querySelector("input").checked); });
      var cx = $("bb-mp"); if (cx && metodo() !== "mpesa") cx.remove();
    }
    radios().forEach(function (r) { r.addEventListener("change", marcar); });
    /* fornecedor de Moçambique: o M-Pesa é a única forma, fica sempre escolhido */
    var rm = op.querySelector("input");
    /* ajusta conforme o país: solo = M-Pesa fixo; senão tira o M-Pesa e escolhe cartão/cripto */
    window.__bbMpAj = function (so) {
      if (so) { if (!rm.checked) { rm.checked = true; marcar(); } return; }
      if (rm.checked) { rm.checked = false; var o = Array.from(radios()).filter(function (x) { return x !== rm; })[0]; if (o) o.checked = true; marcar(); var cx = $("bb-mp"); if (cx) cx.remove(); try { cont0 && cont0.classList.remove("hide"); } catch (e) {} }
    };
    /* recusa cartão/cripto quando é só M-Pesa */
    d.addEventListener("click", function (e) {
      if (!H.classList.contains("bb-solo")) return;
      var el = e.target && e.target.closest ? e.target.closest("#lc,#lx,#payBox .op,input[name=m]") : null; if (!el) return;
      var inp = el.matches && el.matches("input") ? el : el.querySelector && el.querySelector("input[name=m]");
      if (inp && inp.value === "mpesa") return;
      e.preventDefault(); e.stopImmediatePropagation(); recusar(); rm.checked = true; marcar();
    }, true);
    var cont0 = $("cont");
    setInterval(function () { if (d.documentElement.classList.contains("bb-solo") && !rm.checked) { rm.checked = true; marcar(); if (!CHECKOUT) { var ct = $("cont"); if (ct) ct.classList.remove("hide"); } } }, 400);
    /* Moçambique e Tanzânia: M-Pesa escolhido por defeito (em vez do cripto) */
    var pais = $("pais");
    if (CHECKOUT && pais) pais.addEventListener("input", function () {
      if (/mo[cç]ambique|tanz[aâ]nia/i.test(pais.value)) { op.querySelector("input").checked = true; marcar(); var dc = $("dica"); if (dc) dc.textContent = "Pode pagar com M-Pesa: só precisa de confirmar com o PIN no telemóvel."; }
    });

    function caixa(depois, telInicial, obterPedido) {
      var cx = $("bb-mp"); if (cx) cx.remove();
      cx = d.createElement("div"); cx.id = "bb-mp";
      cx.innerHTML = "<label>Número M-Pesa</label><input id='bb-mpt' type='tel' inputmode='tel' maxlength='18' placeholder='84 123 4567 ou 0712 345 678'>" +
        "<div class='tx' id='bb-mpx'></div><button id='bb-mpb' type='button'>📱 Pagar com M-Pesa</button><div class='es' id='bb-mpe'></div>";
      depois.insertAdjacentElement("afterend", cx);
      var t = $("bb-mpt"); t.value = String(telInicial || "").replace(/[^\d+ ]/g, "");
      var tm;
      async function api(corpo) {
        var r = await fetch("/api/mpesa-pagar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
        try { return await r.json(); } catch (e) { return { erro: "O pagamento M-Pesa não respondeu. Tente outra vez." }; }
      }
      async function cotar() {
        var pid = await obterPedido(false); if (!pid || String(t.value).replace(/\D/g, "").length < 9) { $("bb-mpx").textContent = ""; return; }
        var j = await api({ order_id: pid, telefone: t.value, acao: "cotar" });
        $("bb-mpx").innerHTML = j.erro ? "" : "Produtos: " + din(j.subtotal, j.moeda) + "<br>Taxa da plataforma: " + din(j.taxa_plataforma, j.moeda) + (j.taxa_rede ? "<br>Taxa M-Pesa: " + din(j.taxa_rede, j.moeda) : "") + "<br><b>Total a pagar: " + din(j.total, j.moeda) + "</b>";
      }
      t.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(cotar, 500); });
      $("bb-mpb").onclick = async function () {
        var b = this, e = $("bb-mpe"); e.className = "es"; e.textContent = "";
        if (String(t.value).replace(/\D/g, "").length < 9) { e.className = "es er"; e.textContent = "Escreva o número M-Pesa completo."; return; }
        b.disabled = true;
        var pid = await obterPedido(true);
        if (!pid) { b.disabled = false; return; }
        e.innerHTML = "<div class='bb-pin'>📲 Veja o seu telemóvel e escreva o PIN do M-Pesa para confirmar. Não feche esta página.</div>";
        var j = await api({ order_id: pid, telefone: t.value });
        if (j.ok) {
          e.className = "es ok"; e.textContent = "✅ Pagamento confirmado (" + din(j.total, j.moeda) + "). O valor fica retido até à verificação dos produtos.";
          if (CHECKOUT) { try { localStorage.removeItem("carrinho"); } catch (x) {} }
          setTimeout(function () { location.href = "pagamento-ok.html?pedido=" + encodeURIComponent(pid); }, 1500);
          return;
        }
        e.className = "es er"; e.textContent = j.erro || "Não foi possível concluir o pagamento."; b.disabled = false;
      };
      cotar();
    }

    if (CHECKOUT) {
      /* checkout.html: depois de criar o pedido ("Continuar para o pagamento"), em vez do cartão/cripto mostra o M-Pesa */
      var original = window.iniciar;
      if (typeof original !== "function") return;
      window.iniciar = function (m) {
        if (m !== "mpesa" && H.classList.contains("bb-solo")) { recusar(); return Promise.resolve(); }
        if (m !== "mpesa") return original.apply(this, arguments);
        $("msg").textContent = ""; var a = $("aviso"); if (a) a.hidden = true; $("cartao").innerHTML = ""; var cs = $("cripto-sel"); if (cs) cs.hidden = true; $("pagar").hidden = true;
        caixa($("taxas"), ($("tel") || {}).value, async function () { try { return id; } catch (e) { return null; } });
        return Promise.resolve();
      };
    } else {
      /* pagar-link-v2.html: cria o pedido do link (com o endereço escolhido) e paga por M-Pesa */
      var cont = $("cont"), orig = cont.onclick;
      var pedidoLink = null;
      async function obterPedidoLink(criar) {
        if (pedidoLink) return pedidoLink;
        if (!criar) return null;
        var msg = $("msg");
        try { if (!escolhida) { msg.textContent = "Escolha um endereço de entrega."; return null; } } catch (e) { return null; }
        var r = await sb.rpc("criar_pedido_link", { p_link: L.id, p_morada: String(escolhida) });
        if (r.error) { msg.textContent = r.error.message; return null; }
        pedidoLink = r.data; try { orderId = r.data; } catch (e) {}
        return pedidoLink;
      }
      cont.onclick = function () {
        if (metodo() !== "mpesa" && H.classList.contains("bb-solo")) { recusar(); return; }
        if (metodo() !== "mpesa") return orig.apply(this, arguments);
        $("msg").textContent = ""; $("cartao").innerHTML = ""; $("taxas").innerHTML = "";
        try { if (!escolhida) { $("msg").textContent = "Escolha um endereço de entrega."; return; } } catch (e) {}
        cont.disabled = true;
        obterPedidoLink(true).then(function (pid) {
          cont.disabled = false; if (!pid) return;
          cont.classList.add("hide");
          caixa(cont, "", obterPedidoLink);
        });
      };
      radios().forEach(function (r) { r.addEventListener("change", function () { cont.classList.remove("hide"); }); });
    }
  }

  perguntar(0);
})();

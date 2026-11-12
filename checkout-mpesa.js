/* checkout-mpesa.js — BBabilônia (12/11/2026): opção "📱 M-Pesa" no pagamento (checkout.html e pagar-link-v2.html).
   O cliente escreve o número M-Pesa e toca em Pagar: no telemóvel aparece só o pedido do PIN (USSD Push).
   O valor fica retido na BBabilônia até à verificação dos produtos. Servidor: api/mpesa-pagar.js */
(function () {
  if (window.__bbMpesa) return; window.__bbMpesa = 1;
  var d = document, $ = function (i) { return d.getElementById(i); };
  var CHECKOUT = !!($("continuar") && $("pag")), LINK = !!($("cont") && $("payBox"));
  if (!CHECKOUT && !LINK) return;
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
  var op = d.createElement("label"); op.id = "bb-lmp";
  if (CHECKOUT) { op.innerHTML = '<input type="radio" name="m" value="mpesa">📱 M-Pesa'; grupo.appendChild(op); grupo.style.flexWrap = "wrap"; }
  else { op.className = "op"; op.innerHTML = '<input type="radio" name="m" value="mpesa"><div><b>📱 M-Pesa (Moçambique e Tanzânia)</b><small>Toque em pagar e confirme com o PIN do M-Pesa no seu telemóvel.</small></div>'; primeira.closest(".op").parentNode.insertBefore(op, primeira.closest(".op")); }
  function marcar() {
    if (CHECKOUT) { var lc = $("lc"), lx = $("lx"); if (lc) lc.className = metodo() === "cartao" ? "on" : ""; if (lx) lx.className = metodo() === "cripto" ? "on" : ""; op.className = metodo() === "mpesa" ? "on" : ""; }
    else d.querySelectorAll("#payBox .op").forEach(function (o) { o.classList.toggle("on", o.querySelector("input").checked); });
    var cx = $("bb-mp"); if (cx && metodo() !== "mpesa") cx.remove();
  }
  radios().forEach(function (r) { r.addEventListener("change", marcar); });
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
})();

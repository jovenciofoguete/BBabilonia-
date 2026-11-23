/* cartao-pagar.js — BBabilônia (23/11/2026)
   Pagamento por cartão (Stripe) em USD para quem está fora de Moçambique: destaque de produto, mensalidade e destaque de serviços.
   Fica aprovado sozinho quando o Stripe confirma (sem aprovação manual).
   Uso: BBCartao.pagar(caixa, sb, { tipo, ...dados }, depois)  — "caixa" é onde aparece o formulário do cartão. */
(function () {
  if (window.BBCartao) return;
  var d = document;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function stripeJs() {
    return new Promise(function (ok, nao) {
      if (window.Stripe) return ok();
      var s = d.createElement("script"); s.src = "https://js.stripe.com/v3/"; s.onload = function () { ok(); }; s.onerror = function () { nao(new Error("Não foi possível abrir o pagamento por cartão. Verifique a internet.")); };
      d.head.appendChild(s);
    });
  }
  async function pagar(caixa, sb, dados, depois) {
    caixa.innerHTML = '<p class="msg" style="color:#64748b">A preparar o pagamento…</p>';
    var s = (await sb.auth.getSession()).data.session;
    if (!s) { caixa.innerHTML = '<p class="msg">Entre de novo na sua conta.</p>'; return; }
    var j = {};
    try {
      var r = await fetch("/api/criar-pagamento", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + s.access_token }, body: JSON.stringify(dados) });
      j = await r.json().catch(function () { return {}; });
    } catch (e) { caixa.innerHTML = '<p class="msg">Sem ligação. Tente outra vez.</p>'; return; }
    if (j.erro || !j.client_secret) { caixa.innerHTML = '<p class="msg">' + esc(j.erro || "Não foi possível abrir o pagamento por cartão.") + "</p>"; return; }
    try { await stripeJs(); } catch (e) { caixa.innerHTML = '<p class="msg">' + esc(e.message) + "</p>"; return; }
    var total = Number(j.total).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USD";
    caixa.innerHTML = '<div data-cel style="margin:10px 0"></div><button class="bt" type="button" data-cpg>Pagar ' + esc(total) + '</button><p class="msg" data-cms></p>';
    var stripe = window.Stripe(j.publishable_key), el = stripe.elements({ clientSecret: j.client_secret });
    el.create("payment").mount(caixa.querySelector("[data-cel]"));
    var bt = caixa.querySelector("[data-cpg]"), m = caixa.querySelector("[data-cms]");
    bt.onclick = async function () {
      bt.disabled = true; bt.textContent = "A pagar…"; m.className = "msg"; m.textContent = "";
      var res = await stripe.confirmPayment({ elements: el, confirmParams: { return_url: location.href.split("#")[0] }, redirect: "if_required" });
      if (res.error) { m.textContent = res.error.message || "O pagamento não foi concluído."; bt.disabled = false; bt.textContent = "Pagar " + total; return; }
      caixa.innerHTML = '<p class="msg ok" style="color:#059669">✅ Pago! Fica ativo sozinho dentro de poucos segundos.</p>';
      if (typeof depois === "function") setTimeout(depois, 3000);
    };
  }
  window.BBCartao = { pagar: pagar };
})();

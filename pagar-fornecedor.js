/* pagar-fornecedor.js — BBabilônia (19/11/2026)
   Moçambique: o dinheiro do fornecedor sai sozinho para o M-Pesa dele, logo que o atendimento confirma o produto.
   Corre na página do saldo do fornecedor e nas páginas do atendimento. Pede ao servidor os pagamentos por fazer
   (função levantamentos_auto_pendentes) e manda pagar cada um (/api/mpesa-pagar, tipo pagar_fornecedor).
   Quem decide o valor e o número é a base de dados; esta página só pede "paga". */
(function () {
  if (window.__bbPF) return; window.__bbPF = 1;
  var SB = "https://dsfoqoeawvjafypycldz.supabase.co", K = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var ATD = false, ocupado = false;
  function sessao() {
    try {
      var a = JSON.parse(sessionStorage.getItem("bb-atd") || "null"); if (a && a.access_token) { ATD = true; return a; }
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) { var s = JSON.parse(localStorage.getItem(k) || "null"); if (s && s.access_token) return s; }
      }
    } catch (e) {}
    return null;
  }
  function rpc(s, nome) {
    return fetch(SB + "/rest/v1/rpc/" + nome, { method: "POST", headers: { apikey: K, Authorization: "Bearer " + s.access_token, "Content-Type": "application/json" }, body: "{}" })
      .then(function (r) { return r.ok ? r.json() : null; });
  }
  function pagar(s, id) {
    return fetch("/api/mpesa-pagar", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + s.access_token }, body: JSON.stringify({ tipo: "pagar_fornecedor", levantamento_id: id }) })
      .then(function (r) { return r.json(); }).catch(function () { return {}; });
  }
  function ciclo() {
    if (ocupado) return; var s = sessao(); if (!s) return; ocupado = true;
    (ATD ? Promise.resolve() : rpc(s, "pagar_pendentes_mz").catch(function () {}))
      .then(function () { return rpc(s, "levantamentos_auto_pendentes"); })
      .then(function (ids) {
        if (!Array.isArray(ids) || !ids.length) return;
        var pagos = 0, seq = Promise.resolve();
        ids.forEach(function (id) { seq = seq.then(function () { return pagar(s, id); }).then(function (r) { if (r && r.ok) pagos++; }); });
        return seq.then(function () {
          if (pagos && !ATD && !sessionStorage.getItem("bb-pf")) { sessionStorage.setItem("bb-pf", "1"); location.reload(); }
          else if (!pagos) sessionStorage.removeItem("bb-pf");
        });
      })
      .catch(function () {})
      .then(function () { ocupado = false; });
  }
  function arrancar() {
    setTimeout(ciclo, 1500); setInterval(ciclo, 30000);
    document.addEventListener("click", function () { if (ATD || sessao() && ATD) setTimeout(ciclo, 2500); }, true);
  }
  if (document.body) arrancar(); else document.addEventListener("DOMContentLoaded", arrancar);
})();

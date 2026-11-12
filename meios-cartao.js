/* meios-cartao.js — BBabilônia (12/11/2026): botão "💰 Meios para receber" no painel do vendedor (painel-vendedor-v2.html).
   Mostra se o fornecedor já registou M-Pesa / e-Mola / banco e leva a meios-receber.html. Não altera o painel. */
(function () {
  if (window.__bbMeiosCartao || !/painel-vendedor/.test(location.pathname)) return; window.__bbMeiosCartao = 1;
  var SB = "https://dsfoqoeawvjafypycldz.supabase.co", K = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  function sessao() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) { var s = JSON.parse(localStorage.getItem(k) || "null"); if (s && s.access_token) return s; }
      }
    } catch (e) {}
    return null;
  }
  var css = document.createElement("style");
  css.textContent = "#bb-meios{display:flex;gap:12px;align-items:center;margin:12px auto;max-width:620px;padding:14px;border-radius:16px;text-decoration:none;" +
    "background:linear-gradient(135deg,#065f46,#059669);color:#fff;box-shadow:0 4px 14px #0002;font-family:system-ui,sans-serif}" +
    "#bb-meios .i{font-size:28px}#bb-meios .t{flex:1}#bb-meios b{display:block;font-size:16px}#bb-meios small{display:block;font-size:13px;opacity:.95;margin-top:2px}" +
    "#bb-meios .s{background:#fff;color:#065f46;border-radius:999px;padding:6px 11px;font-size:12.5px;font-weight:800;white-space:nowrap}" +
    "#bb-meios.falta{background:linear-gradient(135deg,#b45309,#f59e0b)}#bb-meios.falta .s{color:#b45309}";
  document.head.appendChild(css);

  function por() {
    if (document.getElementById("bb-meios")) return true;
    var top = document.querySelector(".top");
    var a = document.createElement("a"); a.id = "bb-meios"; a.href = "meios-receber.html";
    a.innerHTML = "<span class='i'>💰</span><span class='t'><b>Meios para receber</b><small>M-Pesa, e-Mola, mKesh, banco… onde a BBabilônia lhe paga as vendas.</small></span><span class='s'>Abrir ›</span>";
    if (top && top.parentNode) top.insertAdjacentElement("afterend", a);
    else if (document.body) document.body.insertBefore(a, document.body.firstChild);
    else return false;
    estado(a);
    return true;
  }
  function estado(a) {
    var s = sessao(); if (!s || !s.user) return;
    fetch(SB + "/rest/v1/meios_recebimento?select=id&dono=eq." + s.user.id, { headers: { apikey: K, Authorization: "Bearer " + s.access_token } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (l) {
        if (!l) return;
        var st = a.querySelector(".s");
        if (l.length) st.textContent = "✅ " + l.length + " registado" + (l.length > 1 ? "s" : "");
        else { a.classList.add("falta"); st.textContent = "⚠️ Registar"; a.querySelector("small").textContent = "Ainda não registou nenhum. Sem isto não recebe o dinheiro das vendas."; }
      }).catch(function () {});
  }
  function arrancar() { if (por()) return; var n = 0, t = setInterval(function () { if (por() || ++n > 20) clearInterval(t); }, 300); }
  if (document.body) arrancar(); else document.addEventListener("DOMContentLoaded", arrancar);
})();

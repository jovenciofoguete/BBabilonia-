/* atd-aviso-verif.js — BBabilônia (12/11/2026): aviso aos agentes de atendimento quando há verificações de pedidos
   (fotos e vídeos dos agentes de verificação) à espera de confirmação "iguais ao pedido". Volta a ver de 60 em 60 s. */
(function () {
  if (window.__bbAtdVerif || /atd-verificacoes\.html$/.test(location.pathname)) return; window.__bbAtdVerif = 1;
  var SB = "https://dsfoqoeawvjafypycldz.supabase.co", K = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  function token() { try { var s = JSON.parse(sessionStorage.getItem("bb-atd") || "null"); return s && s.access_token; } catch (e) { return null; } }
  var css = document.createElement("style");
  css.textContent = "#bb-atd-verif{position:sticky;top:0;z-index:9998;display:flex;gap:10px;align-items:center;padding:11px 14px;background:#1d4ed8;color:#fff;font:700 14px/1.35 system-ui,sans-serif;text-decoration:none}" +
    "#bb-atd-verif span{flex:1}#bb-atd-verif b{background:#fff;color:#1d4ed8;border-radius:999px;padding:6px 12px;font-size:13px}";
  document.head.appendChild(css);
  function ver() {
    var t = token(); if (!t) return;
    fetch(SB + "/rest/v1/rpc/verificacoes_pendentes", { method: "POST", headers: { apikey: K, Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: "{}" })
      .then(function (r) { return r.ok ? r.json() : 0; }).catch(function () { return 0; }).then(function (n) {
        n = Number(n) || 0;
        var a = document.getElementById("bb-atd-verif");
        if (!n) { if (a) a.remove(); return; }
        if (!a) { a = document.createElement("a"); a.id = "bb-atd-verif"; a.href = "atd-verificacoes.html"; a.innerHTML = "<span></span><b>Ver ›</b>"; document.body.insertBefore(a, document.body.firstChild); }
        a.querySelector("span").textContent = "🛡️ " + n + (n === 1 ? " verificação de pedido à espera" : " verificações de pedidos à espera") + " da sua confirmação (fotos e vídeos do agente).";
      });
  }
  function arrancar() { ver(); setInterval(ver, 60000); }
  if (document.body) arrancar(); else document.addEventListener("DOMContentLoaded", arrancar);
})();

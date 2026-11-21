/* servicos-faixa.js — BBabilônia (14/11/2026; 21/11/2026 com bolinha de novidades)
   Na página inicial, na faixa onde está "Pague por cripto…", aparece primeiro o separador
   "🛠️ Aluguer, serviços e diversos", que abre servicos.html. Se há anúncios novos no país desde a última visita,
   mostra "🆕 N novidades" e abre direto em "Ver serviços". Não altera o resto da página. */
(function () {
  if (window.__bbServFaixa) return; window.__bbServFaixa = 1;
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var css = document.createElement("style");
  css.textContent = ".faixa a.bb-serv{flex:1 0 auto;display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,#ff6a00,#ff8c1a);color:#fff;border-radius:8px;padding:7px 12px;font-size:12.5px;font-weight:800;white-space:nowrap;text-decoration:none;box-shadow:0 2px 8px #ff6a0055}" +
    ".faixa a.bb-serv .bb-n{background:#fff;color:#c2410c;border-radius:999px;padding:1px 8px;font-size:11.5px;font-weight:900}";
  document.head.appendChild(css);
  function pais() {
    try { var p = JSON.parse(localStorage.getItem("bb_prefs") || "null"); if (p && p.escolhido && /^[A-Za-z]{2}$/.test(p.pais || "")) return String(p.pais).toUpperCase(); } catch (e) {}
    return "";
  }
  function desde(c) {
    var v = ""; try { v = localStorage.getItem("bb-serv-visto-" + c) || ""; } catch (e) {}
    return v || new Date(Date.now() - 7 * 864e5).toISOString();
  }
  function token() { try { var j = JSON.parse(localStorage.getItem("sb-dsfoqoeawvjafypycldz-auth-token") || "null"); return (j && j.access_token) || ""; } catch (e) { return ""; } }
  function chamar(c, t) {
    return fetch(SUPA + "/rest/v1/rpc/servicos_novidades", { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + (t || KEY), "Content-Type": "application/json" }, body: JSON.stringify({ p_pais: c, p_desde: desde(c) }) });
  }
  async function contar() {
    var c = pais(); if (!c) return 0;
    try {
      var t = token(), r = t ? await chamar(c, t) : null;   /* com sessão: não conta os anúncios da própria pessoa */
      if (!r || !r.ok) r = await chamar(c, "");
      if (!r.ok) return 0;
      return Number(await r.json()) || 0;
    } catch (e) { return 0; }
  }
  async function bolinha(a) {
    var n = await contar(), b = a.querySelector(".bb-n");
    if (b) b.remove();
    if (n > 0) { b = document.createElement("span"); b.className = "bb-n"; b.textContent = "🆕 " + n + (n === 1 ? " novidade" : " novidades"); a.appendChild(b); a.href = "servicos.html?novo=1"; }
    else a.href = "servicos.html";
  }
  function porFaixa() {
    var f = document.querySelector(".faixa");
    if (!f) return false;
    var a = f.querySelector("a.bb-serv");
    if (!a) {
      a = document.createElement("a");
      a.className = "bb-serv"; a.href = "servicos.html";
      a.innerHTML = "🛠️ Aluguer, serviços e diversos ›";
      f.insertBefore(a, f.firstChild);
    }
    bolinha(a);
    return true;
  }
  if (!porFaixa()) document.addEventListener("DOMContentLoaded", porFaixa);
  window.addEventListener("pageshow", function (e) { if (e.persisted) porFaixa(); });
  window.addEventListener("bb-prefs", porFaixa);
})();

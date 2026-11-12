/* aviso-validade.js — BBabilônia (12/11/2026)
   Aviso do bilhete de identidade (BI): 30 dias antes de expirar avisa; expirado avisa que a conta vai ser bloqueada;
   bloqueado diz como reativar. Também pede os dados a quem ainda não os registou.
   Usar com ?de=forn (painel do vendedor), ?de=atd (atendimento) ou ?de=verif (busca e verificação). */
(function () {
  if (window.__bbAvisoVal) return; window.__bbAvisoVal = 1;
  var SB = "https://dsfoqoeawvjafypycldz.supabase.co", K = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var src = (document.currentScript && document.currentScript.src) || "";
  var de = (/[?&]de=(forn|atd|verif)/.exec(src) || [])[1] || "forn";
  if (/meus-dados\.html$/.test(location.pathname) || /loja-criar\.html$/.test(location.pathname)) return;
  function sessao() {
    try {
      var raw = de === "forn" ? localStorage.getItem("sb-dsfoqoeawvjafypycldz-auth-token")
        : sessionStorage.getItem(de === "atd" ? "bb-atd" : "bb-verif");
      var s = JSON.parse(raw || "null"); return s && s.access_token ? s : null;
    } catch (e) { return null; }
  }
  var tent = 0;
  function tentar() {
    var s = sessao();
    if (!s) { if (++tent < 40) setTimeout(tentar, 1500); return; }
    if (String((s.user && s.user.email) || "").toLowerCase() === "jovenciofoguete1904@gmail.com") return;
    fetch(SB + "/rest/v1/rpc/minha_validade", { method: "POST", headers: { apikey: K, Authorization: "Bearer " + s.access_token, "Content-Type": "application/json" }, body: "{}" })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(mostrar);
  }
  function mostrar(v) {
    if (!v || !v.estado || v.estado === "ok" || v.estado === "sem_sessao") return;
    var link = de === "forn" ? "loja-criar.html" : "meus-dados.html?de=" + de;
    var t, cor;
    if (v.estado === "sem_dados") { t = de === "forn" ? "Falta a identidade do responsável da loja (foto de meio corpo e BI)." : "Falta registar os seus dados (foto de meio corpo, morada, NUIT e BI)."; cor = "am"; }
    else if (v.estado === "aviso") { t = "⚠️ O seu bilhete de identidade expira em " + v.dias + " dia(s). Atualize para a conta não ser bloqueada."; cor = "am"; }
    else if (v.estado === "expirado") { t = "⛔ O seu bilhete de identidade expirou. Atualize já: a conta será bloqueada em " + Math.max(0, 7 + v.dias) + " dia(s)."; cor = "vm"; }
    else { t = "⛔ A sua conta está bloqueada porque o bilhete de identidade expirou. Atualize para reativar."; cor = "vm"; }
    var css = document.createElement("style");
    css.textContent = "#bb-aval-bi{position:sticky;top:0;z-index:9999;display:flex;gap:10px;align-items:center;padding:10px 12px;font:600 14px/1.35 system-ui,sans-serif}" +
      "#bb-aval-bi.am{background:#fef3c7;color:#92400e}#bb-aval-bi.vm{background:#fee2e2;color:#991b1b}" +
      "#bb-aval-bi span{flex:1}#bb-aval-bi a{flex:none;background:#0f172a;color:#fff;text-decoration:none;border-radius:999px;padding:8px 12px;font-weight:800;font-size:13px}" +
      "#bb-aval-bi button{flex:none;border:0;background:none;font-size:20px;color:inherit;padding:0 4px}";
    document.head.appendChild(css);
    var d = document.createElement("div"); d.id = "bb-aval-bi"; d.className = cor; d.setAttribute("translate", "yes");
    d.innerHTML = "<span></span><a></a>" + (cor === "am" ? "<button type='button' aria-label='Fechar'>×</button>" : "");
    d.querySelector("span").textContent = t;
    var a = d.querySelector("a"); a.href = link; a.textContent = v.estado === "sem_dados" ? "Preencher" : "Atualizar";
    var x = d.querySelector("button"); if (x) x.onclick = function () { d.remove(); };
    document.body.insertBefore(d, document.body.firstChild);
  }
  if (document.body) tentar(); else document.addEventListener("DOMContentLoaded", tentar);
})();

/* perfil-rosto.js — BBabilônia (22/11/2026)
   Só mostra a foto e o nome; não muda mais nada nas páginas (setas, botão voltar, separadores ficam iguais).
   - Botão "👤 Perfil" dos agentes: passa a ter a foto e o nome do agente (continua a abrir "O meu perfil").
   - Atendimento: a foto do agente ao lado do nome, no cabeçalho.
   - Página "O meu perfil": no fim, 👥 Equipa BBabilônia com a foto e o nome do fundador e CEO e de todos os agentes.
   Carregado pelo atd-sessao.js (service.bbabilonia.com). */
(function () {
  if (typeof document === "undefined" || window.__bbRosto) return; window.__bbRosto = 1;
  if (/^(admin|administrator)\./i.test(location.hostname)) return;
  var naPerfil = /agente-perfil(\.html)?$/.test(location.pathname);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function foto(u, cls) { return u ? '<img class="' + cls + '" src="' + esc(u) + '" alt="">' : '<span class="' + cls + ' bb-sem">👤</span>'; }
  function primeiro(n) { return String(n || "").trim().split(/\s+/)[0] || ""; }

  var css = document.createElement("style");
  css.textContent =
    "a.bb-rosto-bt{display:inline-flex!important;align-items:center;gap:6px;padding:4px 12px 4px 4px!important}" +
    ".bb-rf{width:30px;height:30px;border-radius:50%;object-fit:cover;background:#ffffff55;flex:none;display:inline-flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff}" +
    "#bb-eu-f{flex:none;display:inline-flex}#bb-eu-f .bb-rf{width:38px;height:38px}" +
    "body.bb-inicio #bb-eu-f{display:none!important}" +
    "#bb-equipa h3{font-size:16px;margin:0 0 10px}" +
    "#bb-equipa .bb-eq{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:12px}" +
    "#bb-equipa .bb-eqp{text-align:center;font-size:13px;line-height:1.3}" +
    "#bb-equipa .bb-ef{width:70px;height:70px;border-radius:50%;object-fit:cover;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 6px}" +
    "#bb-equipa .bb-eqp b{display:block;font-size:13.5px;word-break:break-word}#bb-equipa .bb-eqp small{color:#64748b}";

  async function meuRosto(sb) {
    var r = await sb.rpc("perfil_meu_ver");
    if (r.error || !r.data) return;
    var d = r.data;
    if (!d.foto_url && !d.nome) return;
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="agente-perfil.html"]'), function (a) {
      a.classList.add("bb-rosto-bt");
      a.innerHTML = foto(d.foto_url, "bb-rf") + "<span>" + esc(primeiro(d.nome) || "Perfil") + "</span>";
    });
    var eu = document.getElementById("eu");
    if (eu && eu.parentNode) {
      var s = document.getElementById("bb-eu-f");
      if (!s) { s = document.createElement("span"); s.id = "bb-eu-f"; eu.parentNode.insertBefore(s, eu); }
      s.innerHTML = foto(d.foto_url, "bb-rf");
    }
  }

  async function equipa(sb) {
    if (!naPerfil) return;
    var main = document.querySelector("main"); if (!main) return;
    var r = await sb.rpc("perfil_equipa_rostos");
    if (r.error || !Array.isArray(r.data) || !r.data.length) return;
    var box = document.getElementById("bb-equipa");
    if (!box) { box = document.createElement("section"); box.id = "bb-equipa"; box.className = "box"; main.appendChild(box); }
    box.innerHTML = "<h3>👥 Equipa BBabilônia</h3><div class=\"bb-eq\">" + r.data.map(function (x) {
      var eq = x.equipa === "dono" ? "Fundador e CEO da BBabilônia" : x.equipa === "atendimento" ? "🎧 Atendimento" : "🛡️ Busca e verificação";
      var nome = x.equipa === "dono" && (!x.nome || x.nome === "Dono da BBabilônia") ? "BBabilônia" : (x.nome || "");
      return '<div class="bb-eqp">' + foto(x.foto_url, "bb-ef") + "<b>" + esc(nome) + "</b><small>" + eq + "</small></div>";
    }).join("") + "</div>";
  }

  var aCorrer = false;
  async function mostrar() {
    if (aCorrer) return; aCorrer = true;
    try {
      var sb = window.sb;
      var s = (await sb.auth.getSession()).data.session;
      if (!s) return;
      await meuRosto(sb);
      await equipa(sb);
    } catch (e) {}
    finally { aCorrer = false; }
  }

  function arrancar(n) {
    if (!window.sb || !window.sb.auth || !window.sb.rpc) { if (n < 100) setTimeout(function () { arrancar(n + 1); }, 100); return; }
    document.head.appendChild(css);
    mostrar();
    try { window.sb.auth.onAuthStateChange(function (ev) { if (ev === "SIGNED_IN") setTimeout(mostrar, 400); }); } catch (x) {}
    /* depois de guardar o perfil, a foto e o nome novos aparecem logo */
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#gr")) setTimeout(mostrar, 1500); }, true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();

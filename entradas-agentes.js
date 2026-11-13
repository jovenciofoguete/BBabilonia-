/* entradas-agentes.js — B-Babilônia (13/11/2026, v2)
   1) Painel do dono: as aprovações dos agentes ficam em 👥 Agentes (número vermelho no cartão);
      o Atendimento do painel do dono fica só para ajudar a equipa (sem o separador 🔐 Entradas).
   2) Ecrã "À espera de aprovação" do agente: diz quem aprova e o botão "Verificar agora"
      passa a mostrar o resultado (antes verificava mas não mostrava nada enquanto não aprovassem).
   Não altera painel-admin.html nem atendimento.html: só acrescenta. */
(function () {
  if (window.__bbEntradas) return; window.__bbEntradas = 1;
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function hora() { return new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
  function quando(d) { try { return new Date(d).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }

  /* ---------- 1) PAINEL DO DONO: tudo o que é para aprovar dos agentes fica em 👥 Agentes ---------- */
  function painelDono() {
    var at = document.querySelector('#t-inicio a[href="atendimento.html"]');
    if (at) { var s1 = at.querySelectorAll("span")[1]; if (s1) s1.textContent = "Casos, fila e conversas: ajudar a equipa de atendimento"; }
    var ag = document.querySelector('#t-inicio a[href="admin-agentes.html"]');
    if (!ag) return false;
    var s2 = ag.querySelectorAll("span")[1]; if (s2) s2.textContent = "Atendimento e busca/verificação: adicionar, remover e 🔐 aprovar entradas";
    if (!ag.querySelector(".bb-pend")) {
      var em = document.createElement("em"); em.className = "bb-pend";
      em.style.cssText = "position:absolute;top:10px;right:10px;background:#ef4444;color:#fff;font-style:normal;font-weight:800;font-size:13px;border-radius:999px;padding:2px 9px;display:none";
      if (getComputedStyle(ag).position === "static") ag.style.position = "relative";
      ag.appendChild(em);
      contar(); setInterval(function () { if (!document.hidden) contar(); }, 20000);
    }
    return true;
  }
  async function contar() {
    var em = document.querySelector("#t-inicio .bb-pend"); if (!em) return;
    try {
      var r = await sb.rpc("admin_entradas_lista");
      var n = r.error ? 0 : (r.data || []).filter(function (x) { return x.estado === "pendente"; }).length;
      em.textContent = "🔐 " + n; em.style.display = n ? "block" : "none";
    } catch (e) {}
  }
  function esperarCartao(n) { if (!painelDono() && n < 80) setTimeout(function () { esperarCartao(n + 1); }, 250); }

  /* no atendimento do painel do dono não há aprovações (estão em 👥 Agentes) */
  function atendimentoDono() {
    if (!/^(admin|administrator)\./i.test(location.hostname) || !$("tabs")) return;
    if (new URLSearchParams(location.search).get("f") === "entradas") { location.replace("admin-agentes.html"); return; }
    var css = document.createElement("style"); css.textContent = '#tabs button[data-t="entradas"]{display:none!important}'; document.head.appendChild(css);
  }

  /* ---------- 2) ECRÃ DO AGENTE "À ESPERA DE APROVAÇÃO" ---------- */
  function ecraAgente() {
    var bt = $("reenv"), p2 = $("passo2"); if (!bt || !p2 || bt.__bbEnt) return; bt.__bbEnt = 1;
    var t = $("p2t");
    if (t && /supervisor para aprovar/.test(t.textContent)) t.textContent = "Pedimos ao dono da plataforma (ou a um agente Superior) para aprovar a sua entrada neste aparelho. Assim que aprovar, o painel abre sozinho.";
    var st = document.createElement("p"); st.id = "bb-est";
    st.style.cssText = "margin-top:10px;font-size:14px;font-weight:700;text-align:center;color:#64748b;min-height:20px";
    bt.insertAdjacentElement("afterend", st);
    var orig = bt.textContent;
    bt.onclick = async function () {
      if (bt.disabled) return;
      bt.disabled = true; bt.textContent = "A verificar…"; st.style.color = "#64748b"; st.textContent = "";
      try { if (typeof window.pedirAprovacao === "function") await window.pedirAprovacao(); } catch (e) {}
      bt.disabled = false; bt.textContent = orig;
      if (p2.classList.contains("hide")) return;                        /* aprovado: o painel já abriu */
      var ic = $("p2i"), m2 = $("m2");
      if (m2 && m2.textContent) { st.style.color = "#dc2626"; st.textContent = "Não foi possível verificar: " + m2.textContent; return; }
      if (ic && ic.textContent.indexOf("⛔") > -1) { st.style.color = "#dc2626"; st.textContent = "⛔ Entrada recusada ou aparelho desligado. Toque em Sair e entre de novo."; return; }
      st.style.color = "#b45309";
      st.textContent = "⏳ Ainda não aprovado (verificado às " + hora() + "). Deixe esta página aberta: abre sozinha assim que o dono aprovar.";
    };
  }

  function arrancar(n) {
    if (typeof window.sb === "undefined" || !window.sb || !window.sb.from) { if (n < 100) setTimeout(function () { arrancar(n + 1); }, 150); return; }
    if ($("t-inicio")) esperarCartao(0);
    if ($("reenv")) { ecraAgente(); atendimentoDono(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();

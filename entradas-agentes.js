/* entradas-agentes.js — B-Babilônia (13/11/2026)
   1) Painel do dono: caixa "🔐 Entradas dos agentes à espera" no topo do Início,
      com ✅ Aprovar / ❌ Recusar (os mesmos pedidos do separador 🔐 Entradas do atendimento).
   2) Ecrã "À espera de aprovação" do agente: diz quem aprova e o botão "Verificar agora"
      passa a mostrar o resultado (antes verificava mas não mostrava nada enquanto não aprovassem).
   Não altera painel-admin.html nem atendimento.html: só acrescenta. */
(function () {
  if (window.__bbEntradas) return; window.__bbEntradas = 1;
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function hora() { return new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
  function quando(d) { try { return new Date(d).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }

  /* ---------- 1) PAINEL DO DONO ---------- */
  function painelDono() {
    var ini = $("t-inicio"); if (!ini || $("bb-ent")) return;
    var css = document.createElement("style");
    css.textContent = "#bb-ent{background:#fff;border-radius:16px;padding:14px;margin:4px 0 14px;box-shadow:0 4px 14px #0001;border:3px solid #f59e0b}" +
      "#bb-ent.vz{border-color:#e2e8f0}#bb-ent h3{font-size:16px;margin:0 0 4px;display:flex;align-items:center;gap:8px}" +
      "#bb-ent h3 i{font-style:normal;background:#ef4444;color:#fff;border-radius:999px;padding:1px 9px;font-size:13px}" +
      "#bb-ent p{font-size:13px;color:#64748b;margin:0}#bb-ent .it{border-top:1px solid #e2e8f0;padding:10px 0}" +
      "#bb-ent .it b{display:block;font-size:15px;word-break:break-all}#bb-ent .it small{display:block;color:#64748b;font-size:12.5px}" +
      "#bb-ent .bs{display:flex;gap:8px;margin-top:8px}#bb-ent .bs button{flex:1;border:0;border-radius:12px;padding:12px;font:inherit;font-size:14.5px;font-weight:800;color:#fff}" +
      "#bb-ent .ok{background:#10b981}#bb-ent .no{background:#ef4444}#bb-ent button:disabled{opacity:.5}" +
      "#bb-ent .er{color:#dc2626;font-size:13.5px;font-weight:700;margin-top:6px}" +
      "#bb-ent a.lk{display:block;text-align:center;margin-top:10px;padding:11px;border-radius:12px;background:#eff6ff;color:#1d4ed8;font-weight:800;font-size:14px;text-decoration:none}";
    document.head.appendChild(css);
    var box = document.createElement("div"); box.id = "bb-ent"; box.className = "vz";
    box.innerHTML = "<h3>🔐 Entradas dos agentes</h3><p>A carregar…</p>";
    ini.insertBefore(box, ini.firstChild);
    carregar(); setInterval(function () { if (!document.hidden) carregar(); }, 20000);
  }

  var nomes = {};
  async function carregar() {
    var box = $("bb-ent"); if (!box || box.__ocupado) return; box.__ocupado = 1;
    try {
      var r = await sb.from("sessoes_atendimento").select("*").eq("estado", "pendente").order("pedido_em", { ascending: false });
      try { var a = await sb.from("agentes").select("email,nome"); (a.data || []).forEach(function (x) { if (x.nome) nomes[String(x.email).toLowerCase()] = x.nome; }); } catch (e) {}
      try { var b = await sb.rpc("admin_agentes_lista"); (b.data || []).forEach(function (x) { if (x.nome) nomes[String(x.email).toLowerCase()] = x.nome + (x.equipa === "verificacao" ? " · 🛡️ Busca e verificação" : " · 🎧 Atendimento"); }); } catch (e) {}
      pintar(r.error ? null : (r.data || []), r.error);
    } finally { box.__ocupado = 0; }
  }

  function pintar(l, erro) {
    var box = $("bb-ent"), lk = '<a class="lk" href="atendimento.html?f=entradas">Abrir todas as entradas (aparelhos aprovados e desligar) ›</a>';
    if (erro || !l) {
      box.className = "vz";
      box.innerHTML = "<h3>🔐 Entradas dos agentes</h3><p>Os pedidos de entrada dos agentes aprovam-se no atendimento, separador 🔐 Entradas.</p>" + lk;
      return;
    }
    if (!l.length) {
      box.className = "vz";
      box.innerHTML = "<h3>🔐 Entradas dos agentes</h3><p>Nenhum agente à espera de aprovação. 👍</p>" + lk;
      return;
    }
    box.className = "";
    box.innerHTML = "<h3>🔐 Agentes à espera de aprovação <i>" + l.length + "</i></h3><p>Só aprove se conhece a pessoa e o aparelho.</p>" +
      l.map(function (x) {
        var em = String(x.email || "").toLowerCase();
        return '<div class="it"><b>' + esc(nomes[em] || em) + "</b>" + (nomes[em] ? "<small>" + esc(em) + "</small>" : "") +
          "<small>📱 " + esc(x.aparelho || "Aparelho") + " · pedido " + esc(quando(x.pedido_em)) + "</small>" +
          '<div class="bs"><button class="ok" data-ss="' + esc(x.session_id) + '" data-ok="1">✅ Aprovar</button><button class="no" data-ss="' + esc(x.session_id) + '" data-ok="0">❌ Recusar</button></div><div class="er"></div></div>';
      }).join("") + lk;
    box.querySelectorAll("[data-ss]").forEach(function (bt) {
      bt.onclick = async function () {
        var ok = bt.getAttribute("data-ok") === "1", it = bt.closest(".it"), er = it.querySelector(".er");
        if (!ok && !confirm("Recusar esta entrada?")) return;
        it.querySelectorAll("button").forEach(function (z) { z.disabled = true; }); er.textContent = "";
        var r = await sb.rpc("decidir_sessao", { p_sessao: bt.getAttribute("data-ss"), p_aprovar: ok });
        if (r.error) {
          it.querySelectorAll("button").forEach(function (z) { z.disabled = false; });
          er.innerHTML = esc(r.error.message) + '<br><a href="atendimento.html?f=entradas">Aprovar no atendimento ›</a>';
          return;
        }
        it.innerHTML = '<b style="color:' + (ok ? "#047857" : "#b91c1c") + '">' + (ok ? "✅ Aprovado — o painel do agente abre sozinho." : "❌ Recusado.") + "</b>";
        setTimeout(carregar, 1500);
      };
    });
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
    if ($("t-inicio")) painelDono();
    if ($("reenv")) ecraAgente();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();

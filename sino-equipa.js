/* sino-equipa.js — BBabilônia (14/11/2026): sino 🔔 dos avisos para a EQUIPA
   Agentes (service.bbabilonia.com) e dono (administrator.bbabilonia.com). Os avisos já eram guardados
   (nova compra, pagamentos por levantamento, provas do transporte, disputas…) mas estas páginas não tinham sino.
   - Usa a sessão da própria página (window.sb): no service a do agente (bb-atd), no administrator a do dono.
   - Cada domínio só mostra os seus avisos: no service os dos agentes; no administrator os do dono e das páginas
     dos agentes (o dono também os chefia). Nunca os de cliente/fornecedor. Os mais recentes primeiro.
   - Toque no sino: lista dos avisos; toque num aviso: abre a página; ao abrir a lista ficam lidos.
   Carregado pelo atd-sessao.js (páginas dos agentes) e pelo painel-admin-rececao.js (painel do dono). */
(function () {
  if (window.__bbSinoEq) return; window.__bbSinoEq = 1;
  var h = location.hostname;
  var AG = /^(service|atendimento)\./i.test(h), DONO = /^(admin|administrator)\./i.test(h);
  if (!AG && !DONO) return;
  var d = document;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function quando(a) { var t = a.criado_em || a.created_at; try { return t ? new Date(t).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""; } catch (e) { return ""; } }
  function lados() { return new Promise(function (ok) { if (window.BBLado) return ok(); var x = d.querySelector('script[src*="lados.js"]'); if (!x) { x = d.createElement("script"); x.src = "lados.js?v=1"; (d.head || d.documentElement).appendChild(x); } x.addEventListener("load", ok); x.addEventListener("error", ok); setTimeout(ok, 4000); }); }
  /* este aviso é deste domínio? */
  function meu(a) {
    var L = window.BBLado; if (!L) return true;
    var lado = L.ladoDoHost(), p = L.pagina(a.link || ""), x = L.ladoDoAviso(a, {}, null);
    if (x === null || x === lado) return true;
    /* o dono também chefia os agentes (aprova entradas, casos sem resposta, compras…): vê os avisos dos agentes, nunca os de cliente/fornecedor */
    return lado === "dono" && (x === "agente" || (L.listas && L.listas.SERVICO.indexOf(p) > -1));
  }

  var css = d.createElement("style");
  css.textContent = "#bb-seq{position:fixed;right:14px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:9990;width:56px;height:56px;border-radius:50%;border:0;display:none;align-items:center;justify-content:center;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;box-shadow:0 8px 20px #ea580c66;cursor:pointer}" +
    "#bb-seq svg{width:27px;height:27px}#bb-seq i{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;border-radius:11px;background:#dc2626;color:#fff;font:800 12px system-ui,sans-serif;font-style:normal;display:none;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff}" +
    "#bb-seq-f{position:fixed;inset:0;z-index:9995;background:#0f172a99;display:none;align-items:flex-end;justify-content:center;font-family:system-ui,sans-serif}" +
    "#bb-seq-j{background:#fff;color:#0f172a;width:100%;max-width:560px;max-height:85vh;overflow:auto;border-radius:18px 18px 0 0;padding:14px 14px 22px}" +
    "#bb-seq-j h3{margin:0 0 8px;font-size:17px;display:flex;align-items:center;justify-content:space-between}#bb-seq-j h3 button{border:0;background:#f1f5f9;border-radius:50%;width:36px;height:36px;font-size:20px}" +
    ".bb-seq-a{display:block;width:100%;text-align:left;border:0;border-top:1px solid #e2e8f0;background:#fff;padding:12px 4px;font:inherit;color:inherit;cursor:pointer}.bb-seq-a.novo{background:#fff7ed}" +
    ".bb-seq-a b{display:block;font-size:14.5px}.bb-seq-a span{display:block;font-size:13.5px;color:#334155;margin-top:2px}.bb-seq-a small{display:block;font-size:12px;color:#64748b;margin-top:3px}.bb-seq-a em{font-style:normal;color:#2563eb;font-weight:700}" +
    ".bb-seq-v{text-align:center;color:#64748b;padding:24px 8px;font-size:14px}";
  d.head.appendChild(css);
  var b = d.createElement("button"); b.id = "bb-seq"; b.type = "button"; b.setAttribute("aria-label", "Avisos");
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><i></i>';
  var f = d.createElement("div"); f.id = "bb-seq-f";
  f.innerHTML = '<div id="bb-seq-j" role="dialog" aria-label="Avisos"><h3>🔔 Avisos<button type="button" aria-label="Fechar">×</button></h3><div id="bb-seq-l"><div class="bb-seq-v">A carregar…</div></div></div>';

  var L = [], eu = null;
  async function sessao() { try { var r = await window.sb.auth.getSession(); return r && r.data && r.data.session; } catch (e) { return null; } }
  async function carregar() {
    var s = await sessao();
    if (!s) { b.style.display = "none"; return null; }
    eu = s.user.id; b.style.display = "flex";
    /* os mais recentes primeiro; a coluna da data pode chamar-se created_at ou criado_em: tenta as duas e, se nenhuma existir, lê sem ordem */
    var r = null, cols = ["created_at", "criado_em", null];
    for (var k = 0; k < cols.length; k++) {
      var q = window.sb.from("avisos").select("*").eq("user_id", eu);
      r = await (cols[k] ? q.order(cols[k], { ascending: false }) : q).limit(300);
      if (!r.error) break;
    }
    if (!r || r.error) return null;
    await lados();
    L = (r.data || []).filter(meu).sort(function (x, y) { return new Date(y.criado_em || y.created_at || 0) - new Date(x.criado_em || x.created_at || 0) || (y.id > x.id ? 1 : -1); });
    var n = L.filter(function (a) { return a.lido !== true; }).length, c = b.querySelector("i");
    c.textContent = n > 99 ? "99+" : n; c.style.display = n ? "flex" : "none";
    return L;
  }
  function pintar() {
    var l = d.getElementById("bb-seq-l");
    l.innerHTML = L.length ? L.slice(0, 100).map(function (a, i) {
      return '<button type="button" class="bb-seq-a' + (a.lido !== true ? " novo" : "") + '" data-i="' + i + '"><b>' + esc(a.titulo) + "</b>" + (a.texto ? "<span>" + esc(a.texto) + "</span>" : "") +
        "<small>" + esc(quando(a)) + (a.link ? ' · <em>Abrir ›</em>' : "") + "</small></button>";
    }).join("") : '<div class="bb-seq-v">Ainda não há avisos. 👍</div>';
  }
  async function marcarLidos() {
    var ids = L.filter(function (a) { return a.lido !== true; }).map(function (a) { return a.id; });
    if (!ids.length) return;
    try { await window.sb.from("avisos").update({ lido: true }).eq("user_id", eu).in("id", ids); } catch (e) {}
    L.forEach(function (a) { a.lido = true; }); var c = b.querySelector("i"); c.style.display = "none";
  }
  b.onclick = async function () { f.style.display = "flex"; pintar(); await carregar(); pintar(); setTimeout(marcarLidos, 1500); };
  f.addEventListener("click", function (e) {
    if (e.target === f || e.target.closest("h3 button")) { f.style.display = "none"; return; }
    var x = e.target.closest("[data-i]"); if (!x) return;
    var a = L[Number(x.getAttribute("data-i"))]; f.style.display = "none";
    if (a && a.link) location.href = a.link;
  });

  var n = 0;
  (function arrancar() {
    if (!window.sb || !window.sb.auth || !window.sb.from || !d.body) { if (++n < 100) setTimeout(arrancar, 150); return; }
    d.body.appendChild(b); d.body.appendChild(f);
    carregar();
    setInterval(function () { if (!d.hidden) carregar(); }, 30000);
    d.addEventListener("visibilitychange", function () { if (!d.hidden) carregar(); });
    try { window.sb.auth.onAuthStateChange(function () { setTimeout(carregar, 400); }); } catch (e) {}
  })();
  window.BBSinoEquipa = { recarregar: carregar };
})();

/* contas-equipa.js — BBabilônia (23/11/2026)
   "Clientes e lojas": lista com 🔍 procurar pelo nome, email, nome da loja ou código;
   Bloquear / Desbloquear, ⛔ Para sempre e, depois do bloqueio para sempre, 🗑️ Remover.
   Usado no painel do dono (administrator) e no atendimento, só por agentes SUPERIORES (service).
   O servidor confirma quem pode (funções contas_equipa_*). Uso: BBContas.montar(elemento, sb) */
(function () {
  if (window.BBContas) return;
  var d = document;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function dt(x) { try { return x ? new Date(x).toLocaleDateString("pt-PT") : "—"; } catch (e) { return "—"; } }
  function low(s) { return String(s || "").toLowerCase(); }
  function erroTxt(e) { var t = String(e && e.message || e); return /function|find|exist|relation/i.test(t) ? "Falta correr o SQL novo (PARTE B) no Supabase." : t; }
  var EST = { aprovada: "aprovada", pendente: "pendente", suspensa: "suspensa", rejeitada: "rejeitada", fechada: "fechada" };
  function css() {
    if (d.getElementById("bbc-css")) return;
    var s = d.createElement("style"); s.id = "bbc-css";
    s.textContent = ".bbc *{box-sizing:border-box}.bbc .bx{background:#fff;border-radius:16px;padding:14px;box-shadow:0 4px 14px #0f172a12;margin-bottom:12px;font-family:system-ui,sans-serif;color:#0f172a}" +
      ".bbc .tt{font-weight:800;font-size:16px}.bbc .ab{display:flex;gap:8px;margin:10px 0 0}.bbc .ab button{flex:1;border:2px solid #e2e8f0;background:#fff;border-radius:999px;padding:9px 6px;font:700 14px system-ui,sans-serif;color:#334155}" +
      ".bbc .ab button.on{background:#1e3a8a;border-color:#1e3a8a;color:#fff}.bbc input{width:100%;margin-top:10px;padding:12px;border:2px solid #e2e8f0;border-radius:12px;font:16px system-ui,sans-serif}" +
      ".bbc .it{padding:11px 0;border-top:1px solid #e2e8f0}.bbc .it:first-child{border-top:0}.bbc .it b{display:block;font-size:15px;word-break:break-word}.bbc .it small{display:block;color:#64748b;font-size:12.5px;line-height:1.5;word-break:break-word}" +
      ".bbc .cd{display:inline-block;background:#f1f5f9;border-radius:6px;padding:0 6px;font:700 12px monospace;color:#0f172a}.bbc .es{display:inline-block;margin-top:4px;font-size:12px;font-weight:800;padding:2px 9px;border-radius:20px;background:#fee2e2;color:#991b1b}" +
      ".bbc .bs{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.bbc .bs button{border:0;border-radius:8px;padding:6px 10px;font:700 12.5px system-ui,sans-serif;background:#f1f5f9;color:#334155}" +
      ".bbc .bs .r{background:#fee2e2;color:#991b1b}.bbc .bs .n{background:#1f2937;color:#fff}.bbc .bs .v{background:#d1fae5;color:#065f46}.bbc .bs button:disabled{opacity:.5}" +
      ".bbc .vz{text-align:center;color:#64748b;padding:18px 8px;font-size:14px}.bbc .msg{font-size:13px;margin-top:6px;color:#dc2626}.bbc .msg.ok{color:#059669}.bbc .msg:empty{display:none}";
    d.head.appendChild(s);
  }
  function montar(el, sb) {
    css();
    var E = { lado: "clientes", L: [], q: "" };
    el.classList.add("bbc");
    el.innerHTML = '<div class="bx"><div class="tt">👥 Clientes e lojas</div>' +
      '<div class="ab"><button type="button" data-l="clientes" class="on">🛍️ Clientes</button><button type="button" data-l="lojas">🏪 Lojas</button></div>' +
      '<input type="search" data-q placeholder="🔍 Procurar pelo nome, email ou código" autocomplete="off"><p class="msg" data-m></p></div>' +
      '<div class="bx" data-c><div class="vz">A carregar…</div></div>';
    var C = el.querySelector("[data-c]"), M = el.querySelector("[data-m]"), Q = el.querySelector("[data-q]");
    function msg(t, bom) { M.className = "msg" + (bom ? " ok" : ""); M.textContent = t || ""; }
    async function carregar() {
      var r = await sb.rpc("contas_equipa_lista", { p_texto: "" });
      if (r.error) { C.innerHTML = '<p class="msg">' + esc(erroTxt(r.error)) + "</p>"; return; }
      E.L = Array.isArray(r.data) ? r.data : []; pintar();
    }
    function bate(u, q) {
      if (!q) return true;
      var c = q.replace(/[\s#-]/g, "");
      return low(u.nome).indexOf(q) > -1 || low(u.email).indexOf(q) > -1 || low(u.loja).indexOf(q) > -1 ||
        (c && (low(u.codigo).indexOf(c) === 0 || low(u.loja_codigo).indexOf(c) === 0 || low(String(u.id).replace(/-/g, "")).indexOf(c) === 0));
    }
    function pintar() {
      var q = low(E.q).trim();
      var cli = E.L.filter(function (u) { return !u.loja; }), lj = E.L.filter(function (u) { return !!u.loja; });
      el.querySelector('[data-l="clientes"]').textContent = "🛍️ Clientes (" + cli.length + ")";
      el.querySelector('[data-l="lojas"]').textContent = "🏪 Lojas (" + lj.length + ")";
      el.querySelectorAll("[data-l]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-l") === E.lado); });
      var L = (E.lado === "clientes" ? cli : lj).filter(function (u) { return bate(u, q); });
      if (!L.length) { C.innerHTML = '<div class="vz">' + (q ? "Nada encontrado." : E.lado === "clientes" ? "Nenhum cliente." : "Nenhuma loja.") + "</div>"; return; }
      C.innerHTML = L.map(function (u) {
        var nome = E.lado === "lojas" ? u.loja : (u.nome || u.email);
        var sub = E.lado === "lojas"
          ? "Código da loja <span class=\"cd\">" + esc(u.loja_codigo) + "</span> · " + esc(EST[u.loja_estado] || u.loja_estado || "") + "<br>Dono: " + esc(u.nome ? u.nome + " · " : "") + esc(u.email) + " · código <span class=\"cd\">" + esc(u.codigo) + "</span>"
          : (u.nome ? esc(u.email) + " · " : "") + "Código <span class=\"cd\">" + esc(u.codigo) + "</span>";
        var bts = u.permanente
          ? '<button type="button" class="n" data-a="remover" data-u="' + esc(u.id) + '">🗑️ Remover</button>'
          : (u.bloqueada ? '<button type="button" class="v" data-a="desbloquear" data-u="' + esc(u.id) + '">Desbloquear</button>' : '<button type="button" data-a="bloquear" data-u="' + esc(u.id) + '">Bloquear</button>') +
            '<button type="button" class="r" data-a="sempre" data-u="' + esc(u.id) + '">⛔ Bloquear para sempre</button>';
        return '<div class="it"><b>' + esc(nome) + "</b><small>" + sub + "</small><small>Criada " + dt(u.criada) + " · última entrada " + dt(u.ultima) + "</small>" +
          (u.permanente ? '<span class="es">⛔ Bloqueada para sempre</span>' : u.bloqueada ? '<span class="es">Bloqueada</span>' : "") +
          '<div class="bs">' + bts + "</div></div>";
      }).join("");
    }
    el.addEventListener("click", async function (ev) {
      var t = ev.target.closest && ev.target.closest("[data-l],[data-a]"); if (!t || !el.contains(t)) return;
      if (t.hasAttribute("data-l")) { E.lado = t.getAttribute("data-l"); msg(""); pintar(); return; }
      var a = t.getAttribute("data-a"), id = t.getAttribute("data-u"), u = E.L.filter(function (x) { return String(x.id) === id; })[0] || {};
      var quem = (u.loja ? "a loja " + u.loja : (u.nome || u.email));
      var txt = { bloquear: "Bloquear " + quem + "?\nDeixa de poder entrar (pode desbloquear depois).", desbloquear: "Desbloquear " + quem + "?",
        sempre: "Bloquear " + quem + " PARA SEMPRE?\nNão poderá entrar nem criar outra conta com este email." + (u.loja ? " A loja fica suspensa." : "") + " Não dá para desfazer.",
        remover: "Remover " + quem + "?\nDesaparece da lista" + (u.loja ? " e a loja fecha" : "") + ". O email continua proibido na BBabilônia." }[a];
      if (!confirm(txt)) return;
      t.disabled = true; msg("");
      var r = a === "bloquear" || a === "desbloquear" ? await sb.rpc("contas_equipa_bloquear", { p_user: id, p_bloquear: a === "bloquear" })
        : a === "sempre" ? await sb.rpc("contas_equipa_bloquear_sempre", { p_user: id }) : await sb.rpc("contas_equipa_remover", { p_user: id });
      if (r.error) { t.disabled = false; msg(erroTxt(r.error)); return; }
      msg({ bloquear: "Bloqueada ✓", desbloquear: "Desbloqueada ✓", sempre: "Bloqueada para sempre ✓", remover: "Removida ✓" }[a], true);
      carregar();
    });
    var tm; Q.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(function () { E.q = Q.value; pintar(); }, 150); });
    carregar();
  }
  window.BBContas = { montar: montar };
})();

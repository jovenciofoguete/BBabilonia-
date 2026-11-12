/* admin-extra-v2.js — B-Babilônia (12/11/2026): novidades do painel do dono
   1) "Gerir agentes" abre admin-agentes.html: duas equipas separadas (🎧 Atendimento | 🛡️ Busca e verificação), por email.
   2) Cartão "🛡️ Verificação de produtos" (verificações e endereço/telemóvel das lojas).
   4) Ao abrir o painel: bloqueia quem tem o BI expirado há mais de 7 dias (rever_validades).
   3) "Clientes e fornecedores" separados em dois lados (🛍️ Clientes | 🏪 Fornecedores),
      com Bloquear, ⛔ Bloquear para sempre e 🗑️ Eliminar (quem foi bloqueado para sempre desaparece da lista).
   Não altera painel-admin.html nem painel-admin-extras.js. */
(function () {
  if (window.__bbAdmV2) return; window.__bbAdmV2 = 1;
  var ADMIN = "jovenciofoguete1904@gmail.com";
  var $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function dt(d) { try { return d ? new Date(d).toLocaleDateString("pt-PT") : "—"; } catch (e) { return "—"; } }
  function erroSql(e) { var t = String(e && e.message || e); return /function|find|relation|exist/i.test(t) ? "Falta correr o SQL novo no Supabase." : t; }

  var tent = 0;
  (function arrancar() {
    if (typeof window.sb === "undefined" || !$("t-inicio") || !$("t-extra")) { if (++tent < 120) setTimeout(arrancar, 150); return; }
    cartoes();
    /* bloqueia contas com o bilhete de identidade expirado há mais de 7 dias */
    try { sb.rpc("rever_validades").then(function () {}, function () {}); } catch (e) {}
  })();

  /* ---------- cartões ---------- */
  function cartoes() {
    var a = document.querySelector('#t-inicio a[href="agentes.html"]');
    if (a && !$("bb-card-verif")) {
      a.setAttribute("href", "admin-agentes.html");
      var b = a.querySelector("b"), s = a.querySelectorAll("span")[1];
      if (b) b.textContent = "Agentes";
      if (s) s.textContent = "Atendimento e busca/verificação: adicionar e remover por email";
      a.insertAdjacentHTML("afterend", '<a id="bb-card-verif" class="c k4" href="confirmar-produto.html"><span class="i">🛡️</span><b>Verificação de produtos</b><span>Verificações dos agentes e endereço/telemóvel das lojas</span></a>');
    }
  }

  /* ---------- Clientes | Fornecedores ---------- */
  var estado = { lado: "clientes", texto: "", L: [], E: {} };
  function abrir() {
    var ex = $("t-extra"); if (!ex) return false;
    ["t-inicio", "t-produtos", "t-pedidos"].forEach(function (x) { var e = $(x); if (e) e.classList.add("hide"); });
    document.querySelectorAll("#tabs button").forEach(function (b) { b.classList.remove("on"); });
    ex.innerHTML = '<button class="voltar" data-x="voltar">← Voltar ao início</button>' +
      '<div class="box"><b>👥 Clientes e fornecedores</b>' +
      '<div class="f" style="margin:10px 0 0"><button id="cf-cli" type="button">🛍️ Clientes</button><button id="cf-for" type="button">🏪 Fornecedores</button></div>' +
      '<input id="cf-q" placeholder="🔍 Procurar por email ou nome da loja" style="margin-top:10px" value="' + esc(estado.texto) + '">' +
      '<div class="msg" id="cf-m"></div></div>' +
      '<div class="box" id="cf-c"><div class="vz">A carregar…</div></div>';
    ex.classList.remove("hide"); window.scrollTo(0, 0);
    $("cf-cli").onclick = function () { estado.lado = "clientes"; pintar(); };
    $("cf-for").onclick = function () { estado.lado = "fornecedores"; pintar(); };
    var tm; $("cf-q").oninput = function () { clearTimeout(tm); var v = this.value; tm = setTimeout(function () { estado.texto = v; carregar(); }, 400); };
    carregar();
    return true;
  }
  async function carregar() {
    var r = await Promise.all([sb.rpc("admin_utilizadores", { p_texto: estado.texto || "" }), sb.rpc("admin_contas_estado")]);
    if (r[0].error) { $("cf-c").innerHTML = '<div class="msg e">' + esc(erroSql(r[0].error)) + "</div>"; return; }
    estado.E = {};
    if (r[1].error) cmsg("Bloquear para sempre e Eliminar: " + erroSql(r[1].error), true);
    (r[1].data || []).forEach(function (x) { estado.E[String(x.user_id)] = x; });
    estado.L = (r[0].data || []).filter(function (u) { var e = estado.E[String(u.id)]; return !(e && e.oculta); });
    pintar();
  }
  function cmsg(t, erro) { var m = $("cf-m"); if (m) { m.className = "msg" + (erro ? " e" : ""); m.textContent = t || ""; } }
  function pintar() {
    var c = $("cf-c"); if (!c) return;
    var cli = estado.L.filter(function (u) { return !u.loja; }), forn = estado.L.filter(function (u) { return !!u.loja; });
    $("cf-cli").textContent = "🛍️ Clientes (" + cli.length + ")"; $("cf-for").textContent = "🏪 Fornecedores (" + forn.length + ")";
    $("cf-cli").classList.toggle("on", estado.lado === "clientes"); $("cf-for").classList.toggle("on", estado.lado === "fornecedores");
    var L = estado.lado === "clientes" ? cli : forn;
    c.innerHTML = (L.length ? L.map(function (u) {
      var e = estado.E[String(u.id)] || {}, sempre = !!e.permanente, adm = String(u.email || "").toLowerCase() === ADMIN;
      var info = u.loja ? "🏪 " + esc(u.loja) + " (" + esc(u.loja_estado || "") + ") · " : "🛍️ Cliente · ";
      var bts = adm ? "" : sempre
        ? '<button class="bt r" data-cel="' + esc(u.id) + '">🗑️ Eliminar</button>'
        : (u.bloqueada ? '<button class="bt v" data-cbl="' + esc(u.id) + '" data-on="0">Desbloquear</button>' : '<button class="bt l" data-cbl="' + esc(u.id) + '" data-on="1">Bloquear</button>') +
          '<button class="bt r" data-csp="' + esc(u.id) + '">⛔ Para sempre</button>';
      return '<div class="xl"><div class="t"><b>' + esc(u.email) + "</b><small>" + info + "criada " + dt(u.created_at) + " · última entrada " + dt(u.last_sign_in_at) + "</small>" +
        (sempre ? '<span class="est r">⛔ Bloqueada para sempre</span>' : u.bloqueada ? '<span class="est r">Bloqueada</span>' : "") + "</div>" +
        '<div style="display:flex;flex-direction:column;gap:6px;flex:none">' + bts + "</div></div>";
    }).join("") : '<div class="vz">' + (estado.lado === "clientes" ? "Nenhum cliente." : "Nenhum fornecedor.") + "</div>");
  }

  document.addEventListener("click", async function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
    var x = t.closest('[data-x="contas"]');
    if (x) { ev.preventDefault(); ev.stopImmediatePropagation(); abrir(); return; }
    var bl = t.closest("[data-cbl]"), sp = t.closest("[data-csp]"), el = t.closest("[data-cel]");
    if (!bl && !sp && !el) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    var b = bl || sp || el, id = b.getAttribute(bl ? "data-cbl" : sp ? "data-csp" : "data-cel");
    var u = estado.L.filter(function (z) { return String(z.id) === id; })[0] || {};
    var r;
    if (bl) {
      var on = bl.getAttribute("data-on") === "1";
      if (!confirm(on ? "Bloquear " + u.email + "?\nA pessoa deixa de poder entrar (pode desbloquear depois)." : "Desbloquear " + u.email + "?")) return;
      b.disabled = true; r = await sb.rpc("admin_bloquear", { p_user: id, p_bloquear: on });
    } else if (sp) {
      if (!confirm("Bloquear " + u.email + " PARA SEMPRE?\nNão poderá entrar nem criar outra conta com este email. Não dá para desfazer.")) return;
      b.disabled = true; r = await sb.rpc("admin_bloquear_sempre", { p_user: id });
    } else {
      if (!confirm("Eliminar " + u.email + "?\nDesaparece da lista. O email continua proibido na BBabilônia.")) return;
      b.disabled = true; r = await sb.rpc("admin_eliminar_conta", { p_user: id });
    }
    if (r.error) { b.disabled = false; cmsg(erroSql(r.error), true); return; }
    cmsg(bl ? "Feito ✓" : sp ? u.email + " bloqueado para sempre ✓" : u.email + " eliminado ✓");
    carregar();
  }, true);
})();

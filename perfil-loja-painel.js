/* perfil-loja-painel.js — BBabilônia (26/11/2026) · painel do vendedor (suppliers.bbabilonia.com)
   - Ecrã branco e painéis com contorno laranja.
   - Criar conta: email, país, palavra-passe e repetir a palavra-passe (depois vem a verificação em 2 passos).
   - Sem perfil: todos os painéis ficam trancados 🔒 e aparece "A sua loja ainda não está ativa" com ✍️ Completar perfil.
   - Loja recusada: aparece o motivo e o botão para corrigir.
   - Painel 📁 Os meus documentos e avisos da validade do documento de identificação.
   Os links antigos "loja-criar.html" passam a abrir o perfil novo (perfil-loja.html).
   Link geral (raiz) sem sessão → página de apresentação (gongyingshang.html); ?criar=1 abre o criar conta. */
(function () {
  if (window.__bbPerfilPainel) return; window.__bbPerfilPainel = 1;
  var d = document, SB = "https://dsfoqoeawvjafypycldz.supabase.co", K = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0", CH = "sb-dsfoqoeawvjafypycldz-auth-token";
  var L = "#f97316";
  var PAISES = [["MZ", "🇲🇿 Moçambique"], ["TZ", "🇹🇿 Tanzânia"], ["ZA", "🇿🇦 África do Sul"], ["AO", "🇦🇴 Angola"], ["MW", "🇲🇼 Malawi"], ["ZW", "🇿🇼 Zimbabué"], ["ZM", "🇿🇲 Zâmbia"], ["KE", "🇰🇪 Quénia"], ["CN", "🇨🇳 China"], ["BR", "🇧🇷 Brasil"], ["PT", "🇵🇹 Portugal"], ["AE", "🇦🇪 Emirados Árabes"], ["IN", "🇮🇳 Índia"], ["TR", "🇹🇷 Turquia"], ["US", "🇺🇸 Estados Unidos"]];
  function $(i) { return d.getElementById(i); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sessao() { try { var s = JSON.parse(localStorage.getItem(CH) || "null"); if (s && s.currentSession) s = s.currentSession; return s && s.access_token ? s : null; } catch (e) { return null; } }

  /* ---------- aspeto: branco e laranja ---------- */
  var css = d.createElement("style"); css.id = "bbpp-css";
  css.textContent =
    "body{background:#fff!important;color:#0f172a!important}" +
    ".top{background:#fff!important;color:#0f172a!important;border-radius:0!important;border-bottom:2px solid " + L + ";padding:16px 16px 18px!important}" +
    ".top .lg{color:#c2410c!important}.top p{color:#475569!important}.top h1{color:#0f172a}" +
    ".top .sair{background:#fff!important;color:#c2410c!important;border:2px solid " + L + "!important}" +
    ".conteudo{margin-top:14px!important}" +
    "a.c{background:#fff!important;color:#0f172a!important;border:2.5px solid " + L + ";box-shadow:none!important}" +
    "a.c span{color:#475569}a.c b{color:#0f172a}" +
    "a.c.bloq{filter:none!important;opacity:1!important;background:#f8fafc!important;border-color:#cbd5e1!important;color:#94a3b8!important}" +
    "a.c.bloq b,a.c.bloq span{color:#94a3b8!important}a.c.bloq .i{filter:grayscale(1);opacity:.6}" +
    ".cx{box-shadow:none!important;border:2px solid #fed7aa}" +
    ".voltar{background:#fff!important;color:#c2410c!important;border:2px solid " + L + ";box-shadow:none!important}" +
    ".sec{color:#9a3412!important}" +
    "#bbpp-av{border:2.5px solid #dc2626;border-radius:18px;padding:14px;margin:0 0 14px;background:#fef2f2;color:#7f1d1d;font-size:14px;line-height:1.4}" +
    "#bbpp-av b{display:block;color:#991b1b;font-size:16px;margin-bottom:4px}" +
    "#bbpp-av.am{border-color:#f59e0b;background:#fffbeb;color:#78350f}#bbpp-av.am b{color:#92400e}" +
    "#bbpp-av a{display:block;text-align:center;background:" + L + ";color:#fff!important;border-radius:14px;padding:13px;font-weight:800;margin-top:12px;text-decoration:none}" +
    ".bbpp-x{display:none}.bbpp-criar .bbpp-x{display:block}" +
    "#bbpp-ja{display:none;text-align:center;margin-top:10px;font-size:14px;color:#c2410c;font-weight:700;cursor:pointer}.bbpp-criar #bbpp-ja{display:block}" +
    ".bbpp-criar #bEntrar{display:none!important}";
  (d.head || d.documentElement).appendChild(css);

  /* ---------- criar conta: país e repetir palavra-passe ---------- */
  var criar = false;
  function prepararEntrar() {
    var sec = $("v-entrar"), pw = $("pw"); if (!sec || !pw || $("bbpp-pais")) return;
    var w = d.createElement("div"); w.className = "bbpp-x";
    w.innerHTML = '<label class="lb" for="bbpp-pw2">Repetir palavra-passe</label><input class="cp" id="bbpp-pw2" type="password" autocomplete="new-password">' +
      '<label class="lb" for="bbpp-pais">País</label><select class="cp" id="bbpp-pais"><option value="">Escolha o país ▾</option>' + PAISES.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + "</option>"; }).join("") + "</select>";
    pw.parentNode.insertBefore(w, pw.nextSibling);
    var ja = d.createElement("div"); ja.id = "bbpp-ja"; ja.textContent = "Já tenho conta · Entrar";
    var m = $("entMsg"); if (m) m.parentNode.insertBefore(ja, m.nextSibling);
    ja.onclick = function () { modo(false); };
  }
  function modo(c) {
    criar = c; var sec = $("v-entrar"); if (!sec) return;
    sec.classList.toggle("bbpp-criar", c);
    var h = sec.querySelector("h2"); if (h) h.textContent = c ? "Criar conta de vendedor" : "Entrar na conta de vendedor";
    var m = $("entMsg"); if (m) { m.className = "msg"; m.textContent = ""; }
  }
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#bCriar"); if (!b) return;
    prepararEntrar();
    var m = $("entMsg");
    if (!criar) { e.preventDefault(); e.stopImmediatePropagation(); modo(true); var p2 = $("bbpp-pw2"); if (p2) p2.focus(); return; }
    var erro = "";
    if (!$("bbpp-pais").value) erro = "Escolha o seu país.";
    else if ($("pw").value !== $("bbpp-pw2").value) erro = "As duas palavras-passe não são iguais.";
    if (erro) { e.preventDefault(); e.stopImmediatePropagation(); if (m) { m.className = "msg"; m.textContent = erro; } }
  }, true);
  /* o país vai junto com a conta (fica guardado para o perfil da loja) */
  var of = window.fetch;
  window.fetch = function (url, opc) {
    try {
      var u = typeof url === "string" ? url : (url && url.url) || "";
      if (u.indexOf(SB + "/auth/v1/signup") === 0 && opc && typeof opc.body === "string" && $("bbpp-pais") && $("bbpp-pais").value) {
        var b = JSON.parse(opc.body); b.data = Object.assign({}, b.data || {}, { pais: $("bbpp-pais").value });
        opc = Object.assign({}, opc, { body: JSON.stringify(b) });
      }
    } catch (e) {}
    return of.call(this, url, opc);
  };

  /* ---------- os links antigos de criar loja abrem o perfil novo ---------- */
  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href*="loja-criar.html"]'); if (!a) return;
    e.preventDefault(); e.stopImmediatePropagation(); location.href = "perfil-loja.html";
  }, true);

  /* ---------- estado do perfil: aviso no topo e painel dos documentos ---------- */
  var P = null, aCarregar = false, ultimoTok = "";
  function rpc(nome, corpo, tok) {
    return of.call(window, SB + "/rest/v1/rpc/" + nome, { method: "POST", headers: { apikey: K, Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: JSON.stringify(corpo || {}) })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function carregar() {
    var s = sessao(); if (!s) { P = null; ultimoTok = ""; pintar(); return; }
    if (aCarregar || s.access_token === ultimoTok) return;
    aCarregar = true; ultimoTok = s.access_token;
    rpc("lojas_validade_avisar", {}, s.access_token);
    rpc("loja_meu_perfil", {}, s.access_token).then(function (r) { P = r || { erro: 1 }; aCarregar = false; pintar(); });
  }
  function aviso() {
    if (!P || P.erro) return "";
    var l = P.loja, it = P.identidade;
    if (!l) return '<div id="bbpp-av"><b>⚠️ A sua loja ainda não está ativa</b>Complete o perfil da loja para desbloquear todos os painéis e começar a vender.<a href="perfil-loja.html">✍️ Completar perfil</a></div>';
    if (l.estado === "rejeitada") return '<div id="bbpp-av"><b>❌ A sua loja foi recusada</b>Motivo: ' + esc(l.verificacao_motivo || l.motivo || "—") + '<br>Corrija e envie de novo para a equipa BBabilônia verificar.<a href="perfil-loja.html">✍️ Corrigir perfil</a></div>';
    if (it && it.dias != null && it.dias < 0) return '<div id="bbpp-av"><b>⛔ O seu documento de identificação expirou</b>Atualize o documento para a loja não ser bloqueada.<a href="meus-documentos.html">📁 Atualizar documento</a></div>';
    if (it && it.dias != null && it.dias <= 30) return '<div id="bbpp-av" class="am"><b>🪪 O seu documento de identificação expira em ' + it.dias + ' dia(s)</b>Atualize antes de expirar.<a href="meus-documentos.html">📁 Atualizar documento</a></div>';
    return "";
  }
  function pintar() {
    var ini = $("v-inicio"), main = d.querySelector("main.conteudo");
    var h = sessao() && ini && !ini.classList.contains("hide") ? aviso() : "";
    var a = $("bbpp-av");
    if (!h) { if (a) a.remove(); }
    else if (!a || a.outerHTML !== h) { if (a) a.remove(); var t = d.createElement("div"); t.innerHTML = h; main.insertBefore(t.firstChild, main.firstChild); }
    /* painel 📁 Os meus documentos (com a loja criada) */
    var g = ini && ini.querySelector(".grid");
    if (g && P && P.loja && !$("bbpp-docs")) {
      var c = d.createElement("a"); c.id = "bbpp-docs"; c.className = "c c6"; c.href = "meus-documentos.html";
      c.innerHTML = '<span class="i">📁</span><b>Os meus documentos</b><span>Documento de identificação, licença, fotos e vídeo da loja</span>';
      var it = P.identidade; if (it && it.dias != null && it.dias <= 30) c.innerHTML += '<span class="nb">' + (it.dias < 0 ? "!" : "⏳") + "</span>";
      g.appendChild(c);
    }
  }
  var n = 0, t = null;
  (function arrancar() {
    if (!d.body || !$("v-entrar")) { if (++n < 200) setTimeout(arrancar, 100); return; }
    prepararEntrar();
    /* (26/11/2026) link geral suppliers.bbabilonia.com: quem ainda não entrou vê a página de apresentação;
       "Abrir loja grátis" (…?criar=1) abre logo o criar conta */
    if (!sessao()) {
      if (location.pathname === "/" && !/[#&?](access_token|error)=/.test(location.href)) { location.replace("/gongyingshang.html"); return; }
      if (/[?&]criar=1/.test(location.search)) modo(true);
    } else if (/[?&]criar=1/.test(location.search)) { try { history.replaceState(null, "", location.pathname); } catch (e) {} }
    carregar();
    setInterval(carregar, 4000);
    new MutationObserver(function (ms) {
      if (ms.every(function (m) { var a = $("bbpp-av"), c = $("bbpp-docs"); return (a && (a === m.target || a.contains(m.target))) || (c && (c === m.target || c.contains(m.target))); })) return;
      clearTimeout(t); t = setTimeout(function () { prepararEntrar(); pintar(); }, 80);
    }).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  })();
})();

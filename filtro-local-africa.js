/* filtro-local-africa.js — BBabilônia (14/11/2026)
   Chat cliente ↔ fornecedor: se a loja do fornecedor está num país africano, não deixa enviar
   localização, endereço da loja, ruas, pontos de referência nem combinar encontros (vale para o cliente e para o fornecedor).
   Fornecedor fora de África (ex.: China): passa. O servidor também bloqueia (PARTE 9 do SQL).
   Não mexe no filtro de contactos que já existe: só acrescenta esta regra. */
(function () {
  if (window.__bbLocalAfrica) return; window.__bbLocalAfrica = 1;
  var U = "https://dsfoqoeawvjafypycldz.supabase.co", K = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0", SK = "sb-dsfoqoeawvjafypycldz-auth-token";
  var MSG = "Com fornecedores em África não pode partilhar localização, endereço, ruas, pontos de referência nem combinar encontros na loja. A BBabilônia trata da busca e do envio.";
  /* português, inglês, francês, espanhol, suaíli e zulu (texto já sem acentos) — as mesmas regras do servidor */
  var RE = new RegExp("(\\blocali[zs]|\\b(ir|passar|visitar|aparecer|vir)\\s+(la\\s+|ai\\s+|aqui\\s+)?((na|a|ate|ao|pela|por|para\\s+a)\\s+)?(sua\\s+|vossa\\s+|nossa\\s+|minha\\s+)?(lo[jg]\\w*|armazem|empresa)\\b|\\b(ir|passar)\\s+(la|ai)\\b|\\bendereco\\s+(d[ao]s?|da\\s+sua|da\\s+vossa)\\s+(loja|armazem|empresa)|\\bendereco\\s+fisico|\\b(rua|avenida)\\b|\\bao\\s+lado\\s+d[aoe]s?\\b|\\bem\\s+frente\\s+(de|do|da|dos|das|ao|a)\\b|\\b(proximo|proxima|perto)\\s+(do|da|dos|das)\\b|\\batras\\s+(do|da|dos|das)\\b|\\bpessoalmente\\b|\\blocation\\b|\\blocated\\b|\\baddress\\s+of\\b|\\b(your|the|shop|store|physical)\\s+address\\b|\\bstreet\\b|\\bnext\\s+to\\b|\\bin\\s+front\\s+of\\b|\\bopposite\\s+(the|to)\\b|\\bnear\\s+(the|to)\\b|\\bbehind\\s+the\\b|\\bin\\s+person\\b|\\bface\\s+to\\s+face\\b|\\b(come|go|visit|pass)\\s+(to\\s+|by\\s+)?(your|the|my|our)\\s+(shop|store|warehouse)\\b|\\bwhere\\s+is\\s+(your|the)\\s+(shop|store|warehouse)\\b|\\badresse\\s+(de|du|d)\\b|\\bvotre\\s+adresse\\b|\\brue\\b|\\ba\\s+cote\\s+d|\\ben\\s+face\\s+d|\\bpres\\s+d(e|u|es)\\b|\\bderriere\\s+(le|la|les)\\b|\\ben\\s+personne\\b|\\bcalle\\b|\\bubicacion\\b|\\bdireccion\\s+de\\b|\\bal\\s+lado\\s+de\\b|\\bfrente\\s+a\\b|\\bdetras\\s+de\\b|\\ben\\s+persona\\b|\\bmtaa\\b|\\bkaribu\\s+na\\b|\\bmbele\\s+ya\\b|\\bnyuma\\s+ya\\b|\\bkando\\s+ya\\b|\\banwani\\b|\\bmahali\\b|\\bliko\\s+wapi\\b|\\buko\\s+wapi\\b|\\bana\\s+kwa\\s+ana\\b|\\bumgwaqo\\b|\\beduze\\s+kwa\\b|\\bphambi\\s+kwa\\b|\\bngemuva\\s+kwa\\b|\\bikheli\\b)", "g");
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function mau(t) { RE.lastIndex = 0; return RE.test(norm(t)); }
  function partes(t) {
    var orig = String(t || ""), n = norm(orig), out = [], m; RE.lastIndex = 0;
    while ((m = RE.exec(n))) { out.push(orig.substr(m.index, m[0].length)); if (!m[0].length) RE.lastIndex++; }
    return out;
  }
  window.BBFiltroLocal = { mau: mau, partes: partes, ativo: function () { return ATIVO; } };

  /* esta conversa é com um fornecedor de África? (pergunta ao servidor) */
  var ATIVO = false, CONV = null;
  function token() { try { var s = JSON.parse(localStorage.getItem(SK) || "null"); if (s && s.currentSession) s = s.currentSession; return s && s.access_token; } catch (e) { return null; } }
  function convAtual() { try { return window.conv && window.conv.id ? String(window.conv.id) : null; } catch (e) { return null; } }
  async function rever() {
    var c = convAtual();
    if (c === CONV) return; CONV = c; ATIVO = false;
    if (!c) return;
    try {
      var r = await fetch(U + "/rest/v1/rpc/bb_conversa_africa", { method: "POST", headers: { apikey: K, Authorization: "Bearer " + (token() || K), "Content-Type": "application/json" }, body: JSON.stringify({ p_conversa: c }) });
      var j = await r.json();
      if (CONV === c) ATIVO = j === true;
    } catch (e) {}
    verificar();
  }

  var SEL = 'input[placeholder^="Escreva"],textarea[placeholder^="Escreva"],input[placeholder*="ensagem"],textarea[placeholder*="ensagem"]';
  function campo() { return document.querySelector(SEL); }
  function eEnviar(el) { var b = el && el.closest ? el.closest("button,[role=button],input[type=submit],input[type=button]") : null; return !!b && (b.value || b.textContent || "").trim() === "Enviar"; }
  function botao() { var b = document.querySelectorAll("button,[role=button],input[type=submit],input[type=button]"); for (var i = 0; i < b.length; i++) if (eEnviar(b[i])) return b[i]; return null; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var aviso = null, tAviso = null, desativei = false, eraMau = false, ultimo = null;
  function bloqueado() { var i = campo(); return ATIVO && !!i && mau(i.value); }
  function mostrar() {
    var inp = campo(); if (!inp) return;
    if (!aviso || !aviso.isConnected) {
      aviso = document.createElement("div"); aviso.setAttribute("role", "alert"); aviso.id = "bb-aviso-local";
      aviso.style.cssText = "display:none;position:fixed;left:8px;right:8px;z-index:99999;background:#fff;color:#b91c1c;font-size:14px;line-height:1.5;padding:8px 10px;border-radius:10px;border:2px solid #fca5a5;box-shadow:0 4px 14px #0003;font-family:inherit";
      document.body.appendChild(aviso);
    }
    var p = partes(inp.value);
    aviso.innerHTML = "📍 <b>" + esc(MSG) + "</b> " + (p.length ? "Apague o que está a vermelho: " + p.map(function (w) { return '<mark style="background:#fee2e2;color:#7f1d1d;border:1px solid #f87171;border-radius:5px;padding:0 4px;font-weight:800">' + esc(w) + "</mark>"; }).join(" ") : "");
    aviso.style.bottom = (window.innerHeight - inp.getBoundingClientRect().top + 6) + "px";
    aviso.style.display = "block";
    clearTimeout(tAviso); tAviso = setTimeout(function () { if (aviso) aviso.style.display = "none"; }, 6000);
  }
  function verificar() {
    var inp = campo(), m = bloqueado(), btn = botao();
    if (inp) {
      if (m) { inp.style.outline = "2px solid #dc2626"; inp.style.background = "#fff5f5"; inp.setAttribute("data-bb-local", "1"); }
      else if (inp.getAttribute("data-bb-local")) { inp.style.outline = ""; inp.style.background = ""; inp.removeAttribute("data-bb-local"); }
    }
    if (m && (!eraMau || (inp && inp.value !== ultimo))) mostrar();
    if (!m && aviso) aviso.style.display = "none";
    ultimo = inp ? inp.value : null; eraMau = m;
    if (btn) { if (m) { btn.disabled = true; desativei = true; } else if (desativei) { btn.disabled = false; desativei = false; } }
  }
  function parar(e) { e.preventDefault(); e.stopImmediatePropagation(); mostrar(); }
  document.addEventListener("click", function (e) { if (eEnviar(e.target) && bloqueado()) parar(e); }, true);
  document.addEventListener("pointerdown", function (e) { if (eEnviar(e.target) && bloqueado()) mostrar(); }, true);
  ["keydown", "keypress", "keyup"].forEach(function (ev) { document.addEventListener(ev, function (e) { if ((e.key === "Enter" || e.keyCode === 13) && e.target === campo() && bloqueado()) parar(e); }, true); });
  document.addEventListener("submit", function (e) { if (bloqueado()) parar(e); }, true);
  document.addEventListener("input", function () { verificar(); setTimeout(verificar, 0); }, true);

  /* 💳 link de pagamento: a descrição também não pode ter localização (antes de criar o link) */
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("#lp-ok"); if (!b || !ATIVO) return;
    var d = document.getElementById("lp-d"), x = document.getElementById("lp-x");
    if (d && mau(d.value)) { e.preventDefault(); e.stopImmediatePropagation(); if (x) x.textContent = MSG; }
  }, true);

  /* mensagens enviadas pelos botões prontos (perguntas, personalização…) e texto noutras línguas:
     verifica o texto e a tradução para português antes de enviar */
  function traduzPt(t) {
    return fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=" + encodeURIComponent(t))
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { return (j[0] || []).map(function (x) { return x[0] || ""; }).join(""); })
      .catch(function () { return ""; });
  }
  function embrulhar() {
    if (typeof window.mandar !== "function" || window.mandar.__bbLocal) return;
    var orig = window.mandar;
    var novo = async function (msg) {
      if (ATIVO && msg && msg.texto && (msg.tipo || "texto") !== "endereco") {
        if (mau(msg.texto)) throw new Error(MSG);
        if (/[^\x00-\x7f]|[a-z]{3}/i.test(msg.texto)) { var tr = await traduzPt(msg.texto); if (tr && tr !== msg.texto && mau(tr)) throw new Error(MSG); }
      }
      return orig.apply(this, arguments);
    };
    novo.__bbLocal = 1; window.mandar = novo;
  }
  setInterval(embrulhar, 500); embrulhar();
  setInterval(function () { rever(); verificar(); }, 400);
  rever();
})();

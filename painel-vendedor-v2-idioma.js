/* painel-vendedor-v2-idioma.js — B-Babilônia: painel do vendedor no idioma do fornecedor (chinês, árabe, inglês…).
   - botão 🌐 no topo para escolher o idioma (guardado em bb_prefs, como na loja e no chat);
   - traduz os textos do painel pelo servidor da BBabilônia (api/traduzir), por isso funciona também na China;
   - as traduções ficam guardadas no telemóvel: da segunda vez aparece logo traduzido.
   Português = painel original. Não altera os outros ficheiros. */
(function () {
  if (window.__bbPainelIdioma) return; window.__bbPainelIdioma = 1;
  var IDIOMAS = [
    ['pt','Português'],['en','English'],['zh','中文'],['ar','العربية'],['fr','Français'],['es','Español'],
    ['hi','हिन्दी'],['ru','Русский'],['tr','Türkçe'],['vi','Tiếng Việt'],['id','Bahasa Indonesia'],['th','ไทย'],
    ['bn','বাংলা'],['ur','اردو'],['fa','فارسی'],['de','Deutsch'],['it','Italiano'],['ja','日本語'],['ko','한국어'],
    ['sw','Kiswahili'],['am','አማርኛ'],['ha','Hausa'],['yo','Yorùbá'],['zu','isiZulu'],['so','Soomaali'],['ms','Bahasa Melayu'],
    ['fil','Filipino'],['pl','Polski'],['nl','Nederlands'],['uk','Українська'],['ro','Română'],['he','עברית'],['el','Ελληνικά']
  ];
  var NOMES = {}; IDIOMAS.forEach(function (x) { NOMES[x[0]] = x[1]; });

  function prefs() { try { return JSON.parse(localStorage.getItem("bb_prefs") || "{}") || {}; } catch (e) { return {}; } }
  function idioma() {
    var l = String(prefs().idioma || navigator.language || "pt").split("-")[0].toLowerCase();
    return NOMES[l] ? l : (l === "iw" ? "he" : "en");
  }
  var L = idioma();
  try { document.documentElement.lang = L; } catch (e) {}

  var css = document.createElement("style");
  css.textContent = ".bb-lg{float:right;margin-left:6px;background:#ffffff26;color:#fff;border:0;border-radius:999px;padding:6px 12px;font-size:13px;font-weight:700}" +
    "#bb-lgm .cx h2{margin-bottom:8px}#bb-lgm .lst{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:60vh;overflow:auto}" +
    "#bb-lgm .lst button{border:1.5px solid #ece9f7;background:#fff;border-radius:12px;padding:11px 8px;font-size:15px;text-align:left}" +
    "#bb-lgm .lst button.on{border-color:#7c3aed;background:#f3f0ff;font-weight:800}" +
    "#bb-lgm{position:fixed;inset:0;background:#0007;z-index:70;display:flex;align-items:flex-end;justify-content:center}#bb-lgm .cx{width:100%;max-width:520px;border-radius:18px 18px 0 0;margin:0}";
  document.head.appendChild(css);

  /* ---------- botão e janela de idioma ---------- */
  function botao() {
    var top = document.querySelector(".top"); if (!top || document.getElementById("bb-lg")) return;
    var b = document.createElement("button"); b.id = "bb-lg"; b.className = "bb-lg notranslate"; b.type = "button"; b.setAttribute("translate", "no");
    b.textContent = "🌐 " + NOMES[L];
    var sair = document.getElementById("bSairTopo");
    if (sair && sair.parentNode === top) sair.insertAdjacentElement("afterend", b); else top.insertBefore(b, top.firstChild);
    b.onclick = janela;
  }
  function janela() {
    var m = document.createElement("div"); m.id = "bb-lgm"; m.className = "notranslate"; m.setAttribute("translate", "no");
    m.innerHTML = '<div class="cx"><h2>🌐 Idioma · Language · 语言</h2><div class="lst">' +
      IDIOMAS.map(function (x) { return '<button type="button" data-l="' + x[0] + '" class="' + (x[0] === L ? "on" : "") + '">' + x[1] + "</button>"; }).join("") +
      '</div><button type="button" class="bt g" id="bb-lgf" style="margin-top:10px">✕</button></div>';
    document.body.appendChild(m);
    m.onclick = function (e) {
      var t = e.target.closest ? e.target.closest("[data-l]") : null;
      if (t) { try { var p = prefs(); p.idioma = t.getAttribute("data-l"); localStorage.setItem("bb_prefs", JSON.stringify(p)); } catch (x) {} location.reload(); return; }
      if (e.target === m || e.target.id === "bb-lgf") m.remove();
    };
  }
  botao();
  new MutationObserver(botao).observe(document.body, { childList: true });
  if (L === "pt") return;

  /* ---------- tradução ---------- */
  var CH = "bb_trad_" + L, cache = {};
  try { cache = JSON.parse(localStorage.getItem(CH) || "{}") || {}; } catch (e) { cache = {}; }
  var feitas = {}; Object.keys(cache).forEach(function (k) { feitas[cache[k]] = 1; });
  var falta = {}, nFalta = 0, temp = null, aPedir = false, falhas = 0;
  var SALTA = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CODE: 1, SVG: 1 };
  var LETRA = /[A-Za-zÀ-ÿ]/;
  var NAO = ".top .lg, .loja1 b, .loja1 .ic, #bb-lg, #bb-lgm"; // marca, nome da loja e escolha de idioma ficam como estão

  function guardar() {
    try { var s = JSON.stringify(cache); if (s.length > 1500000) { cache = {}; s = "{}"; } localStorage.setItem(CH, s); } catch (e) {}
  }
  function traduzivel(t) {
    if (!t || t.length < 2 || t.length > 500 || !LETRA.test(t)) return false;
    if (/^B-?BABIL[OÔ]NIA(\.COM)?$/i.test(t)) return false;
    if (feitas[t] && !cache[t]) return false;                       // já é uma tradução
    if (/^\S+@\S+\.\S+$/.test(t) || /^https?:\/\//i.test(t)) return false;  // email, link
    if (/^[#]?[0-9A-F]{6,}$/i.test(t) && /\d/.test(t)) return false;  // números de pedido
    if (/^[\d\s.,:%+\-–—()\/#·×]*[A-Z]{3}[\d\s.,]*$/.test(t)) return false; // 1.500 MZN
    return true;
  }
  function ignorar(el) {
    for (var e = el; e && e !== document.body; e = e.parentNode) {
      if (e.nodeType !== 1) continue;
      if (SALTA[e.tagName] || e.getAttribute("translate") === "no" || (e.classList && e.classList.contains("notranslate")) || e.isContentEditable) return true;
      try { if (e.matches(NAO)) return true; } catch (x) {}
    }
    return false;
  }
  function pedir(t) { if (!falta[t]) { falta[t] = 1; nFalta++; } }
  function texto(n) {
    var v = n.nodeValue, t = v.trim();
    if (!traduzivel(t)) return;
    if (cache[t]) { if (cache[t] !== t) n.nodeValue = v.replace(t, cache[t]); }
    else pedir(t);
  }
  function atributos(el) {
    ["placeholder", "title", "aria-label"].forEach(function (a) {
      var v = el.getAttribute && el.getAttribute(a); if (!v) return; var t = v.trim();
      if (!traduzivel(t)) return;
      if (cache[t]) { if (cache[t] !== t) el.setAttribute(a, cache[t]); } else pedir(t);
    });
  }
  function percorrer(raiz) {
    if (!raiz) return;
    if (raiz.nodeType === 3) { if (raiz.parentNode && !ignorar(raiz.parentNode)) texto(raiz); return; }
    if (raiz.nodeType !== 1 || ignorar(raiz)) return;
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) { var no = false; try { no = n.matches(NAO); } catch (x) {} return no || SALTA[n.tagName] || n.getAttribute("translate") === "no" || n.classList.contains("notranslate") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP; }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    atributos(raiz); raiz.querySelectorAll("[placeholder],[title],[aria-label]").forEach(function (e) { if (!ignorar(e)) atributos(e); });
    var n; while ((n = w.nextNode())) texto(n);
    agendar();
  }
  function agendar() { if (nFalta && !aPedir && falhas < 3) { clearTimeout(temp); temp = setTimeout(enviar, 120); } }
  async function enviar() {
    var lista = Object.keys(falta).slice(0, 50), total = 0;
    lista = lista.filter(function (t) { total += t.length; return total <= 11000; });
    if (!lista.length) return;
    aPedir = true;
    try {
      var r = await fetch("/api/traduzir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ para: L, textos: lista }) });
      var j = r.ok ? await r.json() : null;
      if (!j || !Array.isArray(j.textos)) throw new Error("falhou");
      lista.forEach(function (t, i) { var s = String(j.textos[i] || t); cache[t] = s; feitas[s] = 1; delete falta[t]; nFalta--; });
      falhas = 0; guardar();
      percorrer(document.body); document.title = cache[document.title] || document.title;
    } catch (e) { falhas++; }
    aPedir = false;
    if (nFalta && falhas < 3) setTimeout(enviar, falhas ? 2000 * falhas : 50);
  }

  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === "characterData") { if (m.target.parentNode && !ignorar(m.target.parentNode)) texto(m.target); }
      else if (m.type === "attributes") { if (!ignorar(m.target)) atributos(m.target); }
      else m.addedNodes.forEach(percorrer);
    });
    agendar();
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"] });
  if (traduzivel(document.title)) { if (cache[document.title]) document.title = cache[document.title]; else pedir(document.title); }
  percorrer(document.body);
})();

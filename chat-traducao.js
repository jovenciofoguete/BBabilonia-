/* chat-traducao.js — BBabilônia
   Tradução automática no chat (como no Alibaba):
   - cada pessoa lê as mensagens recebidas no idioma que escolheu, com o original por baixo;
   - nas suas mensagens vê também como o outro as recebe;
   - botão 🌐 no topo para escolher o idioma (guardado em bb_prefs, o mesmo da janela País/Idioma/Moeda).
   É carregado pelo chat-novo.html dentro do chat.html. Não altera o chat.html. */
(function () {
  if (window.__bbChatTrad) return; window.__bbChatTrad = 1;

  var MAPA = { zh: 'zh-CN', he: 'iw', jv: 'jw', nb: 'no', fil: 'tl' };
  var IDIOMAS = [
    ['pt','Português'],['en','English'],['fr','Français'],['es','Español'],['zh','中文'],['ar','العربية'],
    ['sw','Kiswahili'],['hi','हिन्दी'],['ru','Русский'],['de','Deutsch'],['it','Italiano'],['tr','Türkçe'],
    ['ja','日本語'],['ko','한국어'],['id','Bahasa Indonesia'],['vi','Tiếng Việt'],['th','ไทย'],['bn','বাংলা'],
    ['ur','اردو'],['fa','فارسی'],['pl','Polski'],['nl','Nederlands'],['uk','Українська'],['ro','Română'],
    ['am','አማርኛ'],['ha','Hausa'],['yo','Yorùbá'],['zu','isiZulu'],['so','Soomaali'],['ms','Bahasa Melayu'],
    ['fil','Filipino'],['he','עברית'],['el','Ελληνικά']
  ];
  var cache = {};

  function prefs() { try { return JSON.parse(localStorage.getItem('bb_prefs') || '{}') || {}; } catch (e) { return {}; } }
  function meuIdioma() {
    var l = prefs().idioma || navigator.language || 'pt';
    return String(l).split('-')[0].toLowerCase();
  }
  function guardarIdioma(l) {
    try { var p = prefs(); p.idioma = l; localStorage.setItem('bb_prefs', JSON.stringify(p)); } catch (e) {}
  }
  function g(l) { return MAPA[l] || l; }
  function base(l) { return String(l || '').split('-')[0].toLowerCase().replace('iw', 'he').replace('jw', 'jv'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nome(l) { for (var i = 0; i < IDIOMAS.length; i++) if (IDIOMAS[i][0] === l) return IDIOMAS[i][1]; return l.toUpperCase(); }

  /* traduz com o Google; se falhar, usa o MyMemory */
  function traduzir(txt, para) {
    var k = para + '|' + txt;
    if (cache[k]) return cache[k];
    cache[k] = fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + g(para) + '&dt=t&q=' + encodeURIComponent(txt))
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        return { t: (j[0] || []).map(function (x) { return x[0] || ''; }).join(''), de: base(j[2]) };
      })
      .catch(function () {
        return fetch('https://api.mymemory.translated.net/get?langpair=autodetect|' + para + '&q=' + encodeURIComponent(txt.slice(0, 480)))
          .then(function (r) { return r.json(); })
          .then(function (j) {
            var d = j && j.responseData;
            return { t: (d && d.translatedText) || txt, de: base(d && d.detectedLanguage) };
          });
      })
      .catch(function () { delete cache[k]; return null; });
    return cache[k];
  }

  /* guarda o idioma de quem envia em cada mensagem (sem mexer no chat.html) */
  if (typeof window.mandar === 'function') {
    var original = window.mandar;
    window.mandar = function (msg) {
      var com = Object.assign({}, msg, { idioma: meuIdioma() });
      return original(com).catch(function (e) {
        if (/idioma/i.test(e && e.message)) return original(msg);   // coluna ainda não criada: envia normal
        throw e;
      });
    };
  }

  /* estilo */
  var st = document.createElement('style');
  st.textContent =
    '.bb-tr{margin-top:6px;padding-top:6px;border-top:1px dashed #0002;font-size:13px;color:#555}' +
    '.bb-tr b{font-weight:600;color:#1565c0;font-size:11px;display:block;margin-bottom:2px}' +
    '#bb-lang{margin-left:auto;background:#fff2;color:#fff;border:1px solid #fff6;border-radius:14px;padding:4px 8px;font-size:13px}' +
    '#bb-lang option{color:#222}';
  document.head.appendChild(st);

  /* botão 🌐 de idioma no topo */
  var topo = document.getElementById('topo');
  if (topo && !document.getElementById('bb-lang')) {
    var sel = document.createElement('select');
    sel.id = 'bb-lang';
    var atual = meuIdioma(), tem = false;
    sel.innerHTML = IDIOMAS.map(function (x) {
      if (x[0] === atual) tem = true;
      return '<option value="' + x[0] + '">🌐 ' + esc(x[1]) + '</option>';
    }).join('') + (tem ? '' : '<option value="' + esc(atual) + '">🌐 ' + esc(atual.toUpperCase()) + '</option>');
    sel.value = atual;
    sel.onchange = function () { guardarIdioma(sel.value); processar(true); };
    topo.appendChild(sel);
  }

  var lista = [], aPedir = false, pendente = false;

  async function lerMensagens() {
    if (!window.conv || typeof window.api !== 'function') return [];
    try {
      return await window.api('mensagens?select=id,remetente_id,tipo,texto,dados,idioma&conversa_id=eq.' + window.conv.id + '&order=created_at.asc');
    } catch (e) {
      try { return await window.api('mensagens?select=id,remetente_id,tipo,texto,dados&conversa_id=eq.' + window.conv.id + '&order=created_at.asc'); }
      catch (e2) { return []; }
    }
  }

  async function processar(forcar) {
    if (aPedir) { pendente = true; return; }
    var box = document.getElementById('msgs');
    if (!box || !window.conv) return;
    aPedir = true;
    try {
      var els = box.querySelectorAll('.m');
      if (forcar || lista.length !== els.length) lista = await lerMensagens();
      els = box.querySelectorAll('.m');
      if (lista.length !== els.length) return;

      var meu = meuIdioma(), eu = window.eu, outro = '';
      for (var i = lista.length - 1; i >= 0; i--) {
        if (lista[i].remetente_id !== eu && lista[i].idioma) { outro = base(lista[i].idioma); break; }
      }

      lista.forEach(function (x, i) {
        var el = els[i];
        if (x.tipo !== 'texto' || !x.texto || !el) return;
        if (x.dados && (x.dados.pagamento || x.dados.produto)) return;   // cartões de pagamento/produto não se traduzem
        if (/https?:\/\//i.test(x.texto)) return;                        // mensagens com link de produto
        var minha = x.remetente_id === eu;
        var para = minha ? outro : meu;
        var chave = para + '|' + x.texto;
        if (!para || el.getAttribute('data-bb-tr') === chave) return;
        if (x.idioma && base(x.idioma) === para) return;   // já está no idioma certo
        el.setAttribute('data-bb-tr', chave);
        var velho = el.querySelector('.bb-tr'); if (velho) velho.remove();

        traduzir(x.texto, para).then(function (r) {
          if (!r || !r.t || el.getAttribute('data-bb-tr') !== chave) return;
          var de = r.de || base(x.idioma);
          if (de === para || r.t.trim().toLowerCase() === x.texto.trim().toLowerCase()) return;
          var hora = el.querySelector('small');
          // anti-contactos também na tradução (ex.: números escritos noutra língua que viram dígitos)
          var F = window.FiltroContactos;
          if (!minha && F && F.verificar && !F.verificar(r.t).ok) {
            var t0 = el.firstChild;
            while (t0 && t0.nodeType !== 3) t0 = t0.nextSibling;
            if (t0) t0.nodeValue = '⚠️ Mensagem ocultada: contém contactos ou meios fora da plataforma.';
            return;
          }
          var caixa = document.createElement('div');
          caixa.className = 'bb-tr';
          if (minha) {
            caixa.innerHTML = '<b>🌐 O outro lê em ' + esc(nome(para)) + '</b>' + esc(r.t);
          } else {
            // mensagem recebida: mostra no meu idioma e o original por baixo
            var n = el.firstChild;
            while (n && n.nodeType !== 3) n = n.nextSibling;
            if (!n) return;
            n.nodeValue = r.t;
            caixa.innerHTML = '<b>Original' + (de ? ' (' + esc(nome(de)) + ')' : '') + '</b>' + esc(x.texto);
          }
          el.insertBefore(caixa, hora || null);
        });
      });
    } finally {
      aPedir = false;
      if (pendente) { pendente = false; processar(false); }
    }
  }

  function vigiar() {
    var box = document.getElementById('msgs');
    if (!box) return;
    new MutationObserver(function () { processar(false); }).observe(box, { childList: true });
    processar(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vigiar); else vigiar();
})();

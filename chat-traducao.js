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

  /* pedidos de contacto sem dígitos: "seu número de telefone", "your phone", email…
     (o texto de qualquer língua é traduzido para português antes de ser verificado) */
  var BLOQ = 'Não pode pedir ou enviar contactos (número, telefone, email) fora da plataforma.';
  // contacto direto (nunca é produto)
  var CONTACTO = '(?:contacto|contactos|contato|contatos|contact|contacts|whats|whatsapp)';
  // aparelhos: podem ser produto da loja ("quero um telefone Samsung"), por isso só bloqueiam em pedidos claros
  var APARELHO = '(?:telefone|telefono|telemovel|celular|phone|mobile|movil)';
  // meios de comunicação: "número" só bloqueia quando vem junto de um destes
  var MEIO = '(?:telefone|telefono|telemovel|celular|cel|phone|mobile|movil|chamada|chamadas|chamar|liga|ligue|ligo|ligar|ligacao|ligacoes|call|calls|contacto|contactos|contato|contatos|contact|whats|whatsapp|zap|wpp|sms|telegram|wechat|viber|signal|imo|skype)';
  var NUMERO = '(?:numero|numeros|number|numbers)';
  var POSSE = '(?:seu|sua|teu|tua|vosso|vossa|your|ur|tu|su|votre|ton|dein|deine|tuo)';
  var REGRAS_EXTRA = [
    // email é sempre proibido
    /\b(?:email|emails|mail|gmail|hotmail|outlook|yahoo|icloud|correio eletronico|correo electronico|courriel)\b/,
    // "seu número de telefone / de chamada / de whatsapp…" (mas "seu número" sozinho passa: sapato, cintura…)
    new RegExp('\\b' + NUMERO + '\\b[^.!?]{0,20}\\b' + MEIO + '\\b'),
    new RegExp('\\b' + MEIO + '\\b[^.!?]{0,12}\\b' + NUMERO + '\\b'),
    // "seu contacto", "teu whats"
    new RegExp('\\b' + POSSE + '\\s+' + CONTACTO + '\\b'),
    // "qual o seu telefone?", "your phone?", "manda o teu celular pf" (pedido no fim da frase)
    new RegExp('\\b' + POSSE + '\\s+' + APARELHO + '\\s*(?:\\?|$|por favor|pf|pfv|pls|please|plz)'),
    // "peço / manda / dá-me / give me … contacto/whats"
    new RegExp('\\b(?:peco|pede|pedir|pedia|quero|queria|preciso|manda|mande|envia|envie|passa|passe|deixa|deixe|partilha|partilhe|compartilha|compartilhe|share|dame|pasame|da me|de me|me da|me de|give me|send me|can i get|can i have)\\b[^.!?]{0,25}\\b' + CONTACTO + '\\b'),
    // "qual o contacto / whats"
    new RegExp('\\b(?:qual|quais|what|cual)\\b[^.!?]{0,15}\\b' + CONTACTO + '\\b')
  ];
  // "número de série / IMEI / modelo" é do produto: tira só essa parte antes de verificar (não abre buracos no resto da frase)
  var NUM_PRODUTO = /\b(?:numeros?|numbers?)\s+(?:de\s+|do\s+|da\s+|of\s+)?(?:serie|series|serial|imei|modelo|model|referencia|reference|lote|peca|pecas|part)\b/g;
  function normal(t) {
    t = String(t || '').toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return t.replace(/e\s*-\s*mail/g, 'email').replace(/[-’'"]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function pedeContacto(t) {
    var n = normal(t).replace(NUM_PRODUTO, ' ');
    for (var i = 0; i < REGRAS_EXTRA.length; i++) if (REGRAS_EXTRA[i].test(n)) return true;
    var F = window.FiltroContactos;
    return !!(F && F.verificar && !F.verificar(t).ok);
  }
  window.BBPedeContacto = pedeContacto;

  /* mostra o aviso no sítio do aviso vermelho (em vez de uma janela de alerta) */
  var alertaOriginal = window.alert;
  window.alert = function (m) {
    if (m === BLOQ) {
      var a = document.getElementById('aviso');
      if (a) { a.textContent = BLOQ; a.style.display = 'block'; return; }
    }
    return alertaOriginal.apply(window, arguments);
  };

  /* antes de enviar: verifica o texto e a tradução para português; guarda o idioma de quem envia */
  if (typeof window.mandar === 'function') {
    var original = window.mandar;
    window.mandar = async function (msg) {
      if (msg && msg.tipo === 'texto' && msg.texto) {
        if (pedeContacto(msg.texto)) throw new Error(BLOQ);
        var r = await traduzir(msg.texto, 'pt');
        if (r && r.t && r.t !== msg.texto && pedeContacto(r.t)) throw new Error(BLOQ);
      }
      var com = Object.assign({}, msg, { idioma: meuIdioma() });
      try { return await original(com); }
      catch (e) {
        if (/idioma/i.test(e && e.message)) return original(msg);   // coluna ainda não criada: envia normal
        throw e;
      }
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
          if (!minha && (pedeContacto(r.t) || pedeContacto(x.texto))) {
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

/* idioma-primeiro.js — B-Babilônia
   Páginas do fornecedor / fábrica:
   - a página abre logo no idioma do telemóvel (a tradução é feita pelo fornecedor-idioma.js);
   - na primeira visita aparece a janela "Escolha o seu idioma", com o idioma do telemóvel em primeiro (📱);
   - a escolha fica guardada em bb_prefs (a mesma do painel do vendedor, da loja e do chat);
   - botão 🌐 no canto para mudar o idioma depois.
   Ficheiro novo: não altera nenhum outro ficheiro. */
(function () {
  if (window.__bbIdiomaPrimeiro) return; window.__bbIdiomaPrimeiro = 1;

  var IDIOMAS = [
    ['pt','Português','Escolha o seu idioma'],['en','English','Choose your language'],['zh','中文','请选择您的语言'],
    ['ar','العربية','اختر لغتك'],['fr','Français','Choisissez votre langue'],['es','Español','Elija su idioma'],
    ['hi','हिन्दी','अपनी भाषा चुनें'],['ru','Русский','Выберите язык'],['tr','Türkçe','Dilinizi seçin'],
    ['vi','Tiếng Việt','Chọn ngôn ngữ của bạn'],['id','Bahasa Indonesia','Pilih bahasa Anda'],['th','ไทย','เลือกภาษาของคุณ'],
    ['bn','বাংলা','আপনার ভাষা বেছে নিন'],['ur','اردو','اپنی زبان منتخب کریں'],['fa','فارسی','زبان خود را انتخاب کنید'],
    ['de','Deutsch','Wählen Sie Ihre Sprache'],['it','Italiano','Scegli la tua lingua'],['ja','日本語','言語を選択してください'],
    ['ko','한국어','언어를 선택하세요'],['sw','Kiswahili','Chagua lugha yako'],['am','አማርኛ','ቋንቋዎን ይምረጡ'],
    ['ha','Hausa','Zaɓi harshenka'],['yo','Yorùbá','Yan èdè rẹ'],['zu','isiZulu','Khetha ulimi lwakho'],
    ['so','Soomaali','Dooro luqaddaada'],['ms','Bahasa Melayu','Pilih bahasa anda'],['fil','Filipino','Piliin ang iyong wika'],
    ['pl','Polski','Wybierz język'],['nl','Nederlands','Kies uw taal'],['uk','Українська','Виберіть мову'],
    ['ro','Română','Alegeți limba'],['he','עברית','בחר את השפה שלך'],['el','Ελληνικά','Επιλέξτε τη γλώσσα σας']
  ];
  var INFO = {}; IDIOMAS.forEach(function (x) { INFO[x[0]] = x; });
  var TROCA = { iw: 'he', 'in': 'id', tl: 'fil', nb: 'en', no: 'en' };

  function prefs() { try { return JSON.parse(localStorage.getItem('bb_prefs') || '{}') || {}; } catch (e) { return {}; } }
  function gravar(p) { try { localStorage.setItem('bb_prefs', JSON.stringify(p)); } catch (e) {} }
  function codigo(v) { var l = String(v || '').split('-')[0].toLowerCase(); l = TROCA[l] || l; return INFO[l] ? l : ''; }

  var tel = '';
  var lista = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language];
  for (var i = 0; i < lista.length && !tel; i++) tel = codigo(lista[i]);
  if (!tel) tel = 'en';
  var atual = codigo(prefs().idioma) || tel;

  var css = document.createElement('style');
  css.textContent =
    '#bb-ip{position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}' +
    '#bb-ip .cx{background:#fff;color:#1b2430;width:100%;max-width:560px;border-radius:18px 18px 0 0;padding:18px 16px 16px;max-height:92vh;display:flex;flex-direction:column}' +
    '#bb-ip h2{margin:0;font-size:20px;line-height:1.3}#bb-ip .en{color:#5f6b7a;font-size:14px;margin:2px 0 12px}' +
    '#bb-ip .tel{display:block;width:100%;text-align:left;border:2px solid #1565c0;background:#e8f1fd;color:#1b2430;border-radius:12px;padding:14px;font-size:17px;font-weight:700;margin-bottom:10px}' +
    '#bb-ip .lst{display:grid;grid-template-columns:1fr 1fr;gap:8px;overflow:auto;-webkit-overflow-scrolling:touch}' +
    '#bb-ip .lst button{border:1.5px solid #e3e8ef;background:#fff;color:#1b2430;border-radius:12px;padding:12px 8px;font-size:15px;text-align:left}' +
    '#bb-ip .lst button.on{border-color:#1565c0;background:#e8f1fd;font-weight:700}' +
    '#bb-ipb{position:fixed;top:10px;right:10px;z-index:2147483500;background:#fff;color:#1b2430;border:1.5px solid #e3e8ef;border-radius:999px;padding:7px 12px;font:600 13px system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.15)}';
  (document.head || document.documentElement).appendChild(css);

  function escolher(l) {
    var p = prefs(), antes = codigo(p.idioma) || tel;
    p.idioma = l; p.idiomaEscolhido = true; gravar(p);
    var m = document.getElementById('bb-ip'); if (m) m.remove();
    if (l !== antes) location.reload(); else botao();
  }

  function janela(primeira) {
    if (document.getElementById('bb-ip')) return;
    var t = INFO[tel];
    var m = document.createElement('div');
    m.id = 'bb-ip'; m.className = 'notranslate'; m.setAttribute('translate', 'no');
    m.innerHTML = '<div class="cx"><h2>🌐 ' + t[2] + '</h2>' +
      (tel !== 'en' ? '<div class="en">Choose your language</div>' : '<div class="en"></div>') +
      '<button type="button" class="tel" data-l="' + tel + '">📱 ' + t[1] + ' ✓</button>' +
      '<div class="lst">' + IDIOMAS.filter(function (x) { return x[0] !== tel; }).map(function (x) {
        return '<button type="button" data-l="' + x[0] + '"' + (x[0] === atual ? ' class="on"' : '') + '>' + x[1] + '</button>';
      }).join('') + '</div>' +
      (primeira ? '' : '<button type="button" id="bb-ipx" style="margin-top:10px;border:0;background:#f1f3f6;border-radius:12px;padding:12px;font-size:16px">✕</button>') +
      '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-l]') : null;
      if (b) return escolher(b.getAttribute('data-l'));
      if (!primeira && (e.target === m || e.target.id === 'bb-ipx')) m.remove();
    });
  }

  function botao() {
    if (document.getElementById('bb-ipb')) return;
    var b = document.createElement('button');
    b.id = 'bb-ipb'; b.type = 'button'; b.className = 'notranslate'; b.setAttribute('translate', 'no');
    b.textContent = '🌐 ' + INFO[atual][1];
    b.onclick = function () { janela(false); };
    document.body.appendChild(b);
  }

  function arrancar() {
    botao();
    if (!prefs().idiomaEscolhido) janela(true);   // primeira visita: pede para escolher o idioma
  }
  if (document.body) arrancar(); else document.addEventListener('DOMContentLoaded', arrancar);
})();

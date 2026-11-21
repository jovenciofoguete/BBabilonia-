/* loja-continentes.js — BBabilônia
   No loja-criar.html, em "Para onde envia": botões para marcar ou desmarcar um continente inteiro
   (África, Europa, Ásia e Médio Oriente, América do Norte e Central, América do Sul, Oceania).
   Marca as mesmas caixas de país que já existem: o que é guardado continua igual (lista de países).
   Ficheiro novo: não altera o loja-criar.html. */
(function () {
  if (window.__bbContinentes) return; window.__bbContinentes = 1;
  var CONT = {
    'África': 'DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW',
    'Europa': 'AL AD AT BY BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA',
    'Ásia e Médio Oriente': 'AF AM AZ BH BD BT BN KH CN GE IN ID IR IQ IL JP JO KZ KW KG LA LB MY MV MN MM NP KR OM PK PS PH QA SA SG LK SY TW TJ TH TL TR TM AE UZ VN YE',
    'América do Norte e Central': 'AG BS BB BZ CA CR CU DM DO SV GD GT HT HN JM MX NI PA KN LC VC TT US',
    'América do Sul': 'AR BO BR CL CO EC GY PY PE SR UY VE',
    'Oceania': 'AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU'
  };

  function caixas() { return Array.prototype.slice.call(document.querySelectorAll('#pl .pe')); }
  function doCont(nome) {
    var c = CONT[nome].split(' ');
    return caixas().filter(function (x) { return c.indexOf(x.value) > -1; });
  }

  function montar() {
    var pbox = document.getElementById('pbox'), pl = document.getElementById('pl');
    if (!pbox || !pl || !caixas().length || document.getElementById('bb-cont')) return false;
    var d = document.createElement('div');
    d.id = 'bb-cont';
    d.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:8px';
    d.innerHTML = '<div style="width:100%;font-size:14px;color:#9a9aa2">Marcar por continente:</div>' +
      Object.keys(CONT).map(function (n) {
        return '<button type="button" data-cont="' + n + '" style="width:auto;padding:8px 12px;font-size:14px">' + n + '</button>';
      }).join('');
    pbox.insertBefore(d, pbox.firstChild);

    function pintar() {
      d.querySelectorAll('[data-cont]').forEach(function (b) {
        var l = doCont(b.getAttribute('data-cont'));
        var todos = l.length && l.every(function (x) { return x.checked; });
        b.style.background = todos ? '#ff4d6a' : '';
        b.style.borderColor = todos ? '#ff4d6a' : '';
        b.style.color = todos ? '#fff' : '';
        b.textContent = (todos ? '✓ ' : '') + b.getAttribute('data-cont');
      });
    }
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cont]'); if (!b) return;
      var l = doCont(b.getAttribute('data-cont'));
      var marcar = !l.every(function (x) { return x.checked; });   // se já estão todos marcados, desmarca
      l.forEach(function (x) { x.checked = marcar; });
      pintar();
    });
    pl.addEventListener('change', pintar);
    pintar();
    return true;
  }

  if (!montar()) {
    var n = 0, t = setInterval(function () { if (montar() || ++n > 50) clearInterval(t); }, 200);
  }
})();

/* ---- (21/11/2026) a loja pode ser de qualquer país do mundo ----
   Moçambique, Tanzânia e África do Sul continuam com as listas de província e distrito.
   Os outros países: província, distrito e bairro escritos à mão; telemóvel com o indicativo do país.
   Só acrescenta: não altera o resto do loja-criar.html. */
(function () {
  if (window.__bbMundo) return;
  if (typeof PAISES_LOJA === 'undefined' || typeof PAISES === 'undefined' || typeof CODES === 'undefined' ||
      typeof PROV === 'undefined' || typeof INDICATIVO === 'undefined' || typeof OUTRO === 'undefined' ||
      typeof encherProv !== 'function' || typeof encherDist !== 'function' || typeof telCompleto !== 'function' ||
      typeof mostrarLocal !== 'function' || !document.getElementById('pais') || !document.getElementById('lPais')) return;
  window.__bbMundo = 1;
  var g = function (i) { return document.getElementById(i); };

  /* todos os países */
  CODES.forEach(function (c) { if (PAISES_LOJA.indexOf(c) < 0) PAISES_LOJA.push(c); });
  function opcoes() {
    return '<option value="">— Escolha o país —</option>' + PAISES.map(function (p) { return '<option value="' + p.c + '">' + p.n + '</option>'; }).join('');
  }
  ['pais', 'lPais'].forEach(function (id) { var s = g(id), v = s.value; s.innerHTML = opcoes(); s.value = v; });

  /* província escrita à mão (guarda o texto numa única opção, para o resto do código a ler como antes) */
  function criarTexto(selId) {
    var s = g(selId); if (!s || g(selId + 'O')) return;
    var t = document.createElement('input');
    t.id = selId + 'O'; t.className = 'hide'; t.maxLength = 60; t.setAttribute('autocomplete', 'off');
    t.placeholder = 'Escreva a província, estado ou região';
    s.parentNode.insertBefore(t, s.nextSibling);
    t.addEventListener('input', function () {
      var o = document.createElement('option'); o.value = t.value.trim();
      s.innerHTML = ''; s.appendChild(o); s.value = o.value;
    });
  }
  criarTexto('prov'); criarTexto('lProv');

  var oriProv = encherProv;
  window.encherProv = function (sel, pais, atual) {
    var t = g(sel.id + 'O');
    if (t && pais && !PROV[pais]) {
      sel.classList.add('hide'); t.classList.remove('hide');
      t.value = atual || ''; t.dispatchEvent(new Event('input'));
      return;
    }
    sel.classList.remove('hide');
    if (t) { t.classList.add('hide'); t.value = ''; }
    return oriProv(sel, pais, atual);
  };

  var oriDist = encherDist;
  window.encherDist = function (sel, outro, prov, atual) {
    var pais = sel.id === 'dist' ? g('pais').value : ((typeof lojaPais !== 'undefined' && lojaPais) || g('lPais').value);
    if (pais && !PROV[pais]) {
      sel.innerHTML = '<option value="' + OUTRO + '">Outro (escrever)</option>';
      sel.value = OUTRO; sel.classList.add('hide');
      outro.classList.remove('hide'); outro.value = atual || '';
      return;
    }
    sel.classList.remove('hide');
    return oriDist(sel, outro, prov, atual);
  };

  /* telemóvel: fora de MZ, TZ e ZA escreve-se com o indicativo do país */
  var oriTel = telCompleto;
  window.telCompleto = function (pais, t) {
    if (!pais || INDICATIVO[pais]) return oriTel(pais, t);
    var d = String(t || '').replace(/\D/g, '');
    return d.length >= 8 && d.length <= 15 && d[0] !== '0' ? '+' + d : '';
  };
  function indicativo(spanId, telId, p) {
    g(spanId).textContent = INDICATIVO[p] || (p ? '+' : '+258');
    g(telId).placeholder = INDICATIVO[p] || !p ? '84 123 4567' : 'Indicativo do país + número (ex.: 86 138 0013 8000)';
  }
  g('pais').addEventListener('change', function () { indicativo('ind', 'tel', g('pais').value); });
  g('lPais').addEventListener('change', function () { indicativo('lInd', 'lTel', g('lPais').value); });

  /* loja que já existe, de outro país: mostra o indicativo e o telemóvel certos */
  var oriLocal = mostrarLocal;
  window.mostrarLocal = function (l) {
    oriLocal(l);
    var p = (typeof lojaPais !== 'undefined' && lojaPais) || g('lPais').value;
    indicativo('lInd', 'lTel', p);
    if (p && !INDICATIVO[p] && l && l.telefone) g('lTel').value = String(l.telefone).replace(/^\+/, '');
  };
})();

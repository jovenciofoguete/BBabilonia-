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
      

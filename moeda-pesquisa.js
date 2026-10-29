/* moeda-pesquisa.js — BBabilônia: todas as moedas do mundo + pesquisa (lupa) no registo do produto.
   Não altera o fornecedor-novo.html nem o publicar-v3.js: só melhora o <select id="moeda">.
   O valor guardado continua a ser o código da moeda (ex.: MZN, USD). */
(function () {
  if (window.__bbMoeda) return; window.__bbMoeda = 1;

  var LISTA = ('AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD ' +
    'CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD ' +
    'HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD ' +
    'MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG ' +
    'QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS ' +
    'UAH UGX USD UYU UZS VES VND VUV WST XAF XCD XOF XPF YER ZAR ZMW ZWL').split(' ');
  var TOPO = ['MZN', 'USD', 'EUR', 'ZAR', 'BRL', 'AOA', 'CNY', 'GBP'];   // aparecem primeiro

  var nomes = null; try { nomes = new Intl.DisplayNames(['pt'], { type: 'currency' }); } catch (e) {}
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function nome(c) { try { var n = nomes && nomes.of(c); return n && n !== c ? n.charAt(0).toUpperCase() + n.slice(1) : ''; } catch (e) { return ''; } }
  function rot(c) { var n = nome(c); return n ? c + ' — ' + n : c; }

  var css = document.createElement('style');
  css.textContent =
    '.bbm{position:relative;margin:0}' +
    '.bbm-bt{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:left;gap:8px}' +
    '.bbm-bt i{font-style:normal;opacity:.7}' +
    '.bbm-pn{margin-top:6px;background:#1c1c1f;border:1px solid #2c2c30;border-radius:12px;overflow:hidden}' +
    '.bbm-bar{display:flex;align-items:center;padding:0 12px;border-bottom:1px solid #2c2c30}' +
    '.bbm-bar input{flex:1;width:auto;background:transparent;border:0;outline:0;color:#fff;font-size:16px;padding:14px 10px;border-radius:0}' +
    '.bbm-ls{max-height:300px;overflow-y:auto}' +
    '.bbm-g{padding:8px 14px;font-size:13px;color:#9aa0a6;background:#17171a;position:sticky;top:0}' +
    '.bbm-it{padding:12px 16px;font-size:16px;border-top:1px solid #2a2a2e;cursor:pointer;color:#fff}' +
    '.bbm-it.on{background:#1d3b6e;font-weight:bold}' +
    '.bbm-nd{padding:14px;color:#9aa0a6}';
  document.head.appendChild(css);

  function montar(sel) {
    if (sel.__bbm) return; sel.__bbm = 1;
    var atual = sel.value || 'MZN', cods = [];
    Array.prototype.forEach.call(sel.options, function (o) { if (o.value && cods.indexOf(o.value) < 0) cods.push(o.value); });
    LISTA.forEach(function (c) { if (cods.indexOf(c) < 0) cods.push(c); });
    var resto = cods.filter(function (c) { return TOPO.indexOf(c) < 0; })
      .sort(function (a, b) { return (nome(a) || a).localeCompare(nome(b) || b, 'pt'); });
    var topo = TOPO.filter(function (c) { return cods.indexOf(c) > -1; });

    sel.innerHTML = '';
    topo.concat(resto).forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = rot(c); sel.appendChild(o); });
    sel.value = atual; if (!sel.value) sel.value = 'MZN';

    var box = document.createElement('div'); box.className = 'bbm';
    var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'bbm-bt';
    var pn = document.createElement('div'); pn.className = 'bbm-pn'; pn.style.display = 'none';
    pn.innerHTML = '<div class="bbm-bar"><span>🔍</span><input type="search" placeholder="Pesquisar moeda…" autocomplete="off"></div><div class="bbm-ls"></div>';
    var inp = pn.querySelector('input'), ls = pn.querySelector('.bbm-ls');
    box.appendChild(bt); box.appendChild(pn);
    sel.style.display = 'none';
    sel.parentNode.insertBefore(box, sel.nextSibling);

    function botao() { bt.innerHTML = ''; var s = document.createElement('span'); s.textContent = rot(sel.value); var i = document.createElement('i'); i.textContent = '▾'; bt.appendChild(s); bt.appendChild(i); }
    function item(c) {
      var d = document.createElement('div'); d.className = 'bbm-it' + (c === sel.value ? ' on' : '');
      d.textContent = (c === sel.value ? '✓ ' : '') + rot(c); d.setAttribute('data-c', c); return d;
    }
    function grupo(t) { var g = document.createElement('div'); g.className = 'bbm-g'; g.textContent = t; return g; }
    function lista() {
      var q = norm(inp.value).trim(); ls.innerHTML = '';
      var ok = function (c) { return !q || norm(c + ' ' + nome(c)).indexOf(q) > -1; };
      var a = topo.filter(ok), b = resto.filter(ok);
      if (!q && a.length) { ls.appendChild(grupo('Mais usadas')); a.forEach(function (c) { ls.appendChild(item(c)); }); ls.appendChild(grupo('Todas as moedas')); b.forEach(function (c) { ls.appendChild(item(c)); }); }
      else a.concat(b).forEach(function (c) { ls.appendChild(item(c)); });
      if (!a.length && !b.length) { var n = document.createElement('div'); n.className = 'bbm-nd'; n.textContent = 'Nenhuma moeda encontrada'; ls.appendChild(n); }
    }
    function abrir() { pn.style.display = ''; inp.value = ''; lista(); ls.scrollTop = 0; try { inp.focus(); } catch (e) {} }
    function fechar() { pn.style.display = 'none'; }

    bt.onclick = function () { pn.style.display === 'none' ? abrir() : fechar(); };
    inp.oninput = lista;
    ls.onclick = function (e) {
      var d = e.target.closest ? e.target.closest('.bbm-it') : null; if (!d) return;
      sel.value = d.getAttribute('data-c');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      botao(); fechar();
    };
    document.addEventListener('click', function (e) { if (pn.style.display !== 'none' && !box.contains(e.target)) fechar(); });
    sel.addEventListener('change', botao);
    botao();
  }

  var n = 0, t = setInterval(function () {
    var sel = document.getElementById('moeda') || document.querySelector('select[name*="moeda" i],select[name*="currency" i]');
    if (sel && sel.tagName === 'SELECT') { clearInterval(t); montar(sel); }
    else if (++n > 40) clearInterval(t);
  }, 250);
})();

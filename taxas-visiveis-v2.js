(function () {
  var URL = 'https://dsfoqoeawvjafypycldz.supabase.co/rest/v1/taxas_cripto?select=codigo,nome,destino,percentual,fixo_usd&ativo=eq.true';
  var KEY = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var taxas = null, aplicando = false;

  function fmt(n) { return String(n).replace('.', ','); }

  function achar() {
    var ss = document.querySelectorAll('select');
    for (var i = 0; i < ss.length; i++) {
      for (var j = 0; j < ss[i].options.length; j++) {
        if (/troca em/i.test(ss[i].options[j].text)) return ss[i];
      }
    }
    return null;
  }

  function aplicar() {
    if (!taxas || aplicando) return;
    var s = achar();
    if (!s) return;
    aplicando = true;
    for (var i = 0; i < s.options.length; i++) {
      var o = s.options[i];
      var orig = o.getAttribute('data-orig');
      if (!orig) {
        orig = o.text;
        o.setAttribute('data-orig', orig);
      }
      var t = null;
      for (var k = 0; k < taxas.length; k++) {
        if (taxas[k].codigo === o.value || orig.indexOf(taxas[k].nome) === 0) {
          t = taxas[k];
          break;
        }
      }
      if (t) {
        var novo = orig + ' · ' + fmt(t.percentual) + '% + ' + fmt(t.fixo_usd) + ' USD';
        if (o.text !== novo) o.text = novo;
      }
    }
    aplicando = false;
  }

  fetch(URL, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (Array.isArray(d)) {
        taxas = d;
        aplicar();
      }
    })
    .catch(function () {});

  new MutationObserver(function () { aplicar(); })
    .observe(document.body, { childList: true, subtree: true });

  var n = 0;
  var iv = setInterval(function () {
    aplicar();
    if (++n > 20) clearInterval(iv);
  }, 500);
})();

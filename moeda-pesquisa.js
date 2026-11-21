/* moeda-pesquisa.js — BBabilônia: moeda fixa no registo do produto (substitui a lista de moedas).
   Loja de Moçambique (MZ) -> só Metical (MZN). Qualquer outro país -> só Dólar (USD).
   O valor guardado continua a ser o código da moeda no <select id="moeda"> (o publicar-v3.js lê-o). */
(function () {
  if (window.__bbMoeda) return; window.__bbMoeda = 1;
  var SUPA = 'https://dsfoqoeawvjafypycldz.supabase.co', KEY = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var NOMES = { MZN: 'Metical (MZN)', USD: 'Dólar americano (USD)' };

  function sessao() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) {
          var s = JSON.parse(localStorage.getItem(k));
          if (s && s.access_token && s.user) return s;
        }
      }
    } catch (e) {}
    return null;
  }
  function pedir(c, s) {
    return fetch(SUPA + '/rest/v1/' + c, { headers: { apikey: KEY, Authorization: 'Bearer ' + s.access_token } })
      .then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
  }
  /* país da loja: a do próprio; se for funcionário, a da loja do patrão */
  function paisDaLoja(s) {
    return pedir('lojas?select=pais&dono_id=eq.' + encodeURIComponent(s.user.id) + '&limit=1', s).then(function (l) {
      if (l && l[0] && l[0].pais) return l[0].pais;
      return pedir('funcionarios?select=dono_id&ativo=eq.true&email=eq.' + encodeURIComponent(String(s.user.email || '').toLowerCase()), s).then(function (f) {
        if (!f || !f[0]) return '';
        return pedir('lojas?select=pais&dono_id=eq.' + encodeURIComponent(f[0].dono_id) + '&limit=1', s).then(function (l2) { return (l2 && l2[0] && l2[0].pais) || ''; });
      });
    });
  }
  function fixar(sel, cod) {
    sel.innerHTML = '<option value="' + cod + '">' + NOMES[cod] + '</option>';
    sel.value = cod;
    sel.style.display = 'none';
    var t = document.getElementById('moeda-fixa');
    if (!t) {
      t = document.createElement('div'); t.id = 'moeda-fixa';
      t.style.cssText = 'padding:12px;border-radius:10px;border:1px solid #2c2c30;background:#1c1c1f;color:#f3f3f3;font:inherit';
      sel.parentNode.insertBefore(t, sel.nextSibling);
    }
    t.textContent = NOMES[cod];
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function iniciar(sel) {
    /* até saber o país, só fica uma opção (Metical) para nunca sair uma moeda estranha */
    fixar(sel, 'MZN');
    var tentativas = 0;
    (function tenta() {
      var s = sessao();
      if (!s) { if (++tentativas < 600) setTimeout(tenta, 1000); return; }
      paisDaLoja(s).then(function (p) { fixar(sel, p && p !== 'MZ' ? 'USD' : 'MZN'); });
    })();
  }

  var n = 0, t = setInterval(function () {
    var sel = document.getElementById('moeda');
    if (sel && sel.tagName === 'SELECT') { clearInterval(t); iniciar(sel); }
    else if (++n > 40) clearInterval(t);
  }, 250);
})();

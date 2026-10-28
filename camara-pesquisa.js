/* BBabilonia - icone de camara ao lado da lupa de pesquisa (abre pesquisa-imagem.html). Ficheiro novo. */
(function () {
  if (window.__bbCamara) return; window.__bbCamara = true;
  var DESTINO = 'busca-imagem-v2.html';
  var SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

  function acharPesquisa() {
    var ins = Array.prototype.slice.call(document.querySelectorAll('input'));
    var a = ins.filter(function (i) { return i.type === 'search'; })[0];
    if (a) return a;
    a = ins.filter(function (i) {
      var t = ((i.placeholder || '') + ' ' + (i.id || '') + ' ' + (i.name || '') + ' ' + (i.className || '')).toLowerCase();
      return /pesquis|procur|busca|search/.test(t);
    })[0];
    return a || null;
  }

  function botao(flutuante) {
    var b = document.createElement('a');
    b.href = DESTINO; b.id = 'bb-camara'; b.title = 'Pesquisar por imagem';
    b.setAttribute('aria-label', 'Pesquisar por imagem');
    b.innerHTML = SVG;
    var s = b.style;
    s.display = 'inline-flex'; s.alignItems = 'center'; s.justifyContent = 'center';
    s.width = '40px'; s.height = '40px'; s.borderRadius = '10px'; s.flex = '0 0 40px';
    s.background = '#0a8f5a'; s.color = '#fff'; s.textDecoration = 'none';
    if (flutuante) {
      s.position = 'fixed'; s.top = '12px'; s.right = '12px'; s.zIndex = '99980';
      s.boxShadow = '0 2px 8px rgba(0,0,0,.25)'; s.borderRadius = '50%';
    } else {
      s.marginLeft = '6px'; s.verticalAlign = 'middle';
    }
    return b;
  }

  function iniciar() {
    if (window.top !== window.self || document.getElementById('bb-camara')) return;
    var campo = acharPesquisa();
    if (campo && campo.parentNode) {
      var pai = campo.parentNode;
      var cs = getComputedStyle(pai);
      if (cs.display !== 'flex' && cs.display !== 'inline-flex') {
        var w = document.createElement('span');
        w.style.display = 'flex'; w.style.alignItems = 'center'; w.style.width = '100%';
        pai.insertBefore(w, campo); w.appendChild(campo);
        campo.style.flex = '1'; campo.style.minWidth = '0';
        w.appendChild(botao(false));
      } else {
        pai.insertBefore(botao(false), campo.nextSibling);
      }
    } else {
      document.body.appendChild(botao(true));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

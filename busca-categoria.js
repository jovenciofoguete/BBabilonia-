(function () {
  var done = false;
  function norm(t) {
    return (t || '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function findSelect() {
    var all = document.querySelectorAll('select');
    for (var i = 0; i < all.length; i++) {
      var s = all[i];
      var first = s.options[0] ? s.options[0].text : '';
      if (/categoria/i.test(first) || /cat/i.test((s.id || '') + ' ' + (s.name || ''))) return s;
    }
    return null;
  }
  function init() {
    if (done) return;
    var sel = findSelect();
    if (!sel) return;
    done = true;

    var box = document.createElement('div');
    box.style.cssText = 'width:100%;margin:4px 0;';

    var inp = document.createElement('input');
    inp.type = 'search';
    inp.placeholder = '🔍 Pesquisar categoria...';
    inp.autocomplete = 'off';
    inp.style.cssText = 'width:100%;box-sizing:border-box;padding:12px;font-size:16px;border:1px solid #444;border-radius:8px 8px 0 0;background:#1c1c1f;color:#fff;margin:0;';

    var chosen = document.createElement('div');
    chosen.style.cssText = 'display:none;padding:8px 12px;font-size:14px;background:#14301f;color:#7dffa8;border-left:1px solid #444;border-right:1px solid #444;';

    var list = document.createElement('div');
    list.style.cssText = 'max-height:340px;overflow-y:auto;background:#1c1c1f;color:#eee;border:1px solid #444;border-top:0;border-radius:0 0 8px 8px;';

    box.appendChild(inp);
    box.appendChild(chosen);
    box.appendChild(list);
    sel.style.display = 'none';
    sel.parentNode.insertBefore(box, sel.nextSibling);

    function items() {
      var out = [];
      var opts = sel.options;
      for (var i = 0; i < opts.length; i++) {
        var o = opts[i];
        if (!o.value) continue;
        var g = (o.parentNode && o.parentNode.tagName === 'OPTGROUP') ? o.parentNode.label : '';
        out.push({ value: o.value, text: o.text.trim(), group: g });
      }
      return out;
    }

    function render() {
      var q = norm(inp.value);
      list.innerHTML = '';
      var found = 0, last = null;
      items().forEach(function (it) {
        if (q && norm(it.group + ' ' + it.text).indexOf(q) === -1) return;
        found++;
        if (it.group && it.group !== last) {
          last = it.group;
          var h = document.createElement('div');
          h.textContent = it.group;
          h.style.cssText = 'padding:10px 12px;font-weight:bold;font-size:15px;background:#2a2a2e;color:#fff;position:sticky;top:0;';
          list.appendChild(h);
        }
        var d = document.createElement('div');
        var on = String(sel.value) === String(it.value);
        d.textContent = it.text;
        d.style.cssText = 'padding:12px 12px 12px 26px;border-bottom:1px solid #2d2d30;cursor:pointer;font-size:15px;' +
          (on ? 'background:#1d4ed8;color:#fff;' : '');
        d.addEventListener('click', function () {
          sel.value = it.value;
          sel.dispatchEvent(new Event('input', { bubbles: true }));
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          chosen.style.display = 'block';
          chosen.textContent = '✔ Escolhida: ' + (it.group ? it.group + ' › ' : '') + it.text;
          render();
        });
        list.appendChild(d);
      });
      if (!found) {
        var n = document.createElement('div');
        n.style.cssText = 'padding:12px;color:#999;';
        n.textContent = 'Nenhuma categoria encontrada';
        list.appendChild(n);
      }
    }

    inp.addEventListener('input', render);
    render();

    /* se as categorias chegarem depois do carregamento, atualiza a lista */
    new MutationObserver(render).observe(sel, { childList: true, subtree: true });
  }
  init();
  if (!done) {
    var obs = new MutationObserver(function () { init(); if (done) obs.disconnect(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', init);
  }
})();

(function () {
  var done = false;
  function norm(t) {
    return (t || '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function findSelect() {
    var all = document.querySelectorAll('select');
    for (var i = 0; i < all.length; i++) {
      if (/categ/i.test((all[i].id || '') + ' ' + (all[i].name || ''))) return all[i];
    }
    return null;
  }
  function init() {
    if (done) return;
    var sel = findSelect();
    if (!sel) return;
    done = true;
    var box = document.createElement('div');
    box.style.cssText = 'position:relative;width:100%;margin:4px 0;';
    var inp = document.createElement('input');
    inp.type = 'search';
    inp.placeholder = '🔍 Pesquisar categoria...';
    inp.autocomplete = 'off';
    inp.style.cssText = 'width:100%;box-sizing:border-box;padding:12px;font-size:16px;border:1px solid #bbb;border-radius:8px;background:#fff;color:#111;';
    var list = document.createElement('div');
    list.style.cssText = 'display:none;position:absolute;left:0;right:0;top:100%;z-index:9999;max-height:260px;overflow-y:auto;background:#fff;color:#111;border:1px solid #bbb;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.25);';
    box.appendChild(inp);
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
        out.push({ value: o.value, text: o.text, group: g });
      }
      return out;
    }
    function render() {
      var q = norm(inp.value);
      list.innerHTML = '';
      var found = 0;
      items().forEach(function (it) {
        if (q && norm(it.group + ' ' + it.text).indexOf(q) === -1) return;
        found++;
        var d = document.createElement('div');
        d.style.cssText = 'padding:12px;border-bottom:1px solid #eee;cursor:pointer;font-size:15px;';
        d.innerHTML = (it.group ? '<small style="color:#777">' + it.group + ' › </small>' : '') + '<b>' + it.text + '</b>';
        d.addEventListener('mousedown', function (e) { e.preventDefault(); });
        d.addEventListener('click', function () {
          sel.value = it.value;
          sel.dispatchEvent(new Event('input', { bubbles: true }));
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          inp.value = (it.group ? it.group + ' › ' : '') + it.text;
          list.style.display = 'none';
          inp.blur();
        });
        list.appendChild(d);
      });
      if (!found) {
        var n = document.createElement('div');
        n.style.cssText = 'padding:12px;color:#777;';
        n.textContent = 'Nenhuma categoria encontrada';
        list.appendChild(n);
      }
    }
    inp.addEventListener('focus', function () { inp.select(); render(); list.style.display = 'block'; });
    inp.addEventListener('input', function () { render(); list.style.display = 'block'; });
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) list.style.display = 'none';
    });
    new MutationObserver(function () {
      if (list.style.display === 'block') render();
    }).observe(sel, { childList: true, subtree: true });
  }
  init();
  if (!done) {
    var obs = new MutationObserver(function () { init(); if (done) obs.disconnect(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', init);
  }
})();

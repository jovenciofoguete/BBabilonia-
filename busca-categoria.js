(function () {
  var sel = null, input, list, status;

  function norm(t) {
    return (t || '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function findSelect() {
    var all = document.querySelectorAll('select');
    for (var i = 0; i < all.length; i++) {
      var s = all[i];
      var key = (s.id || '') + ' ' + (s.name || '');
      if (/moeda|currency/i.test(key)) continue;
      var first = s.options[0] ? s.options[0].text : '';
      if (/categ/i.test(key) || /categoria/i.test(first)) return s;
    }
    return null;
  }

  function render() {
    if (!sel) return;
    var q = norm(input.value);
    list.innerHTML = '';
    var lastGroup = null, shown = 0;
    Array.prototype.forEach.call(sel.options, function (o) {
      if (!o.value) return;
      var parts = o.text.split(/\s*[›>]\s*/);
      var name = parts.pop();
      var group = parts.join(' › ');
      if (!group && o.parentNode.tagName === 'OPTGROUP') group = o.parentNode.label;
      if (q && norm(o.text + ' ' + group).indexOf(q) < 0) return;
      if (group && group !== lastGroup) {
        var h = document.createElement('div');
        h.textContent = group;
        h.style.cssText = 'padding:8px 12px;font-size:13px;color:#9aa0a6;background:#17171a;position:sticky;top:0';
        list.appendChild(h);
        lastGroup = group;
      }
      var it = document.createElement('div');
      var isSel = o.value === sel.value;
      it.textContent = (isSel ? '✓ ' : '') + name;
      it.style.cssText = 'padding:12px 16px;font-size:16px;border-top:1px solid #2a2a2e;cursor:pointer;color:#fff;' +
        (isSel ? 'background:#1d3b6e;font-weight:bold;' : '');
      it.onclick = function () {
        sel.value = o.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        status.textContent = 'Escolhida: ' + o.text;
        render();
      };
      list.appendChild(it);
      shown++;
    });
    if (!shown) {
      var e = document.createElement('div');
      e.textContent = 'Nenhuma categoria encontrada';
      e.style.cssText = 'padding:14px;color:#9aa0a6';
      list.appendChild(e);
    }
  }

  function build() {
    sel = findSelect();
    if (!sel || sel.options.length < 2) { sel = null; return false; }
    var box = document.createElement('div');
    box.style.cssText = 'margin:6px 0 14px';

    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;background:#1c1c1e;border:1px solid #333;border-radius:12px;padding:0 12px';
    var icon = document.createElement('span');
    icon.textContent = '🔍';
    input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Pesquisar categoria...';
    input.style.cssText = 'flex:1;background:transparent;border:0;outline:0;color:#fff;font-size:16px;padding:14px 10px';
    input.oninput = render;
    bar.appendChild(icon);
    bar.appendChild(input);

    status = document.createElement('div');
    status.style.cssText = 'font-size:13px;color:#9aa0a6;margin:6px 2px';
    var cur = sel.options[sel.selectedIndex];
    status.textContent = sel.value && cur ? 'Escolhida: ' + cur.text : 'Nenhuma categoria escolhida';

    list = document.createElement('div');
    list.style.cssText = 'max-height:320px;overflow-y:auto;background:#1c1c1e;border:1px solid #333;border-radius:12px';

    box.appendChild(bar);
    box.appendChild(status);
    box.appendChild(list);
    sel.style.display = 'none';
    sel.parentNode.insertBefore(box, sel.nextSibling);
    new MutationObserver(render).observe(sel, { childList: true, subtree: true });
    render();
    return true;
  }

  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    if (build() || tries > 40) clearInterval(timer);
  }, 300);
})();

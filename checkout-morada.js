/* BBabilônia – obriga o cliente a escolher uma morada guardada antes de pagar */
(function () {
  var SB = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var KEY = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var sess = null;
  try { sess = JSON.parse(localStorage.getItem('bb_sess') || 'null'); } catch (e) {}
  var escolhida = null;
  try { escolhida = JSON.parse(localStorage.getItem('morada_escolhida') || 'null'); } catch (e) {}

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var box = document.createElement('div');
  box.id = 'bb-morada-box';
  box.style.cssText = 'background:#fff;border:1px solid #ddd8cd;border-radius:10px;padding:14px;margin:12px 0;font:16px/1.45 system-ui,sans-serif;color:#1d1b18';

  function inserir() {
    var alvo = document.querySelector('form') || document.querySelector('main') || document.body;
    alvo.insertBefore(box, alvo.firstChild);
  }

  /* campos antigos de nome/telefone/morada: preenche e esconde */
  var RX = /nome|name|telef|telem|phone|morada|endere|address|cidade|city|pa[ií]s|country|provin|distrito|postal|zip|marca/i;
  function camposAntigos() {
    var lista = document.querySelectorAll('input[type=text],input[type=tel],input:not([type]),textarea,select');
    var res = [];
    lista.forEach(function (el) {
      if (box.contains(el)) return;
      var t = (el.id || '') + ' ' + (el.name || '') + ' ' + (el.placeholder || '');
      if (RX.test(t)) res.push({ el: el, t: t });
    });
    return res;
  }
  function pôr(el, v) {
    if (v == null) return;
    if (el.tagName === 'SELECT') {
      var ok = false;
      Array.prototype.forEach.call(el.options, function (o) { if (o.value === v || o.text === v) { el.value = o.value; ok = true; } });
      if (!ok) { var o = document.createElement('option'); o.value = v; o.text = v; el.appendChild(o); el.value = v; }
    } else { el.value = v; }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function aplicar(m) {
    camposAntigos().forEach(function (c) {
      var t = c.t.toLowerCase(), v = null;
      if (/marca/.test(t)) v = m.marca;
      else if (/telef|telem|phone/.test(t)) v = m.telefone;
      else if (/provin/.test(t)) v = m.provincia;
      else if (/distrito/.test(t)) v = m.distrito;
      else if (/cidade|city/.test(t)) v = m.cidade;
      else if (/postal|zip/.test(t)) v = m.codigo_postal;
      else if (/pa[ií]s|country/.test(t)) v = m.pais;
      else if (/morada|endere|address/.test(t)) v = [m.endereco, m.cidade, m.distrito, m.provincia, m.codigo_postal, m.pais].filter(Boolean).join(', ');
      else if (/nome|name/.test(t)) v = m.nome;
      pôr(c.el, v);
      var w = c.el.closest('label,div,p,li') || c.el;
      var l = c.el.previousElementSibling;
      c.el.style.display = 'none';
      if (l && l.tagName === 'LABEL') l.style.display = 'none';
    });
    window.MORADA_ESCOLHIDA = m;
    localStorage.setItem('morada_escolhida', JSON.stringify(m));
  }

  function desenhar(lista) {
    if (!sess) {
      box.innerHTML = '<b>Morada de entrega</b><p>Entre na sua conta para escolher uma morada guardada.</p><a href="moradas-v2.html?escolher=1" style="display:inline-block;background:#0b5d4b;color:#fff;border-radius:8px;padding:11px 16px;text-decoration:none">Entrar e escolher morada</a>';
      return;
    }
    if (!lista.length) {
      box.innerHTML = '<b>Morada de entrega</b><p>Ainda não tem moradas guardadas.</p><a href="moradas-v2.html?escolher=1" style="display:inline-block;background:#0b5d4b;color:#fff;border-radius:8px;padding:11px 16px;text-decoration:none">Adicionar morada</a>';
      return;
    }
    var h = '<b>Escolha a morada de entrega</b>';
    lista.forEach(function (m) {
      var marcado = escolhida && String(escolhida.id) === String(m.id);
      h += '<label style="display:block;border:1px solid ' + (marcado ? '#0b5d4b' : '#ddd8cd') + ';border-radius:8px;padding:10px;margin-top:8px">' +
        '<input type="radio" name="bb_morada" value="' + esc(m.id) + '" ' + (marcado ? 'checked' : '') + ' style="width:auto;margin-right:8px">' +
        '<b style="display:inline">' + esc(m.nome) + '</b> <span style="font-size:12px;color:#0b5d4b">(' + esc(m.tipo) + ')</span><br>' +
        '<span style="font-size:14px;color:#6b665e">' + esc(m.endereco) + ', ' + [m.cidade, m.distrito, m.provincia, m.pais].filter(Boolean).map(esc).join(', ') + '<br>' + esc(m.telefone) + (m.marca ? ' · Marca: ' + esc(m.marca) : '') + '</span></label>';
    });
    h += '<p style="margin:10px 0 0"><a href="moradas-v2.html?escolher=1" style="color:#0b5d4b">Adicionar ou editar moradas</a></p><div id="bb-morada-erro" style="color:#b3261e;font-size:14px;margin-top:8px"></div>';
    box.innerHTML = h;
    box.querySelectorAll('input[name=bb_morada]').forEach(function (r) {
      r.addEventListener('change', function () {
        var m = lista.filter(function (x) { return String(x.id) === r.value; })[0];
        escolhida = m; aplicar(m);
        document.getElementById('bb-morada-erro').textContent = '';
        desenhar(lista);
      });
    });
    if (escolhida && lista.some(function (x) { return String(x.id) === String(escolhida.id); })) {
      escolhida = lista.filter(function (x) { return String(x.id) === String(escolhida.id); })[0];
      aplicar(escolhida);
    } else { escolhida = null; window.MORADA_ESCOLHIDA = null; }
  }

  /* bloqueia pagar / finalizar / enviar pedido sem morada */
  function bloquear(e) {
    var b = e.target.closest && e.target.closest('button,input[type=submit],a');
    if (!b || box.contains(b)) return;
    var txt = (b.textContent || b.value || '').toLowerCase();
    if (!/pagar|pagamento|finalizar|enviar pedido|confirmar|concluir|comprar/.test(txt)) return;
    if (window.MORADA_ESCOLHIDA) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var er = document.getElementById('bb-morada-erro');
    if (er) er.textContent = 'Escolha uma morada de entrega antes de pagar.';
    else alert('Escolha uma morada de entrega antes de pagar.');
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  document.addEventListener('click', bloquear, true);
  document.addEventListener('submit', function (e) {
    if (!window.MORADA_ESCOLHIDA) { e.preventDefault(); e.stopImmediatePropagation(); box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }, true);

  function iniciar() {
    inserir();
    if (!sess) { desenhar([]); return; }
    box.innerHTML = 'A carregar moradas…';
    fetch(SB + '/rest/v1/moradas?select=*&order=id.desc', { headers: { apikey: KEY, Authorization: 'Bearer ' + sess.access_token } })
      .then(function (r) { if (!r.ok) throw new Error('x'); return r.json(); })
      .then(desenhar)
      .catch(function () { box.innerHTML = '<b>Morada de entrega</b><p>Não foi possível carregar as moradas. Entre de novo na sua conta.</p><a href="moradas-v2.html?escolher=1" style="color:#0b5d4b">Abrir moradas</a>'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
    

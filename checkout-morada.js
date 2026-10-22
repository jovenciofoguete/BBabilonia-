/* BBabilônia - checkout-morada.js */
(function () {
  var SB = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var KEY = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var SESSAO = 'bb_sessao_checkout';
  var box, lista = [], sess = null;

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function agora() { return Math.floor(Date.now() / 1000); }
  function guardarSess(d) {
    if (!d || !d.access_token) return null;
    var s = {
      access_token: d.access_token,
      refresh_token: d.refresh_token,
      user_id: (d.user && d.user.id) || d.user_id,
      email: (d.user && d.user.email) || d.email || '',
      exp: d.expires_at || (agora() + (d.expires_in || 3600))
    };
    try { localStorage.setItem(SESSAO, JSON.stringify(s)); } catch (e) {}
    return s;
  }

  function lerSess() {
    var achada = null;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i), v = localStorage.getItem(k);
        if (!v || v.indexOf('access_token') < 0) continue;
        try {
          var o = JSON.parse(v);
          if (o && o.currentSession) o = o.currentSession;
          if (o && o.access_token && (o.user || o.user_id)) {
            var s = { access_token: o.access_token, refresh_token: o.refresh_token,
              user_id: (o.user && o.user.id) || o.user_id, email: (o.user && o.user.email) || '', exp: o.expires_at || 0 };
            if (!achada || (s.exp || 0) > (achada.exp || 0)) achada = s;
          }
        } catch (e) {}
      }
    } catch (e) {}
    return achada;
  }

  function api(path, opts, token) {
    opts = opts || {};
    opts.headers = Object.assign({ apikey: KEY, 'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (token || KEY) }, opts.headers || {});
    return fetch(SB + path, opts).then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { return { ok: r.ok, data: j }; }); });
  }

  function renovar(s) {
    if (!s || !s.refresh_token) return Promise.resolve(null);
    return api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: s.refresh_token }) })
      .then(function (r) { return r.ok ? guardarSess(r.data) : null; });
  }

  function sessaoValida() {
    var s = lerSess();
    if (!s) return Promise.resolve(null);
    if (!s.exp || s.exp > agora() + 30) return Promise.resolve(s);
    return renovar(s);
  }

  function entrar(email, senha) {
    return api('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: email, password: senha }) })
      .then(function (r) { return r.ok ? guardarSess(r.data) : null; });
  }

  function ehInternacional(m) {
    var t = String(m.tipo || '').toLowerCase();
    return t.indexOf('extern') >= 0 || t.indexOf('internac') >= 0;
  }

  function carregar() {
    if (!sess) return Promise.resolve([]);
    return api('/rest/v1/moradas?select=*&user_id=eq.' + encodeURIComponent(sess.user_id), {}, sess.access_token)
      .then(function (r) { return Array.isArray(r.data) ? r.data : []; });
  }

  function lerEscolha(chave) { try { return JSON.parse(localStorage.getItem(chave) || 'null'); } catch (e) { return null; } }
  function guardarEscolha(chave, m) {
    try { m ? localStorage.setItem(chave, JSON.stringify(m)) : localStorage.removeItem(chave); } catch (e) {}
    if (chave === 'morada_entrega') { window.MORADA_ENTREGA = m; preencher(m); }
    else window.ENDERECO_INTERNACIONAL = m;
  }

  var CAMPOS = [
    { re: /nome completo/i, k: 'nome' },
    { re: /telefone/i, k: 'telefone' },
    { re: /email/i, k: 'email' },
    { re: /^\s*pa[ií]s\s*$/i, k: 'pais' },
    { re: /morada de entrega/i, k: 'morada' }
  ];
  function rotuloDe(el) {
    var l = el.id && document.querySelector('label[for="' + el.id + '"]');
    if (l) return l;
    var p = el.previousElementSibling;
    if (p && (p.textContent || '').length < 80) return p;
    return el.closest('label');
  }
  function acharCampos() {
    var r = {};
    document.querySelectorAll('input, textarea, select').forEach(function (el) {
      if ((box && box.contains(el)) || el.type === 'radio' || el.type === 'checkbox' || el.type === 'hidden') return;
      var l = rotuloDe(el);
      if (!l) return;
      var t = l.textContent || '';
      CAMPOS.forEach(function (c) {
        if (!r[c.k] && c.re.test(t)) r[c.k] = { el: el, l: l };
      });
    });
    return r;
  }
  function esconder() {
    var c = acharCampos();
    Object.keys(c).forEach(function (k) {
      c[k].el.required = false;
      c[k].el.style.display = 'none';
      c[k].l.style.display = 'none';
    });
    return c;
  }
  function poeValor(el, v) {
    if (!el) return;
    v = v == null ? '' : String(v);
    if (el.tagName === 'SELECT') {
      for (var i = 0; i < el.options.length; i++) {
        if ((el.options[i].text || '').trim().toLowerCase() === v.trim().toLowerCase() || el.options[i].value.toLowerCase() === v.toLowerCase()) { el.selectedIndex = i; break; }
      }
    } else el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function preencher(m) {
    var c = esconder();
    if (!m) { Object.keys(c).forEach(function (k) { poeValor(c[k].el, ''); }); return; }
    var morada = [m.endereco, m.cidade, m.distrito, m.provincia, m.codigo_postal, m.pais].filter(Boolean).join(', ') +
      (m.marca ? '\nMarca de envio: ' + m.marca : '');
    if (c.nome) poeValor(c.nome.el, m.nome);
    if (c.telefone) poeValor(c.telefone.el, m.telefone);
    if (c.email) poeValor(c.email.el, m.email || (sess && sess.email) || 'sem-email@bbabilonia.com');
    if (c.pais) poeValor(c.pais.el, m.pais);
    if (c.morada) poeValor(c.morada.el, morada);
  }

  function cartao(m, grupo, marcado) {
    var linha = [m.endereco, m.cidade, m.distrito, m.provincia, m.pais].filter(Boolean).join(', ');
    return '<label style="display:block;border:1px solid ' + (marcado ? '#e91e63' : '#ddd') + ';border-radius:10px;padding:10px;margin:6px 0;cursor:pointer;background:#fff;color:#111;text-align:left">' +
      '<input type="radio" name="' + grupo + '" value="' + esc(m.id) + '"' + (marcado ? ' checked' : '') + ' style="width:22px;height:22px;min-width:22px;display:inline-block;vertical-align:middle;margin:0 8px 0 0;padding:0;accent-color:#e91e63">' +
      '<b>' + esc(m.nome) + '</b> · ' + esc(m.telefone) +
      '<div style="font-size:13px;color:#444;margin-top:4px">' + esc(linha) + (m.codigo_postal ? ' · ' + esc(m.codigo_postal) : '') + '</div>' +
      (m.marca ? '<div style="font-size:13px;color:#444">Marca de envio: ' + esc(m.marca) + '</div>' : '') +
      '</label>';
  }

  function secao(titulo, itens, grupo, chave) {
    var esc_ = lerEscolha(chave);
    if (!itens.length) return '<div style="margin:8px 0"><b>' + titulo + '</b><div style="font-size:13px;color:#777;margin-top:4px">Ainda não tem nenhum guardado.</div></div>';
    var marcado = esc_ && itens.some(function (m) { return String(m.id) === String(esc_.id); }) ? String(esc_.id) : (itens.length === 1 ? String(itens[0].id) : '');
    if (marcado) guardarEscolha(chave, itens.filter(function (m) { return String(m.id) === marcado; })[0]);
    else guardarEscolha(chave, null);
    return '<div style="margin:8px 0"><b>' + titulo + '</b>' +
      itens.map(function (m) { return cartao(m, grupo, String(m.id) === marcado); }).join('') + '</div>';
  }

  function desenhar() {
    var interna = lista.filter(function (m) { return !ehInternacional(m); });
    var externa = lista.filter(ehInternacional);
    var html1 = secao('Endereço de entrega interna', interna, 'bb_interna', 'morada_entrega');
    var html2 = secao('Endereço de entrega internacional (externa)', externa, 'bb_externa', 'endereco_internacional');
    var esc1 = lerEscolha('morada_entrega');
    box.innerHTML =
      '<div style="font-weight:700;font-size:16px;margin-bottom:6px">Endereço de entrega</div>' +
      html1 + html2 +
      (esc1 ? '<div style="color:#2e7d32;font-weight:700;margin-top:8px">✔ Endereço escolhido: ' + esc(esc1.nome) + ' · ' + esc(esc1.cidade || '') + ', ' + esc(esc1.pais || '') + '</div>' : '<div style="color:#c62828;margin-top:8px">Toque na bolinha para escolher um endereço de entrega.</div>') +
      '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
      '<a href="/moradas-v3.html" target="_blank" style="padding:8px 12px;border:1px solid #e91e63;color:#e91e63;border-radius:8px;text-decoration:none;font-size:14px">Criar ou editar endereços</a>' +
      '<button type="button" id="bbAtualizar" style="padding:8px 12px;border:0;background:#e91e63;color:#fff;border-radius:8px;font-size:14px">Atualizar lista</button></div>' +
      '<div id="bbAviso" style="color:#c62828;font-size:14px;margin-top:8px"></div>';
    box.querySelectorAll('input[type=radio]').forEach(function (r) {
      r.addEventListener('change', function () {
        var m = lista.filter(function (x) { return String(x.id) === r.value; })[0];
        guardarEscolha(r.name === 'bb_interna' ? 'morada_entrega' : 'endereco_internacional', m);
        desenhar();
      });
    });
    var b = box.querySelector('#bbAtualizar');
    if (b) b.addEventListener('click', iniciar);
  }

  function desenharLogin(msg) {
    box.innerHTML =
      '<div style="font-weight:700;font-size:16px;margin-bottom:6px">Entre para ver os seus endereços</div>' +
      '<input id="bbEmail" type="email" placeholder="Email" style="width:100%;padding:10px;margin:4px 0;border:1px solid #ccc;border-radius:8px;box-sizing:border-box">' +
      '<input id="bbSenha" type="password" placeholder="Palavra-passe" style="width:100%;padding:10px;margin:4px 0;border:1px solid #ccc;border-radius:8px;box-sizing:border-box">' +
      '<button type="button" id="bbEntrar" style="width:100%;padding:10px;border:0;background:#e91e63;color:#fff;border-radius:8px;font-size:15px;margin-top:4px">Entrar</button>' +
      '<div style="color:#c62828;font-size:14px;margin-top:6px">' + esc(msg || '') + '</div>';
    box.querySelector('#bbEntrar').addEventListener('click', function () {
      var e = box.querySelector('#bbEmail').value.trim(), s = box.querySelector('#bbSenha').value;
      entrar(e, s).then(function (r) {
        if (!r) return desenharLogin('Email ou palavra-passe incorretos.');
        iniciar();
      });
    });
  }

  function iniciar() {
    box.innerHTML = '<div style="color:#555">A carregar os seus endereços…</div>';
    sessaoValida().then(function (s) {
      sess = s;
      if (!s) return desenharLogin('');
      if (!s.email) api('/auth/v1/user', {}, s.access_token).then(function (r) { if (r.ok && r.data && r.data.email) { s.email = r.data.email; var m = lerEscolha('morada_entrega'); if (m) preencher(m); } });
      carregar().then(function (l) { lista = l; desenhar(); });
    });
  }

  function textoDe(el) { return ((el.innerText || el.value || el.textContent || '') + '').toLowerCase(); }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('button, a, input[type=button], input[type=submit]');
    if (!el || (box && box.contains(el))) return;
    if (!/pagar|pagamento|finalizar|enviar pedido|confirmar pedido/.test(textoDe(el))) return;
    if (!lerEscolha('morada_entrega')) {
      ev.preventDefault(); ev.stopImmediatePropagation();
      var av = box && box.querySelector('#bbAviso');
      if (av) av.textContent = 'Escolha um endereço de entrega antes de pagar.';
      if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      preencher(lerEscolha('morada_entrega'));
    }
  }, true);

  function montar() {
    if (document.getElementById('bbMoradaBox')) return;
    box = document.createElement('div');
    box.id = 'bbMoradaBox';
    box.style.cssText = 'background:#fafafa;border:1px solid #eee;border-radius:12px;padding:12px;margin:12px 0;font-family:inherit';
    var alvo = document.querySelector('form') || document.querySelector('main') || document.body;
    alvo.insertBefore(box, alvo.firstChild);
    window.MORADA_ENTREGA = lerEscolha('morada_entrega');
    window.ENDERECO_INTERNACIONAL = lerEscolha('endereco_internacional');
    esconder();
    setTimeout(esconder, 500);
    setTimeout(esconder, 1500);
    iniciar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();

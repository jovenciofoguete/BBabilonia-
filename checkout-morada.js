(function () {
  var CH = 'bb_morada_id';
  var CAMPOS = ['nome', 'tel', 'email', 'pais', 'morada'];
  var lista = [];
  var $ = function (i) { return document.getElementById(i); };

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function externa(m) {
    return /extern|internacional/i.test(m.tipo || '');
  }

  var caixa = document.createElement('div');
  caixa.style.cssText = 'background:#161b27;border-radius:10px;padding:14px;margin:12px 0;color:#e9ecf2';

  function atual() {
    var id = localStorage.getItem(CH);
    for (var i = 0; i < lista.length; i++) {
      if (String(lista[i].id) === id) return lista[i];
    }
    return null;
  }

  function mostrarCampos(ver) {
    CAMPOS.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.style.display = ver ? '' : 'none';
      var l = el.previousElementSibling;
      if (l && l.tagName === 'LABEL') l.style.display = ver ? '' : 'none';
    });
  }

  function estado() {
    var ok = !!atual();
    var e = $('bbm-estado');
    if (e) {
      e.textContent = ok ? '✔ Endereço escolhido' : '';
      e.style.color = '#2e9d62';
    }
    mostrarCampos(!ok);
  }

  function preencher(id, v) {
    var el = $(id);
    if (!el || v == null) return;
    el.value = v;
  }

  function escolher(id, emailConta) {
    localStorage.setItem(CH, String(id));
    aplicar(emailConta);
  }

  function aplicar(emailConta) {
    var m = atual();
    if (m) {
      preencher('nome', m.nome);
      preencher('tel', m.telefone);
      preencher('email', m.email || emailConta || '');
      preencher('pais', m.pais);
      var txt = [m.endereco, m.cidade, m.distrito, m.provincia, m.codigo_postal].filter(Boolean).join(', ');
      if (m.marca) txt += ' | Marca de envio: ' + m.marca;
      preencher('morada', txt);
    }
    estado();
  }

  function cartao(m, marcado) {
    var linha = [m.endereco, m.cidade, m.distrito, m.provincia, m.pais].filter(Boolean).join(', ');
    return '<label style="display:flex;gap:10px;align-items:flex-start;border:1px solid #2b3350;border-radius:10px;padding:10px;margin:6px 0;cursor:pointer;color:#e9ecf2">' +
      '<input type="radio" name="bbmorada" value="' + esc(m.id) + '"' + (marcado ? ' checked' : '') +
      ' style="width:22px;height:22px;margin-top:2px;flex:none">' +
      '<span><b>' + esc(m.nome) + '</b> · ' + esc(m.telefone) + '<br>' + esc(linha) +
      (m.marca ? '<br>Marca de envio: ' + esc(m.marca) : '') + '</span></label>';
  }

  function rodape() {
    return '<div id="bbm-estado" style="margin:10px 0;font-weight:bold"></div>' +
      '<a href="/moradas-v3.html" style="color:#8ea2ff;margin-right:16px">Criar ou editar endereços</a>' +
      '<a href="#" id="bbm-atualizar" style="color:#8ea2ff">Atualizar lista</a>';
  }

  function ligarAtualizar() {
    var a = $('bbm-atualizar');
    if (a) a.onclick = function (ev) { ev.preventDefault(); carregar(); };
  }

  function entrar() {
    caixa.innerHTML =
      '<b>Entre para ver os seus endereços guardados</b>' +
      '<input id="bbm-email" type="email" placeholder="Email" style="margin-top:8px">' +
      '<input id="bbm-senha" type="password" placeholder="Palavra-passe" style="margin-top:8px">' +
      '<button type="button" id="bbm-entrar" style="margin-top:10px">Entrar</button>' +
      '<div id="bbm-erro" style="color:#ff7a7a;margin-top:8px"></div>' + rodape();
    ligarAtualizar();
    estado();
    $('bbm-entrar').onclick = function () {
      sb.auth.signInWithPassword({
        email: $('bbm-email').value.trim(),
        password: $('bbm-senha').value
      }).then(function (r) {
        if (r.error) $('bbm-erro').textContent = 'Email ou palavra-passe errados.';
        else carregar();
      }).catch(function () {
        $('bbm-erro').textContent = 'Sem ligação à internet.';
      });
    };
  }

  function desenhar(emailConta) {
    var guardada = localStorage.getItem(CH);
    var internas = lista.filter(function (m) { return !externa(m); });
    var externas = lista.filter(externa);
    var h = '<b>Os seus endereços de entrega</b>';
    if (!lista.length) {
      h += '<p>Ainda não tem endereços guardados.</p>';
    } else {
      if (internas.length) {
        h += '<div style="margin-top:10px;font-weight:bold">Entrega interna (mesmo país do fornecedor)</div>';
        internas.forEach(function (m) { h += cartao(m, String(m.id) === guardada); });
      }
      if (externas.length) {
        h += '<div style="margin-top:10px;font-weight:bold">Entrega internacional</div>';
        externas.forEach(function (m) { h += cartao(m, String(m.id) === guardada); });
      }
    }
    caixa.innerHTML = h + rodape();
    ligarAtualizar();
    var radios = caixa.querySelectorAll('input[name=bbmorada]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener('change', function () { escolher(this.value, emailConta); });
    }
    aplicar(emailConta);
  }

  function carregar() {
    caixa.innerHTML = 'A carregar endereços...';
    sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) { entrar(); return; }
      var emailConta = s.user && s.user.email;
      return sb.from('moradas').select('*').then(function (q) {
        if (q.error) {
          caixa.innerHTML = 'Não foi possível carregar os endereços: ' + esc(q.error.message) + rodape();
          ligarAtualizar();
          estado();
          return;
        }
        lista = q.data || [];
        desenhar(emailConta);
      });
    }).catch(function () {
      caixa.innerHTML = 'Sem ligação à internet.' + rodape();
      ligarAtualizar();
      estado();
    });
  }

  function iniciar() {
    var d = $('dados');
    if (!d || typeof sb === 'undefined') return;
    d.parentNode.insertBefore(caixa, d);
    estado();
    carregar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();

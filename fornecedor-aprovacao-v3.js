/* fornecedor-aprovacao-v3.js - BBabilonia
   Só lojas APROVADAS podem usar a área do fornecedor.
   Ficheiro novo: não altera nada do que já funciona. */
(function () {
  var URL_SB = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var KEY = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var ADMIN = 'jovenciofoguete1904@gmail.com';
  var ultimoToken = null;
  var aVerificar = false;

  function sessao() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) {
          var s = JSON.parse(localStorage.getItem(k));
          if (s && s.access_token) return s;
          if (s && s.currentSession && s.currentSession.access_token) return s.currentSession;
        }
      }
    } catch (e) {}
    return null;
  }

  function norm(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function tirarAviso() {
    var a = document.getElementById('aprovacao-loja-aviso');
    if (a) a.remove();
  }

  function mostrarAviso(titulo, texto, botaoTexto, botaoLink) {
    tirarAviso();
    var d = document.createElement('div');
    d.id = 'aprovacao-loja-aviso';
    d.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483647;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif';
    var c = document.createElement('div');
    c.style.cssText = 'background:#fff;color:#222;max-width:380px;width:100%;border-radius:14px;padding:22px;text-align:center';
    var h = document.createElement('h2');
    h.textContent = titulo;
    h.style.cssText = 'margin:0 0 10px;font-size:20px';
    var p = document.createElement('p');
    p.textContent = texto;
    p.style.cssText = 'margin:0 0 16px;font-size:15px;line-height:1.4';
    c.appendChild(h);
    c.appendChild(p);
    if (botaoTexto && botaoLink) {
      var b = document.createElement('a');
      b.href = botaoLink;
      b.textContent = botaoTexto;
      b.style.cssText = 'display:block;background:#e53935;color:#fff;text-decoration:none;padding:13px;border-radius:10px;font-weight:bold;margin-bottom:10px';
      c.appendChild(b);
    }
    var r = document.createElement('button');
    r.textContent = 'Atualizar';
    r.style.cssText = 'width:100%;background:#eee;color:#222;border:0;padding:12px;border-radius:10px;font-size:15px';
    r.onclick = function () { ultimoToken = null; verificar(); };
    c.appendChild(r);
    var x = document.createElement('button');
    x.textContent = 'Sair';
    x.style.cssText = 'width:100%;background:#fff;color:#888;border:0;padding:10px;margin-top:6px;font-size:14px';
    x.onclick = function () {
      try {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (/^sb-.*-auth-token$/.test(k)) localStorage.removeItem(k);
        }
      } catch (e) {}
      location.reload();
    };
    c.appendChild(x);
    d.appendChild(c);
    document.body.appendChild(d);
  }

  function verificar() {
    var s = sessao();
    if (!s) { tirarAviso(); ultimoToken = null; return; }
    if (aVerificar) return;
    if (s.access_token === ultimoToken) return;
    var email = (s.user && s.user.email) || '';
    if (email.toLowerCase() === ADMIN) { ultimoToken = s.access_token; tirarAviso(); return; }
    aVerificar = true;
    var uid = s.user && s.user.id;
    fetch(URL_SB + '/rest/v1/lojas?select=*', {
      headers: { apikey: KEY, Authorization: 'Bearer ' + s.access_token }
    })
      .then(function (r) {
        if (r.status === 401) throw new Error('401');
        if (!r.ok) throw new Error('erro');
        return r.json();
      })
      .then(function (rows) {
        ultimoToken = s.access_token;
        var minha = null;
        for (var i = 0; i < rows.length; i++) {
          var vals = Object.keys(rows[i]).map(function (k) { return rows[i][k]; });
          if (uid && vals.indexOf(uid) >= 0) { minha = rows[i]; break; }
        }
        if (!minha && rows.length === 1) minha = rows[0];
        if (!minha) {
          mostrarAviso('Ainda não tem loja', 'Para vender, crie a sua loja e envie os documentos.', 'Criar a minha loja', '/loja-criar.html');
          return;
        }
        if (minha.aprovada === true || minha.aprovado === true) { tirarAviso(); return; }
        var est = norm(minha.estado || minha.status);
        if (est.indexOf('aprov') === 0) { tirarAviso(); return; }
        if (est.indexOf('rejeit') === 0 || est.indexOf('recus') === 0) {
          mostrarAviso('Loja rejeitada', 'A sua loja não foi aprovada. Corrija os documentos e envie de novo.', 'Ver a minha loja', '/loja-criar.html');
        } else if (est.indexOf('suspen') === 0) {
          mostrarAviso('Loja suspensa', 'A sua loja está suspensa. Fale com o atendimento da BBabilônia.');
        } else {
          mostrarAviso('Loja em análise', 'A sua loja ainda não foi aprovada. Só pode publicar produtos depois da aprovação.');
        }
      })
      .catch(function (e) {
        ultimoToken = s.access_token;
        if (e && e.message === '401') {
          mostrarAviso('Sessão expirada', 'Carregue em Sair e entre de novo.');
        } else {
          mostrarAviso('Sem ligação', 'Não foi possível verificar a sua loja. Verifique a internet e carregue em Atualizar.');
        }
      })
      .then(function () { aVerificar = false; });
  }

  setInterval(verificar, 1500);
  verificar();
})();

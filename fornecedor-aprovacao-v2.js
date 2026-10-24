(function () {
  var URL = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var KEY = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var OWNER = ['user_id', 'owner_id', 'dono_id', 'id_dono', 'profile_id', 'auth_user_id', 'utilizador_id', 'usuario_id'];
  var ov = null, lastTok = '', fails = 0;

  function tok() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) {
          var s = JSON.parse(localStorage.getItem(k));
          s = s && (s.currentSession || s);
          if (s && s.access_token) return s;
        }
      }
    } catch (e) {}
    return null;
  }

  function uidOf(s) {
    if (s.user && s.user.id) return s.user.id;
    try {
      var p = s.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(p)).sub;
    } catch (e) { return null; }
  }

  function sair() {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (/^sb-.*-auth-token$/.test(k)) localStorage.removeItem(k);
      });
    } catch (e) {}
    location.reload();
  }

  function show(msg, btn) {
    if (!ov) {
      ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
      document.body.appendChild(ov);
    }
    ov.innerHTML = '<div style="background:#fff;color:#111;border-radius:14px;padding:22px;max-width:380px;text-align:center;font-family:sans-serif">' +
      '<p style="font-size:17px;line-height:1.4;margin:0 0 16px">' + msg + '</p>' +
      '<a href="/loja-criar.html" style="display:block;background:#111;color:#fff;padding:12px;border-radius:10px;text-decoration:none;margin-bottom:10px">' + btn + '</a>' +
      '<button id="fa-sair" style="width:100%;background:#eee;color:#111;border:0;padding:12px;border-radius:10px;font-size:15px">Sair da conta</button></div>';
    ov.querySelector('#fa-sair').onclick = sair;
  }

  function hide() {
    if (ov) { ov.remove(); ov = null; }
  }

  function estado(x) {
    return String(x.estado || x.status || '').toLowerCase();
  }

  async function check() {
    var s = tok();
    if (!s) { hide(); lastTok = ''; return; }
    if (s.access_token === lastTok) return;
    lastTok = s.access_token;
    try {
      var uid = uidOf(s);
      if (!uid) throw new Error('sem id');
      var r = await fetch(URL + '/rest/v1/lojas?select=*&limit=200', {
        headers: { apikey: KEY, Authorization: 'Bearer ' + s.access_token }
      });
      if (!r.ok) throw new Error('http ' + r.status);
      var rows = await r.json();
      if (!Array.isArray(rows)) throw new Error('formato');
      fails = 0;

      var mine = rows.filter(function (x) {
        return OWNER.some(function (k) { return x[k] === uid; });
      });
      if (!mine.length) {
        mine = rows.filter(function (x) {
          return Object.keys(x).some(function (k) {
            return x[k] === uid && !/aprov|approv|admin|revis|verific/i.test(k);
          });
        });
      }

      if (!mine.length) {
        show('Ainda não tem loja. Crie a sua loja para poder publicar produtos.', 'Criar a minha loja');
      } else if (mine.some(function (x) { return /^(aprov|approv)/.test(estado(x)); })) {
        hide();
      } else if (mine.some(function (x) { return /^rejeit|^reject/.test(estado(x)); })) {
        show('A sua loja foi rejeitada. Corrija os documentos e envie de novo.', 'Ver a minha loja');
      } else if (mine.some(function (x) { return /^suspen/.test(estado(x)); })) {
        show('A sua loja está suspensa. Não pode publicar produtos.', 'Ver a minha loja');
      } else {
        show('A sua loja está em análise. Só pode publicar produtos depois de aprovada.', 'Ver a minha loja');
      }
    } catch (e) {
      fails++;
      if (fails < 5) lastTok = '';
    }
  }

  function init() {
    check();
    setInterval(check, 2000);
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();

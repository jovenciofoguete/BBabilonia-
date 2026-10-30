/* funcionario-publicar.js — B-Babilônia: deixa o funcionário (sub-conta) com permissão "Produtos"
   publicar na página de registo. O produto fica automaticamente na loja do patrão. */
(function () {
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  function sessao() { try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k)) { var s = JSON.parse(localStorage.getItem(k)); if (s && s.access_token) return s; } } } catch (e) {} return null; }
  var s = sessao(); if (!s || !s.user || !s.user.email) return;
  var h = { apikey: KEY, Authorization: "Bearer " + s.access_token };
  fetch(SUPA + "/rest/v1/lojas?select=id&dono_id=eq." + s.user.id, { headers: h }).then(function (r) { return r.ok ? r.json() : [1]; }).then(function (minha) {
    if (minha.length) return;
    return fetch(SUPA + "/rest/v1/funcionarios?select=dono_id,permissoes&ativo=eq.true&email=eq." + encodeURIComponent(s.user.email.toLowerCase()), { headers: h }).then(function (r) { return r.ok ? r.json() : []; }).then(function (f) {
      f = f.filter(function (x) { return (x.permissoes || []).indexOf("produtos") > -1; }); if (!f.length) return;
      return fetch(SUPA + "/rest/v1/lojas?select=nome&dono_id=eq." + f[0].dono_id, { headers: h }).then(function (r) { return r.ok ? r.json() : []; }).then(function (l) {
        var tira = function () { var a = document.getElementById("aprovacao-loja-aviso"); if (a) a.remove(); };
        tira(); new MutationObserver(tira).observe(document.body, { childList: true });
        var b = document.createElement("div");
        b.style.cssText = "background:#4f46e5;color:#fff;padding:10px 14px;font:600 14px system-ui,sans-serif;text-align:center";
        b.textContent = "👤 Sub-conta de funcionário: o produto vai ser publicado na loja \"" + ((l[0] && l[0].nome) || "do seu patrão") + "\".";
        document.body.insertBefore(b, document.body.firstChild);
      });
    });
  }).catch(function () {});
})();

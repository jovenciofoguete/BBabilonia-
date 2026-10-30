/* chat-funcionario.js — B-Babilônia: o funcionário (sub-conta com permissão "Mensagens") usa o chat
   da loja em nome do patrão: vê as conversas da loja, responde, envia imagens, respostas prontas e
   links de pagamento como "Loja". Para quem não é funcionário não muda nada. */
(function () {
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var s = null; try { s = JSON.parse(localStorage.getItem("sb-dsfoqoeawvjafypycldz-auth-token") || "null"); } catch (e) {}
  if (!s || !s.user || !s.user.email || !s.access_token) return;
  var h = { apikey: KEY, Authorization: "Bearer " + s.access_token }, eu0 = s.user.id;
  function get(c) { return fetch(SUPA + "/rest/v1/" + c, { headers: h }).then(function (r) { return r.ok ? r.json() : []; }, function () { return []; }); }
  get("lojas?select=id&dono_id=eq." + eu0).then(function (minha) {
    if (minha.length) return;
    return get("funcionarios?select=dono_id,permissoes&ativo=eq.true&email=eq." + encodeURIComponent(s.user.email.toLowerCase())).then(function (f) {
      f = f.filter(function (x) { return (x.permissoes || []).indexOf("mensagens") > -1; }); if (!f.length) return;
      var pd = new URLSearchParams(location.search).get("dono"), escolhido = f.filter(function (x) { return x.dono_id === pd; })[0] || f[0], dono = escolhido.dono_id;
      return get("lojas?select=nome&dono_id=eq." + dono).then(function (l) { aplicar(dono, (l[0] && l[0].nome) || "do seu patrão"); });
    });
  });
  function aplicar(dono, nome) {
    var n = 0;
    (function espera() {
      var w = window, pronto = w.eu && w.vista && (w.vista !== "lista" || /item|vazio/.test((document.getElementById("lista") || {}).innerHTML || "")) && (w.vista !== "chat" || w.conv);
      if (!pronto) { if (++n < 100) setTimeout(espera, 150); return; }
      w.eu = dono;
      var b = document.getElementById("bb-func");
      if (!b) { b = document.createElement("div"); b.id = "bb-func"; b.style.cssText = "background:#4f46e5;color:#fff;padding:7px 12px;font:600 13px system-ui,sans-serif;text-align:center"; document.body.insertBefore(b, document.body.firstChild); }
      b.textContent = "👤 Sub-conta: está a responder em nome da loja \"" + nome + "\".";
      if (w.vista === "lista" && typeof w.listar === "function") w.listar();
      else if (w.vista === "chat" && w.conv) { w.ultimo = ""; var p = document.getElementById("partilhar"); if (p) p.style.display = "none"; if (typeof w.carregar === "function") w.carregar(true); }
    })();
  }
})();

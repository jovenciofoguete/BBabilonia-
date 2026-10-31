/* vendedor-confirmar-email.js — B-Babilônia
   1) Ao criar conta no painel do vendedor, o link do email de confirmação volta para o PAINEL DO VENDEDOR
      (antes voltava para a loja principal e o vendedor caía no "Meu Babilônia" de comprador).
   2) Quando o vendedor chega pelo link do email, a sessão fica logo iniciada no painel do vendedor.
   Tem de carregar ANTES do painel-vendedor-v2.js. Não altera os outros ficheiros. */
(function () {
  if (window.__bbVendEmail) return; window.__bbVendEmail = 1;
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var CHAVE = "sb-dsfoqoeawvjafypycldz-auth-token";
  var VOLTAR = location.origin + location.pathname;

  /* 1) criar conta: junta o endereço de volta ao pedido */
  var orig = window.fetch.bind(window);
  window.fetch = function (url, opc) {
    try {
      var u = typeof url === "string" ? url : (url && url.url) || "";
      if (u.indexOf(SUPA + "/auth/v1/signup") === 0 && u.indexOf("redirect_to=") < 0) {
        url = u + (u.indexOf("?") < 0 ? "?" : "&") + "redirect_to=" + encodeURIComponent(VOLTAR);
      }
    } catch (e) {}
    return orig(url, opc);
  };

  /* 2) chegou pelo link do email: guarda a sessão e abre o painel já com sessão */
  var h = location.hash.replace(/^#/, "");
  if (!/(^|&)(access_token|error)=/.test(h)) return;
  var p = {}; h.split("&").forEach(function (x) { var i = x.indexOf("="); if (i > 0) p[decodeURIComponent(x.slice(0, i))] = decodeURIComponent(x.slice(i + 1).replace(/\+/g, " ")); });
  function limpar() { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
  if (!p.access_token) { limpar(); return; }
  window.__bbVendEmailEspera = 1;
  orig(SUPA + "/auth/v1/user", { headers: { apikey: KEY, Authorization: "Bearer " + p.access_token } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (user) {
      if (user && user.id) {
        var exp = Number(p.expires_at) || (Math.floor(Date.now() / 1000) + (Number(p.expires_in) || 3600));
        localStorage.setItem(CHAVE, JSON.stringify({ access_token: p.access_token, refresh_token: p.refresh_token, token_type: p.token_type || "bearer", expires_in: Number(p.expires_in) || 3600, expires_at: exp, user: user }));
      }
      limpar(); location.reload();
    })
    .catch(function () { limpar(); });
})();

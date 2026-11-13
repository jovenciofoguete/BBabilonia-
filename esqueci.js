/* esqueci.js — B-Babilônia: link "Esqueci a palavra-passe" debaixo da palavra-passe de cada ecrã de entrada
   (Meu Babilônia, pedidos, painel do vendedor, atendimento e painel do dono). Leva a recuperar.html.
   Não altera as páginas: só acrescenta o link. */
(function () {
  if (window.__bbEsqueci) return; window.__bbEsqueci = 1;
  function emailPerto(pw) {
    var box = pw.closest("section,form,.box,.sec,div") || document;
    var em = box.querySelector('input[type="email"]') || document.querySelector('input[type="email"]');
    return em && em.value ? em.value.trim() : "";
  }
  function ligar() {
    var l = document.querySelectorAll('input[type="password"][autocomplete="current-password"]');
    for (var i = 0; i < l.length; i++) {
      var pw = l[i];
      if (pw.__bbEsq) continue; pw.__bbEsq = 1;
      var a = document.createElement("a");
      a.href = "recuperar.html"; a.className = "bb-esqueci"; a.textContent = "Esqueci a palavra-passe";
      a.style.cssText = "display:block;text-align:right;font-size:13.5px;font-weight:700;color:#2563eb;margin:6px 2px 4px;text-decoration:none";
      (function (pw, a) {
        a.onclick = function (e) {
          e.preventDefault();
          var em = emailPerto(pw);
          location.href = "recuperar.html" + (em ? "?email=" + encodeURIComponent(em) : "");
        };
      })(pw, a);
      pw.insertAdjacentElement("afterend", a);
    }
  }
  function iniciar() { ligar(); new MutationObserver(ligar).observe(document.body, { childList: true, subtree: true }); }
  if (document.body) iniciar(); else document.addEventListener("DOMContentLoaded", iniciar);
})();
/* (13/11/2026) aprovar as entradas dos agentes no painel do dono e "Verificar agora" do agente com resposta (entradas-agentes.js) */
(function(){function f(){if(!document.getElementById("t-inicio")&&!document.getElementById("reenv"))return;if(document.querySelector("script[src*=\"entradas-agentes.js\"]"))return;var s=document.createElement("script");s.src="entradas-agentes.js?v=1";(document.head||document.documentElement).appendChild(s)}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",f);else f()})();

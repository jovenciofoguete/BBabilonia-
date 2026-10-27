/* menu-baixo.js — carrega o menu fixo em baixo (menu-babilonia.js)
   nas páginas de pesquisa por imagem. Não altera mais nada. */
(function(){
  if (window.BBPrefs || document.querySelector('script[src*="menu-babilonia.js"]')) return;
  var s = document.createElement("script");
  s.src = "menu-babilonia.js";
  document.body.appendChild(s);
})();

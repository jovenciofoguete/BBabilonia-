/* traducao.js — BBabilônia
   Traduz a página para o idioma escolhido em País / Idioma / Moeda (tradução automática do Google).
   Português = página original, sem tradução. Não altera mais nada. */
(function(){
 if(window.__bbTrad)return;window.__bbTrad=1;
 var MAPA={zh:"zh-CN",he:"iw",jv:"jw",nb:"no",fil:"tl"};
 function idioma(){try{var p=JSON.parse(localStorage.getItem("bb_prefs")||"{}");return String(p.idioma||"pt").split("-")[0]}catch(e){return"pt"}}
 function codigo(l){return MAPA[l]||l}
 function cookie(v){
  var fim=v?"":";expires=Thu, 01 Jan 1970 00:00:00 GMT",h=location.hostname;
  document.cookie="googtrans="+v+";path=/"+fim;
  document.cookie="googtrans="+v+";path=/;domain="+h+fim;
  document.cookie="googtrans="+v+";path=/;domain=."+h+fim;
 }
 function atual(){var m=document.cookie.match(/googtrans=([^;]+)/);return m?decodeURIComponent(m[1]):""}
 function carregar(){
  if(document.getElementById("google_translate_element"))return;
  var st=document.createElement("style");
  st.textContent=".goog-te-banner-frame,iframe.skiptranslate,.goog-te-gadget,#goog-gt-tt,.goog-te-balloon-frame{display:none!important}body{top:0!important;position:static!important}.goog-text-highlight{background:none!important;box-shadow:none!important}";
  document.head.appendChild(st);
  var d=document.createElement("div");d.id="google_translate_element";d.style.display="none";document.body.appendChild(d);
  window.googleTranslateElementInit=function(){try{new google.translate.TranslateElement({pageLanguage:"pt",autoDisplay:false},"google_translate_element")}catch(e){}};
  var s=document.createElement("script");s.src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";document.head.appendChild(s);
 }
 function iniciar(){
  var l=idioma();
  if(l==="pt"){if(atual()){cookie("");location.reload()}return}
  var quero="/pt/"+codigo(l);
  if(atual()!==quero)cookie(quero);
  carregar();
 }
 window.addEventListener("bb-prefs",function(){
  var l=idioma(),quero=l==="pt"?"":"/pt/"+codigo(l);
  if(atual()!==quero){cookie(quero);location.reload()}
 });
 if(document.body)iniciar();else document.addEventListener("DOMContentLoaded",iniciar);
})();

/* pedidos-disputa.js — BBabilônia
   Acrescenta o separador "Em disputa" em Meu Babilônia (conta.html) e em pedidos.html.
   Mostra os pedidos que têm disputa (coluna disputa_estado). Não altera mais nada. */
(function(){
 if(window.__bbDisputaMenu)return;window.__bbDisputaMenu=1;
 var pg=location.pathname.split("/").pop()||"";
 if(pg!=="conta.html"&&pg!=="pedidos.html")return;
 var tentativas=0;
 function regra(p){return !!(p&&p.disputa_estado)}
 function pronto(){return typeof REGRA==="object"&&typeof ROT==="object"}
 function aplicar(){
  if(!pronto()){if(++tentativas<50)setTimeout(aplicar,100);return}
  if(REGRA.disputa)return;
  REGRA.disputa=regra;ROT.disputa="Em disputa";
  if(pg==="pedidos.html"){
   if(typeof COM_NUM==="object")COM_NUM.disputa=1;
   if(Array.isArray(window.ORDEM)||typeof ORDEM!=="undefined"){var i=ORDEM.indexOf("avaliar");ORDEM.splice(i<0?ORDEM.length:i+1,0,"disputa")}
   var f=new URLSearchParams(location.search);
   if(f.get("f")==="disputa"&&!f.get("pedido")){filtro="disputa";if(typeof lista==="function")lista()}
   else if(typeof abas==="function"&&document.getElementById("tabs")&&!aberto)abas();
  }else{
   var box=document.getElementById("filtros");
   if(box&&!box.querySelector('[data-f="disputa"]')){
    var st=document.createElement("style");
    st.textContent=".g7{background:linear-gradient(135deg,#fb923c,#dc2626)}";
    document.head.appendChild(st);
    var b=document.createElement("button");
    b.setAttribute("data-f","disputa");
    b.innerHTML='<span class="e g7">⚠️</span>Em disputa';
    b.onclick=function(e){e.preventDefault();location.href="pedidos.html?f=disputa"};
    box.appendChild(b);
   }
   if(typeof desenhar==="function"&&typeof pedidos!=="undefined"&&pedidos.length)desenhar();
  }
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",aplicar);else aplicar();
})();

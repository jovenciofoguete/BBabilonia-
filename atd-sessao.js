/* atd-sessao.js — BBabilônia
   Segurança do atendimento (agentes, superiores e dono):
   - a sessão do atendimento fica só neste separador: fechou, saiu (volta a pedir email e palavra-passe);
   - fica separada da sessão de cliente da loja;
   - 15 minutos sem mexer: sai sozinho. */
window.ATD_AUTH={auth:{storage:window.sessionStorage,storageKey:'bb-atd',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}};
(function(){
 var ativo=!/disputa\.html$/.test(location.pathname)||new URLSearchParams(location.search).get('como')==='admin';
 if(!ativo)return;
 var LIM=15*60*1000,t=null;
 function temSessao(){try{return!!sessionStorage.getItem('bb-atd')}catch(e){return false}}
 function sair(){
  if(!temSessao()){mexeu();return}
  var ir=function(){location.href='atendimento.html?saiu=1'};
  try{window.sb.auth.signOut().then(ir,ir)}catch(e){try{sessionStorage.removeItem('bb-atd')}catch(x){}ir()}
 }
 function mexeu(){clearTimeout(t);t=setTimeout(sair,LIM)}
 ['click','keydown','touchstart','scroll','mousemove','input'].forEach(function(e){document.addEventListener(e,mexeu,{passive:true,capture:true})});
 mexeu();
})();
/* fotos privadas do chat e dos links de pagamento: abre-as com link temporário (fotos-privadas.js) */
(function(){if(typeof document==="undefined"||window.__bbFotosPriv||document.querySelector("script[src*=\"fotos-privadas.js\"]"))return;var s=document.createElement("script");s.src="fotos-privadas.js?v=1";(document.head||document.documentElement).appendChild(s)})();

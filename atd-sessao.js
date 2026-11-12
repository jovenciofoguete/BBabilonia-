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
/* (12/11/2026) aviso da validade do BI e pedido dos dados do agente (aviso-validade.js) */
(function(){if(typeof document==="undefined"||document.querySelector("script[src*=\"aviso-validade.js\"]"))return;var s=document.createElement("script");s.src="aviso-validade.js?v=1&de=atd";(document.head||document.documentElement).appendChild(s)})();
/* (12/11/2026) aviso das verificações de pedidos à espera de confirmação (atd-aviso-verif.js) */
(function(){if(typeof document==="undefined"||document.querySelector("script[src*=\"atd-aviso-verif.js\"]"))return;var s=document.createElement("script");s.src="atd-aviso-verif.js?v=1";(document.head||document.documentElement).appendChild(s)})();
/* (12/11/2026) um só link para as duas equipas (service.bbabilonia.com):
   - antes de entrar: escolher a área (1. Atendimento ao cliente · 2. Busca e verificação);
   - depois de entrar: cada agente vai sozinho para a sua área; o dono vê as duas opções. */
(function(){
 if(typeof document==="undefined"||window.__bbArea)return;window.__bbArea=1;
 if(/^(admin|administrator)\./i.test(location.hostname))return;
 var p=location.pathname,naAtd=/^\/(atendimento(\.html)?)?$/.test(p),naVer=/\/confirmar-produto(\.html)?$/.test(p);
 if(!naAtd&&!naVer)return;
 var css=document.createElement('style');
 css.textContent='#bb-area{max-width:760px;margin:14px auto 0;padding:0 12px}#bb-area .t{font:700 14px system-ui,sans-serif;color:#64748b;margin-bottom:6px;text-align:center}'+
  '#bb-area .o{display:flex;gap:8px}#bb-area a{flex:1;display:block;text-align:center;text-decoration:none;border-radius:14px;padding:14px 8px;font:800 15px system-ui,sans-serif;background:#fff;color:#334155;border:2px solid #e2e8f0;box-shadow:0 2px 8px #0001}'+
  '#bb-area a.on.a1{background:#2563eb;border-color:#2563eb;color:#fff}#bb-area a.on.a2{background:#059669;border-color:#059669;color:#fff}'+
  '#bb-area small{display:block;font-weight:600;font-size:12px;opacity:.85;margin-top:3px}';
 function montar(mostrar){
  var d=document.getElementById('bb-area');
  if(!mostrar){if(d)d.remove();return}
  if(d)return;var main=document.querySelector('main');if(!main)return;
  d=document.createElement('div');d.id='bb-area';
  d.innerHTML='<div class="t">Escolha a sua área</div><div class="o">'+
   '<a class="a1'+(naAtd?' on':'')+'" href="atendimento.html">🎧 1. Atendimento ao cliente<small>Casos, conversas e confirmar verificações</small></a>'+
   '<a class="a2'+(naVer?' on':'')+'" href="confirmar-produto.html">🛡️ 2. Busca e verificação<small>Ir às lojas, fotos, vídeos e recolha</small></a></div>';
  main.parentNode.insertBefore(d,main);
 }
 var aRever=false;
 async function rever(){
  if(aRever)return;aRever=true;
  try{
   var s=(await window.sb.auth.getSession()).data.session;
   if(!s){montar(true);return}
   var e=await window.sb.rpc('bb_equipa'),d=await window.sb.rpc('bb_eh_dono');
   var eq=(e&&e.data)||'',dono=!!(d&&d.data);
   if(dono){montar(true);return}
   montar(false);
   if(eq==='verificacao'&&naAtd){location.replace('confirmar-produto.html');return}
   if(eq!=='verificacao'&&naVer){location.replace('atendimento.html');return}
  }catch(x){montar(true)}
  finally{aRever=false}
 }
 function arrancar(n){
  if(!window.sb||!window.sb.auth){if(n<100)setTimeout(function(){arrancar(n+1)},100);return}
  document.head.appendChild(css);rever();
  try{window.sb.auth.onAuthStateChange(function(ev){if(ev==='SIGNED_IN'||ev==='SIGNED_OUT')setTimeout(rever,300)})}catch(x){}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){arrancar(0)});else arrancar(0);
})();

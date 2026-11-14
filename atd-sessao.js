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
   - depois de entrar: cada agente vai sozinho para a sua área; o dono vê as duas opções.
   A área escolhida fica com uma bola verde ✓ e a palavra "Escolhida"; a outra fica cinzenta.
   Dono sem impressão digital/PIN nesta entrada: aviso com botão para o atendimento no painel do dono.
   (13/11/2026) Página inicial dos agentes (atendimento.html?inicio=1): as duas áreas, a sua aberta e a outra cinzenta.
   Seta "←" no cabeçalho de cada área para voltar ao início, e o botão Voltar do telemóvel também volta ao início
   (antes saía do site). */
(function(){
 if(typeof document==="undefined"||window.__bbArea)return;window.__bbArea=1;
 if(/^(admin|administrator)\./i.test(location.hostname))return;
 var p=location.pathname,naAtd=/^\/(atendimento(\.html)?)?$/.test(p),naVer=/\/confirmar-produto(\.html)?$/.test(p);
 if(!naAtd&&!naVer)return;
 var css=document.createElement('style');
 css.textContent='#bb-area{max-width:760px;margin:14px auto 0;padding:0 12px}#bb-area .t{font:700 14px system-ui,sans-serif;color:#64748b;margin-bottom:6px;text-align:center}'+
  '#bb-area .o{display:flex;gap:8px}#bb-area a{position:relative;flex:1;display:block;text-align:center;text-decoration:none;border-radius:14px;padding:16px 8px 14px;font:800 15px system-ui,sans-serif;background:#f1f5f9;color:#64748b;border:3px solid #cbd5e1;box-shadow:0 2px 8px #0001}'+
  '#bb-area a.on{background:#ecfdf5;color:#065f46;border-color:#16a34a;box-shadow:0 0 0 3px #16a34a33}'+
  '#bb-area .bola{position:absolute;top:-11px;right:-6px;width:28px;height:28px;border-radius:50%;background:#16a34a;color:#fff;font:900 16px/28px system-ui,sans-serif;text-align:center;border:3px solid #fff;box-shadow:0 2px 6px #0004}'+
  '#bb-area .esc{display:inline-block;margin-top:6px;padding:2px 10px;border-radius:999px;background:#16a34a;color:#fff;font:800 12px system-ui,sans-serif}'+
  '#bb-area small{display:block;font-weight:600;font-size:12px;opacity:.85;margin-top:3px}'+
  '#bb-area span.off{position:relative;flex:1;display:block;text-align:center;border-radius:14px;padding:16px 8px 14px;font:800 15px system-ui,sans-serif;background:#e2e8f0;color:#94a3b8;border:3px dashed #cbd5e1}'+
  '#bb-area .sair{display:block;margin:14px auto 0;padding:11px 26px;border:0;border-radius:12px;font:800 15px system-ui,sans-serif;background:#ef4444;color:#fff}'+
  'body.bb-inicio main,body.bb-inicio #tabs,body.bb-inicio .bar button:not(#bb-ini),body.bb-inicio #eu{display:none!important}'+
  '#bb-ini{flex:none;width:40px;height:40px;margin-right:10px;border:0;border-radius:50%;background:#ffffff33;color:#fff;font:900 22px/40px system-ui,sans-serif;text-align:center;cursor:pointer}'+
  '.bb-tit{display:flex;align-items:center}';
 var INICIO=new URLSearchParams(location.search).get('inicio')==='1';
 var URL_INICIO='atendimento.html?inicio=1';
 /* página inicial já com sessão: a área do agente aberta, a outra cinzenta */
 function montarInicio(eq){
  document.body.classList.add('bb-inicio');
  var d=document.getElementById('bb-area');if(d)d.remove();
  var main=document.querySelector('main');if(!main)return;
  var ver=eq==='verificacao';
  d=document.createElement('div');d.id='bb-area';
  d.innerHTML='<div class="t">Escolha a sua área</div><div class="o">'+
   (ver?'<span class="off">🎧 1. Atendimento ao cliente<small>Só para a equipa de atendimento</small></span>':opcao(true,'a1','atendimento.html','🎧 1. Atendimento ao cliente','A sua área: casos, conversas e verificações'))+
   (ver?opcao(true,'a2','confirmar-produto.html','🛡️ 2. Busca e verificação','A sua área: lojas, fotos, vídeos e recolha'):'<span class="off">🛡️ 2. Busca e verificação<small>Só para a equipa de busca e verificação</small></span>')+
   '</div><button class="sair" type="button" id="bb-ini-sair">🚪 Sair</button>';
  main.parentNode.insertBefore(d,main);
  d.querySelectorAll('.esc').forEach(function(x){x.textContent='● A sua área'});
  document.getElementById('bb-ini-sair').onclick=async function(){try{await window.sb.auth.signOut()}catch(e){}location.replace('atendimento.html')};
 }
 /* seta "←" no cabeçalho e botão Voltar do telemóvel: voltar ao início */
 var voltarPosto=false;
 function ligarVoltar(){
  var bar=document.querySelector('.bar'),h1=bar&&bar.querySelector('h1');
  if(h1&&!document.getElementById('bb-ini')){
   var b=document.createElement('button');b.id='bb-ini';b.type='button';b.setAttribute('aria-label','Voltar ao início');b.textContent='←';
   b.onclick=function(){location.href=URL_INICIO};
   var w=document.createElement('div');w.className='bb-tit';h1.parentNode.insertBefore(w,h1);w.appendChild(b);w.appendChild(h1);
  }
  if(voltarPosto)return;voltarPosto=true;
  /* O Chrome do telemóvel ignora no botão Voltar os passos criados antes de a pessoa tocar na página.
     Por isso o passo "voltar ao início" é criado no primeiro toque (e já antes, para quem toca logo em Voltar). */
  var posto=false,toque=function(){if(posto)return;posto=true;try{history.pushState({bbArea:2},'',location.href)}catch(e){}
   ['pointerdown','touchstart','keydown','click'].forEach(function(n){document.removeEventListener(n,toque,true)})};
  ['pointerdown','touchstart','keydown','click'].forEach(function(n){document.addEventListener(n,toque,true)});
  if(!(history.state&&history.state.bbArea))try{history.pushState({bbArea:1},'',location.href)}catch(e){}
  window.addEventListener('popstate',function(){location.replace(URL_INICIO)});
 }
 function opcao(liga,cls,href,titulo,sub){
  return '<a class="'+cls+(liga?' on':'')+'" href="'+href+'">'+(liga?'<span class="bola">✓</span>':'')+titulo+'<small>'+sub+'</small>'+(liga?'<span class="esc">● Escolhida</span>':'')+'</a>';
 }
 function montar(mostrar){
  var d=document.getElementById('bb-area');
  if(!mostrar){if(d)d.remove();return}
  if(d)return;var main=document.querySelector('main');if(!main)return;
  d=document.createElement('div');d.id='bb-area';
  d.innerHTML='<div class="t">Escolha a sua área</div><div class="o">'+
   opcao(naAtd,'a1','atendimento.html','🎧 1. Atendimento ao cliente','Casos, conversas e confirmar verificações')+
   opcao(naVer,'a2','confirmar-produto.html','🛡️ 2. Busca e verificação','Ir às lojas, fotos, vídeos e recolha')+'</div>';
  main.parentNode.insertBefore(d,main);
 }
 /* dono sem a impressão digital/PIN confirmados nesta entrada: em vez de "Sem acesso", explica e leva ao painel do dono */
 function donoSemAcesso(n){
  var b=document.getElementById('semAcesso');
  if(!b||b.classList.contains('hide')){if(n<40)setTimeout(function(){donoSemAcesso(n+1)},250);return}
  if(b.getAttribute('data-dono'))return;b.setAttribute('data-dono','1');
  b.innerHTML='<h2>👑 É o dono da plataforma</h2><p>Para abrir o atendimento como dono tem de confirmar a impressão digital e o PIN BBabilônia. Isso faz-se no painel do dono.</p>'+
   '<a class="bt" style="text-align:center;text-decoration:none" href="https://administrator.bbabilonia.com/atendimento.html">🔐 Abrir o atendimento no painel do dono</a>'+
   '<button class="bt l" id="bb-dono-sair" type="button">Sair</button>';
  document.getElementById('bb-dono-sair').onclick=async function(){try{await window.sb.auth.signOut()}catch(e){}location.reload()};
 }
 var aRever=false;
 async function rever(){
  if(aRever)return;aRever=true;
  try{
   var s=(await window.sb.auth.getSession()).data.session;
   if(!s){document.body.classList.remove('bb-inicio');montar(true);return}
   var e=await window.sb.rpc('bb_equipa'),d=await window.sb.rpc('bb_eh_dono');
   var eq=(e&&e.data)||'',dono=!!(d&&d.data);
   if(dono){montar(true);if(naAtd)donoSemAcesso(0);return}
   if(INICIO&&naAtd){montarInicio(eq);return}
   montar(false);
   if(eq==='verificacao'&&naAtd){location.replace('confirmar-produto.html');return}
   if(eq!=='verificacao'&&naVer){location.replace('atendimento.html');return}
   ligarVoltar();
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
/* (14/11/2026) sino 🔔 dos avisos da equipa (nova compra, pagamentos por levantamento, provas do transporte…) — sino-equipa.js */
(function(){if(typeof document==="undefined"||document.querySelector("script[src*=\"sino-equipa.js\"]"))return;var s=document.createElement("script");s.src="sino-equipa.js?v=1";(document.head||document.documentElement).appendChild(s)})();

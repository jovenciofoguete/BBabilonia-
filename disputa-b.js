/* disputa-b.js — BBabilônia: ver disputa, valor, ações e carregar */
/* ---------- Ver a disputa ---------- */
function fasesHtml(est){
 var passou=msgs.some(function(x){return x.acao==='intervencao'||x.acao==='recusar'||x.autor==='admin'})||est==='em_analise';
 var negoc=msgs.some(function(x){return x.acao==='propor'})||est==='negociacao';
 var fim=!!FINAL[est];
 var f=[['📝','Disputa aberta'],['🤝','Negociação'],['🎧','Intervenção da BBabilônia'],['⚖️','Decisão final']];
 var idx=est==='nova'?-1:est==='aberta'?0:est==='negociacao'?1:est==='em_analise'?2:3;
 return'<div class="fases">'+f.map(function(s,i){
  var c=i<idx?'feita':i===idx?(fim?'feita':'agora'):'';
  if(fim&&i===2&&!passou)c='salto';if(fim&&i===1&&!negoc&&c==='feita'&&!passou)c='salto';
  return'<div class="fase '+c+'"><b>'+(c==='feita'?'✓':s[0])+'</b>'+s[1]+'</div>'}).join('')+'</div>';
}
function falta(t){if(!t)return'';var h=Math.max(0,Math.ceil((new Date(t)-new Date())/3600000));return h>=24?Math.ceil(h/24)+' dia(s)':h+' hora(s)'}
function vezHtml(){
 var e=disp.estado,f=falta(disp.prazo||disp.prazo_fornecedor),de=disp.proposta_de,pv=din(disp.proposta_valor,disp.moeda);
 var NOME={cliente:'o cliente',fornecedor:'o fornecedor',admin:'o Atendimento'};
 if(e==='aberta')return papel==='fornecedor'?'<div class="vez"><b>⏰ É a sua vez de responder</b>Tem '+f+' para aceitar, propor outro valor ou recusar com provas. Se não responder, o cliente é reembolsado automaticamente.</div>':
  '<div class="vez"><b>⏳ À espera do fornecedor</b>'+(papel==='admin'?'Faltam ':'O fornecedor tem ')+f+' para responder. Se não responder, o cliente recebe o reembolso automaticamente. O dinheiro está congelado.</div>';
 if(e==='negociacao'){
  if(de===papel)return'<div class="vez"><b>⏳ Propôs '+pv+'</b>À espera da resposta da outra parte (faltam '+f+'). Pode editar o valor no separador 💰 Valor.</div>';
  if(papel==='admin')return'<div class="vez"><b>🤝 Em negociação</b>Proposta atual de '+NOME[de]+': '+pv+' · faltam '+f+'.</div>';
  return'<div class="vez"><b>⏰ '+(de==='cliente'?'O cliente pede':'O fornecedor propõe')+' '+pv+'</b>Tem '+f+' para aceitar ou fazer outra proposta. Se não responder, este valor fica aceite.</div>';
 }
 if(e==='em_analise'){
  if(de==='admin'){var ok=[],fa=[];(disp.aceite_cliente?ok:fa).push('cliente');(disp.aceite_fornecedor?ok:fa).push('fornecedor');
   var eu2=papel==='cliente'?disp.aceite_cliente:papel==='fornecedor'?disp.aceite_fornecedor:null;
   return'<div class="vez az"><b>🎧 O Atendimento propôs '+pv+'</b>'+(eu2===false?'Aceite no separador 💰 Valor ou responda com provas. ':'')+(ok.length?'Já aceitou: '+ok.join(' e ')+'. ':'')+(fa.length?'Falta aceitar: '+fa.join(' e ')+'.':'')+'</div>'}
  return'<div class="vez az"><b>🎧 Intervenção da BBabilônia</b>A equipa de Atendimento está a analisar as provas dos dois lados. Pode continuar a juntar provas e a propor valores.</div>';
 }
 var cls=e==='cancelada'?'no':'ok';
 return'<div class="vez '+cls+'"><b>⚖️ Decisão final: '+esc(FINAL[e]||e)+'</b>'+(Number(disp.valor_reembolso)?'Reembolso ao cliente: <b style="display:inline">'+din(disp.valor_reembolso,disp.moeda)+'</b>. É feito pelo mesmo meio de pagamento.':'Sem reembolso.')+'</div>';
}
function resumoPedido(){
 if(!ped)return'';
 return'<div class="box"><div class="inf" style="margin:0">Pedido '+esc(String(ped.id).slice(0,8))+' · '+din(ped.total,ped.currency)+'</div><div style="font-size:14.5px;margin-top:4px">'+esc(arr(ped.items).map(function(i){return(i.nome||'Produto')+' × '+(i.qtd||1)}).join(', '))+'</div>'+
  (ped.rastreio?'<div class="inf">Envio: '+esc(ped.transportadora||'')+' · '+esc(ped.rastreio)+'</div>':'')+'</div>';
}
var R=new Provas(),RT='',RV='',MT='',PV='',PARA='todos',PARA2='todos';
function ver(){
 $('tit').textContent='⚠️ Disputa '+esc(String(disp.order_id).slice(0,8));
 var aberta=['aberta','negociacao','em_analise'].indexOf(disp.estado)>-1;
 var h='';
 if(papeis.length>1)h+='<div class="papel">'+papeis.map(function(p){return'<button data-p="'+p+'" class="'+(p===papel?'on':'')+'">Ver como '+({cliente:'cliente',fornecedor:'fornecedor',admin:'Atendimento'})[p]+'</button>'}).join('')+'</div>';
 h+='<div class="box">'+fasesHtml(disp.estado)+vezHtml()+
  '<div class="res"><div>Motivo<b>'+esc(disp.motivo)+'</b></div><div>O cliente pede<b>'+esc((PEDE[disp.pedido]||[disp.pedido])[0])+'</b></div>'+
  '<div>Valor pedido<b>'+din(disp.valor,disp.moeda)+'</b></div><div>'+(FINAL[disp.estado]?'Reembolso final<b>'+din(disp.valor_reembolso,disp.moeda)+'</b>':disp.proposta_valor?'Proposta do fornecedor<b>'+din(disp.proposta_valor,disp.moeda)+'</b>':'Aberta em<b>'+new Date(disp.created_at).toLocaleDateString()+'</b>')+'</div></div></div>';
 h+=resumoPedido();
 h+='<div class="box"><h3>📜 Histórico da disputa</h3>'+msgs.map(function(x){
  var q=QUEM[x.autor]||[x.autor,'•'];
  return'<div class="msg '+esc(x.autor)+'"><div class="av">'+q[1]+'</div><div class="c"><div class="q"><b>'+q[0]+'</b> · '+new Date(x.created_at).toLocaleString()+'</div>'+
   '<span class="ac">'+esc(ACAO[x.acao]||x.acao||'')+(x.valor!=null&&/abrir|propor|aceitar|final/.test(x.acao||'')?' · '+din(x.valor,disp.moeda):x.acao==='prazo'?' · +'+x.valor+' dia(s)':'')+'</span>'+
   (x.para&&x.para!=='todos'?' <span class="ac" style="background:#fde68a;color:#78350f">🔒 '+({cliente:'Só para o cliente',fornecedor:'Só para o fornecedor',atendimento:'Só para o Atendimento'})[x.para]+'</span>':'')+
   (x.texto?'<p>'+esc(x.texto)+'</p>':'')+provasVer(arr(x.provas))+'</div></div>'}).join('')+'</div>';
 if(aberta||papel==='admin')h+=painelAcoes(aberta);
 if(papel==='admin'&&window.atdHtml)h+=atdHtml();
 $('app').innerHTML=h;
 document.querySelectorAll('[data-p]').forEach(function(b){b.onclick=function(){papel=b.getAttribute('data-p');ver()}});
 if(aberta||papel==='admin')ligarAcoes();
 if(papel==='admin'&&window.atdLigar)atdLigar();
}
function valorHtml(){
 var de=disp.proposta_de,tem=disp.proposta_valor!=null,tot=ped?din(ped.total,ped.currency):'';
 var NOME={cliente:'Cliente',fornecedor:'Fornecedor',admin:'Atendimento'};
 var h='<div class="box" id="valor"><h3>💰 Valor</h3><div class="res" style="margin-top:0">'+
  '<div>Total do pedido<b>'+tot+'</b></div><div>O cliente pede<b>'+din(disp.valor,disp.moeda)+'</b></div>'+
  '<div style="grid-column:1/-1">Proposta atual'+(tem?' ('+NOME[de]+')':'')+'<b>'+(tem?din(disp.proposta_valor,disp.moeda):'Ainda sem proposta')+'</b>'+
  (de==='admin'?'<span>Cliente: '+(disp.aceite_cliente?'✅ aceitou':'⏳ falta')+' · Fornecedor: '+(disp.aceite_fornecedor?'✅ aceitou':'⏳ falta')+'</span>':'')+'</div></div>';
 var alvo=tem?disp.proposta_valor:disp.valor,quem=tem?de:'cliente';
 var jaAceitei=(papel==='cliente'&&de==='admin'&&disp.aceite_cliente)||(papel==='fornecedor'&&de==='admin'&&disp.aceite_fornecedor);
 if(papel!=='admin'&&quem!==papel&&!jaAceitei)h+='<button class="bt v" data-a="aceitar">Aceitar '+din(alvo,disp.moeda)+'</button>';
 h+='<p class="inf">'+(papel==='admin'?'Propor um valor de acordo (o cliente e o fornecedor têm de aceitar)':papel==='cliente'?'Editar o valor que pede (até '+tot+')':'Propor ou editar o seu valor (até '+tot+')')+'</p>'+
  '<input id="pv" type="number" min="0" step="0.01" inputmode="decimal" value="'+esc(PV)+'" placeholder="Valor em '+esc(disp.moeda||'')+'">'+
  '<button class="bt a" id="propor">'+(papel==='admin'?'Propor valor de acordo':'Propor este valor')+'</button>';
 if(papel==='admin')h+='<p class="inf" style="margin-top:14px">⏰ Dar mais dias ao prazo do caso</p><div class="papel" style="margin:6px 0 0">'+[1,3,5,7,15,30].map(function(n){return'<button data-dias="'+n+'">+'+n+'</button>'}).join('')+'</div>';
 return h+'<div class="err" id="vm"></div></div>';
}
function painelAcoes(aberta){
 if(papel==='admin'&&window.ATD&&!ATD.pode)return'';
 var e=disp.estado,h=aberta?valorHtml():'';
 h+='<div class="box" id="acoes">';
 if(papel==='admin'){
  h+='<h3>💬 Falar com as partes</h3><div class="papel" id="para">'+[['todos','Os dois'],['cliente','Só cliente'],['fornecedor','Só fornecedor']].map(function(o){return'<button data-para="'+o[0]+'" class="'+(PARA===o[0]?'on':'')+'">'+o[1]+'</button>'}).join('')+'</div>'+
   '<textarea id="mt" rows="3" maxlength="2000" placeholder="Escreva ao '+({todos:'cliente e ao fornecedor',cliente:'cliente (o fornecedor não vê)',fornecedor:'fornecedor (o cliente não vê)'})[PARA]+'">'+esc(MT)+'</textarea>'+R.html('rp')+
   '<button class="bt a" id="amsg">Enviar mensagem</button><div class="err" id="am2"></div></div>';
  if(!aberta)return h;
  return h+'<div class="box" id="acoes2"><h3>⚖️ Decisão final do Atendimento</h3><textarea id="rt" rows="3" placeholder="Explicação da decisão (opcional)">'+esc(RT)+'</textarea>'+
   '<p class="inf">Valor a devolver ao cliente (só para Dividir)</p><input id="rv" type="number" min="0" step="0.01" inputmode="decimal" value="'+esc(RV)+'">'+
   '<button class="bt v" data-dec="cliente">Cliente tem razão (reembolso de '+din(disp.valor,disp.moeda)+')</button>'+
   '<button class="bt a" data-dec="fornecedor">Fornecedor tem razão</button><button class="bt" data-dec="dividir">Dividir o valor</button><div class="err" id="am"></div></div>';
 }
 h+='<h3>💬 Responder ou juntar provas</h3><textarea id="rt" rows="3" maxlength="2000" placeholder="'+(papel==='fornecedor'&&e==='aberta'?'Explique a sua posição (obrigatório para recusar)':'Escreva uma mensagem')+'">'+esc(RT)+'</textarea>'+R.html('rp');
 h+='<div class="papel" style="margin:12px 0 0">'+[['todos','Para todos'],['atendimento','Só para o Atendimento']].map(function(o){return'<button data-para2="'+o[0]+'" class="'+(PARA2===o[0]?'on':'')+'">'+o[1]+'</button>'}).join('')+'</div>'+
  '<button class="bt l" data-a="mensagem">Enviar mensagem / provas'+(PARA2==='atendimento'?' (privado)':'')+'</button>';
 if(papel==='fornecedor'&&(e==='aberta'||e==='negociacao'))h+='<button class="bt r" data-a="recusar">Recusar com provas (vai para a BBabilônia)</button>';
 if((papel==='cliente'&&(e==='aberta'||e==='negociacao'))||(papel==='fornecedor'&&e==='negociacao'))h+='<button class="bt a" data-a="intervencao">Pedir a intervenção da BBabilônia</button>';
 if(papel==='cliente')h+='<button class="bt l" data-a="cancelar" style="color:#ef4444;border-color:#fecaca">Cancelar a disputa (problema resolvido)</button>';
 return h+'<div class="err" id="am"></div></div>';
}
function guardaR(){var t=$('rt');if(t)RT=t.value;var v=$('rv');if(v)RV=v.value;var mt=$('mt');if(mt)MT=mt.value;var pv=$('pv');if(pv)PV=pv.value}
function ligarAcoes(){
 R.ligar('rp',function(){guardaR();ver();var a=$('acoes');if(a)a.scrollIntoView({block:'start'})},function(t){($('am')||$('am2')).textContent=t});
 document.querySelectorAll('[data-para]').forEach(function(b){b.onclick=function(){guardaR();PARA=b.getAttribute('data-para');ver();var a=$('acoes');if(a)a.scrollIntoView({block:'start'})}});
 document.querySelectorAll('[data-para2]').forEach(function(b){b.onclick=function(){guardaR();PARA2=b.getAttribute('data-para2');ver();var a=$('acoes');if(a)a.scrollIntoView({block:'start'})}});
 var pb=$('propor');if(pb)pb.onclick=async function(){
  guardaR();var m=$('vm'),v=Number(String(PV).replace(',','.')),t=(RT||'').trim();m.textContent='';
  if(String(PV).trim()===''||!(v>=0)||(papel!=='admin'&&v<=0))return m.textContent='Escreva o valor.';
  if(ped&&v>Number(ped.total))return m.textContent='O valor não pode passar o total do pedido.';
  if(!textoOk(t))return m.textContent='O texto tem contactos, links ou redes sociais. Não é permitido.';
  if(!confirm('Propor '+din(v,disp.moeda)+'?'))return;
  pb.disabled=true;
  var r=papel==='admin'?await sb.rpc('disputa_atendente_valor',{p_id:disp.id,p_valor:v,p_texto:t}):
   await sb.rpc('disputa_agir',{p_id:disp.id,p_acao:'propor',p_valor:v,p_texto:t,p_provas:'[]',p_para:'todos',p_como:papel});
  if(r.error){m.textContent=r.error.message;pb.disabled=false;return}PV='';RT='';carregar();
 };
 document.querySelectorAll('[data-dias]').forEach(function(b){b.onclick=async function(){
  var n=+b.getAttribute('data-dias'),m=$('vm');m.textContent='';
  if(!confirm('Dar mais '+n+' dia(s) ao prazo do caso?'))return;
  b.disabled=true;var r=await sb.rpc('disputa_prazo',{p_id:disp.id,p_dias:n,p_texto:''});
  if(r.error){m.textContent=r.error.message;b.disabled=false;return}carregar();
 }});
 var am=$('amsg');if(am)am.onclick=async function(){
  guardaR();var m=$('am2'),t=MT.trim();m.textContent='';
  if(!t&&!R.l.length)return m.textContent='Escreva uma mensagem.';
  am.disabled=true;
  try{var urls=await R.enviar('rp',am);var r=await sb.rpc('disputa_atendente',{p_id:disp.id,p_para:PARA,p_texto:t,p_provas:JSON.stringify(urls)});
   if(r.error)throw new Error(r.error.message);R=new Provas();MT='';carregar()}
  catch(e){m.textContent=e.message||String(e);am.disabled=false;am.textContent='Enviar mensagem'}
 };
 document.querySelectorAll('[data-dec]').forEach(function(b){b.onclick=async function(){
  guardaR();var dec=b.getAttribute('data-dec'),v=Number(String(RV).replace(',','.'))||null,m=$('am');m.textContent='';
  if(dec==='dividir'&&!v)return m.textContent='Escreva o valor a devolver ao cliente.';
  if(!confirm('Confirmar a decisão final? Não pode ser desfeita.'))return;
  bloquear(true);var r=await sb.rpc('decidir_disputa',{p_id:disp.id,p_decisao:dec,p_valor:v,p_nota:RT});
  if(r.error){m.textContent=r.error.message;bloquear(false);return}RT='';RV='';carregar();
 }});
 document.querySelectorAll('[data-a]').forEach(function(b){b.onclick=async function(){
  guardaR();var a=b.getAttribute('data-a'),m=$('am')||$('vm'),t=RT.trim(),v=Number(String(RV).replace(',','.'))||null;m.textContent='';
  if(!textoOk(t))return m.textContent='O texto tem contactos, links ou redes sociais. Não é permitido.';
  if(a==='mensagem'&&!t&&!R.l.length)return m.textContent='Escreva uma mensagem ou junte uma prova.';
  if(a==='recusar'&&t.length<10)return m.textContent='Para recusar, explique porquê (pelo menos 10 letras) e junte provas.';
  var pergunta={aceitar:'Aceitar '+din(disp.proposta_valor!=null?disp.proposta_valor:disp.valor,disp.moeda)+'?'+(disp.proposta_de==='admin'?'':' A disputa fica fechada com este valor.'),propor:'Propor '+din(v,disp.moeda)+' ao cliente?',recusar:'Recusar? A BBabilônia vai analisar e decidir.',
   aceitar_proposta:'Aceitar '+din(disp.proposta_valor,disp.moeda)+'? A disputa fica fechada.',intervencao:'Pedir a intervenção da BBabilônia?',cancelar:'Cancelar a disputa? O dinheiro volta para o fornecedor.'}[a];
  if(pergunta&&!confirm(pergunta))return;
  bloquear(true);
  try{
   var urls=await R.enviar('rp',b);
   var r=await sb.rpc('disputa_agir',{p_id:disp.id,p_acao:a,p_valor:null,p_texto:t,p_provas:JSON.stringify(urls),p_para:a==='mensagem'?PARA2:'todos',p_como:papel});
   if(r.error)throw new Error(r.error.message);
   R=new Provas();RT='';RV='';carregar();
  }catch(e){m.textContent=e.message||String(e);bloquear(false)}
 }});
}
function bloquear(s){document.querySelectorAll('#valor button,#valor input,#acoes button,#acoes textarea,#acoes input,#acoes2 button,#acoes2 textarea,#acoes2 input').forEach(function(x){x.disabled=s})}

/* ---------- Carregar ---------- */
async function carregar(){
 try{await sb.rpc('rever_prazos')}catch(e){}
 var d=null;
 if(DID){var r=await sb.from('disputas').select('*').eq('id',DID).maybeSingle();d=r.data}
 else if(PED){var r2=await sb.from('disputas').select('*').eq('order_id',String(PED)).order('created_at',{ascending:false}).limit(1);d=(r2.data||[])[0]||null;if(d&&d.estado==='cancelada'&&!Q.get('ver'))d=null}
 var pid=d?d.order_id:PED;
 if(pid){var o=await sb.from('orders').select('*').eq('id',pid).maybeSingle();ped=o.data||null;
  if(!ped&&d){var pf=await sb.rpc('pedidos_do_fornecedor');(pf.data||[]).forEach(function(x){if(String(x.id)===String(pid))ped=x})}
  if(!ped&&d){var pa=await sb.rpc('pedido_da_disputa',{p_id:d.id});ped=(pa.data||[])[0]||null}}
 if(!d){
  if(!ped){$('app').innerHTML='<div class="box">Pedido não encontrado.</div>';return}
  formNova();return;
 }
 disp=d;
 var m=await sb.from('disputa_mensagens').select('*').eq('disputa_id',d.id).order('created_at');msgs=m.data||[];
 papeis=[];if(String(d.cliente_id)===eu.id)papeis.push('cliente');if(String(d.vendedor_id)===eu.id)papeis.push('fornecedor');if(window.atdCarregar)await atdCarregar(d);if(window.ATD&&(ATD.pode||ATD.fila))papeis.push('admin');
 if(!papeis.length){$('app').innerHTML='<div class="box">Esta disputa não é da sua conta.'+(window.ATD&&ATD.semCodigo?' Entre primeiro pelo <a href="atendimento.html">Atendimento</a> com o código do email.':'')+'</div>';return}
 if(papeis.indexOf(papel)<0){var pq=Q.get('como');papel=papeis.indexOf(pq)>-1?pq:papeis[0]}
 ver();
}
$('voltar').onclick=function(){if(history.length>1)history.back();else location.href='pedidos.html'};
async function abrir(){
 var s=(await sb.auth.getSession()).data.session;eu=s?s.user:null;
 $('login').classList.toggle('hide',!!eu);$('app').classList.toggle('hide',!eu);
 if(!eu)return;
 if(!PED&&!DID){$('app').innerHTML='<div class="box">Disputa não indicada.</div>';return}
 carregar();
}
$('ent').onclick=async function(){
 var r=await sb.auth.signInWithPassword({email:$('em').value.trim(),password:$('pw').value});
 if(r.error){$('lmsg').textContent='Email ou palavra-passe errados.';return}abrir();
};
abrir();
           

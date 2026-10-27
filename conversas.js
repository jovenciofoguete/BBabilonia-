/* conversas.js — painel dos agentes para as conversas de atendimento */
var sb=supabase.createClient('https://dsfoqoeawvjafypycldz.supabase.co','sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0',window.ATD_AUTH);
function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function quando(d){if(!d)return'';var t=new Date(d),h=new Date(),s=(h-t)/1000;
 if(s<60)return'agora';if(s<3600)return Math.floor(s/60)+' min';if(s<86400&&t.getDate()===h.getDate())return t.toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'});
 return t.toLocaleDateString('pt-PT',{day:'2-digit',month:'short'})+' '+t.toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})}
function din(v,m){return Number(v||0).toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2})+' '+(m||'MZN')}
function arr(x){if(Array.isArray(x))return x;try{var y=JSON.parse(x);return Array.isArray(y)?y:[]}catch(e){return[]}}
function erro(e){var m=(e&&e.message)||String(e||'');return m.replace(/^.*?exception:\s*/i,'')||'Algo falhou.'}
function horas(a,b){return Math.round((new Date(b)-new Date(a))/36e5*10)/10}

var EST={fila:['Na fila',''],atendimento:['Em atendimento','az'],resolvido:['Resolvida','ok'],fechado:['Fechada','no']};
var EU={},aba='minhas',aberto=null,tk=null,relogio=null,modo='cliente',cprov=null,agentes=null,ultimo='',q;

async function iniciar(){
 var s=(await sb.auth.getSession()).data.session;
 if(!s){location.href='atendimento.html';return}
 var r=await sb.rpc('meu_atendimento');EU=r.data||{};
 if(!EU.agente&&!EU.supervisor){$('app').innerHTML='<div class="box vz">Esta conta não tem acesso ao atendimento.<br><a class="bt" href="atendimento.html">Voltar</a></div>';return}
 if(!EU.supervisor&&!EU.codigo){location.href='atendimento.html';return}
 try{await sb.rpc('rever_tickets')}catch(e){}
 rota();
}
function rota(){parar();q=new URLSearchParams(location.search);
 if(q.get('id'))return verConversa(q.get('id'));
 if(q.get('f'))aba=q.get('f');verLista()}
function ir(p){history.pushState({},'',p);rota()}
window.addEventListener('popstate',rota);
function parar(){if(relogio){clearInterval(relogio);relogio=null}}
$('voltar').onclick=function(){if(q&&q.get('id'))return ir('conversas.html?f='+aba);location.href='atendimento.html'};
$('atu').onclick=function(){ultimo='';rota()};
function titulo(t,s){$('tit').innerHTML=esc(t)+'<small>'+esc(s||'')+'</small>'}
function comp(on){$('comp').classList.toggle('hide',!on);document.querySelector('main').style.paddingBottom=on?'210px':'120px'}

/* ---------- Lista ---------- */
function abas(){var L=[['minhas','As minhas'],['fila','Fila']];
 if(EU.chefe)L.push(['todas','Todas em aberto'],['ajuda','🆘 Pedidos de ajuda'],['resolvidas','Resolvidas'],['stats','📊 Avaliações']);
 else L.push(['resolvidas','Resolvidas']);return L}
async function verLista(){comp(false);titulo('💬 Conversas',(EU.nome||EU.email||'')+' · atendimento a clientes e fornecedores');
 $('app').innerHTML='<div class="tabs" id="tabs"></div><div id="lista"><div class="vz">A carregar…</div></div>';
 var r=await sb.from('tickets').select('*').order('ultima_msg_em',{ascending:false}).limit(300);
 if(r.error){$('lista').innerHTML='<div class="box err">'+esc(erro(r.error))+'</div>';return}
 var l=r.data||[],me=String(EU.email||'').toLowerCase(),ab=function(t){return t.estado==='fila'||t.estado==='atendimento'};
 var F={minhas:function(t){return t.atendente_email===me&&ab(t)},fila:function(t){return t.estado==='fila'&&!t.atendente_email},
  todas:ab,ajuda:function(t){return t.ajuda_pedida&&ab(t)},resolvidas:function(t){return!ab(t)&&(EU.chefe||t.atendente_email===me)}};
 if(!F[aba]&&aba!=='stats')aba='minhas';
 $('tabs').innerHTML=abas().map(function(a){var n=F[a[0]]?l.filter(F[a[0]]).length:0,urg=a[0]==='minhas'||a[0]==='fila'||a[0]==='ajuda';
  return'<button data-a="'+a[0]+'" class="'+(a[0]===aba?'on':'')+'">'+a[1]+(urg&&n?'<i>'+n+'</i>':'')+'</button>'}).join('');
 document.querySelectorAll('#tabs button').forEach(function(b){b.onclick=function(){aba=b.dataset.a;history.replaceState({},'','conversas.html?f='+aba);verLista()}});
 if(aba==='stats')return stats(l);
 var v=l.filter(F[aba]);
 if(!v.length){$('lista').innerHTML='<div class="box vz">Nada aqui. 🎉</div>';return}
 $('lista').innerHTML=v.map(function(t){
  var espera=t.ultima_msg_de==='cliente'&&ab(t),h=horas(t.ultima_msg_em,new Date()),urg=espera&&h>=12;
  var sla=t.estado==='atendimento'&&!t.primeira_resposta_em&&t.atribuida_em?Math.max(0,24-horas(t.atribuida_em,new Date())):null;
  return'<button class="tk '+(urg?'urg':espera?'esp':'')+'" data-id="'+t.id+'"><div class="l1"><span>'+quando(t.ultima_msg_em)+'</span><span>'+(t.atendente_email&&t.atendente_email!==me?esc(t.atendente_email.split('@')[0]):'')+'</span></div>'+
   '<b>'+esc(t.assunto)+'</b><span class="est '+(EST[t.estado]||['',''])[1]+'">'+(EST[t.estado]||[t.estado])[0]+'</span>'+
   (espera?'<span class="est r">Cliente à espera</span>':'')+(t.ajuda_pedida&&ab(t)?'<span class="est r">🆘 Ajuda</span>':'')+
   (sla!=null?'<span class="est">⏰ '+Math.round(sla)+' h para responder</span>':'')+
   (t.pedido_id?'<span class="est no">Pedido #'+esc(String(t.pedido_id).slice(0,8))+'</span>':'')+
   (t.avaliacao!=null?'<span class="est">'+(t.avaliacao>0?'👍':'👎')+'</span>':'')+'</button>'}).join('');
 document.querySelectorAll('.tk').forEach(function(b){b.onclick=function(){ir('conversas.html?id='+b.dataset.id)}});
}
function stats(l){var d=Date.now()-30*864e5,A={};
 l.filter(function(t){return t.atendente_email&&new Date(t.created_at)>d}).forEach(function(t){
  var a=A[t.atendente_email]=A[t.atendente_email]||{n:0,res:0,bom:0,mau:0,tr:0,nr:0};a.n++;
  if(t.estado==='resolvido'||t.estado==='fechado')a.res++;if(t.avaliacao>0)a.bom++;if(t.avaliacao<0)a.mau++;
  if(t.primeira_resposta_em&&t.atribuida_em){a.tr+=Math.max(0,horas(t.atribuida_em,t.primeira_resposta_em));a.nr++}});
 var k=Object.keys(A).sort(function(x,y){return A[y].n-A[x].n});
 $('lista').innerHTML='<div class="box"><h3>📊 Últimos 30 dias</h3>'+(k.length?'<table><tr><th>Agente</th><th>Conversas</th><th>Resolvidas</th><th>👍</th><th>👎</th><th>1.ª resposta</th></tr>'+k.map(function(e){var a=A[e];
  return'<tr><td>'+esc(e.split('@')[0])+'</td><td>'+a.n+'</td><td>'+a.res+'</td><td>'+a.bom+'</td><td>'+a.mau+'</td><td>'+(a.nr?(Math.round(a.tr/a.nr*10)/10)+' h':'—')+'</td></tr>'}).join('')+'</table>':'<div class="vz">Ainda sem dados.</div>')+
  '<div class="inf">Contas com muitos 👎 ou respostas lentas: veja as conversas na aba Resolvidas.</div></div>';
}

/* ---------- Conversa ---------- */
async function verConversa(id){
 if(aberto!==id){aberto=id;ultimo='';modo='cliente';cprov=new Provas('pconv');$('ctxt').value='';$('cprov').classList.add('hide');pintarModo()}
 titulo('💬 Conversa','A carregar…');$('app').innerHTML='<div class="box vz">A carregar…</div>';
 await carregar(true);relogio=setInterval(function(){if(!document.hidden)carregar(false)},10000);
}
async function carregar(forcar){
 var a=await sb.from('tickets').select('*').eq('id',aberto).maybeSingle();
 if(a.error||!a.data){$('app').innerHTML='<div class="box vz">Conversa não encontrada ou já não está atribuída a si.<br><button class="bt" onclick="ir(\'conversas.html\')">Ver conversas</button></div>';comp(false);parar();return}
 var R=await Promise.all([sb.from('ticket_mensagens').select('*').eq('ticket_id',aberto).order('created_at').limit(500),
  sb.from('ticket_notas').select('*').eq('ticket_id',aberto).order('created_at').limit(200)]);
 var m=R[0].data||[],n=R[1].data||[],chave=JSON.stringify([a.data.estado,a.data.atendente_email,a.data.avaliacao,a.data.ajuda_pedida,m.length,n.length]);
 if(!forcar&&chave===ultimo)return;ultimo=chave;tk=a.data;
 var p=null;if(tk.pedido_id){var o=await sb.rpc('pedido_do_ticket',{p_id:aberto});p=o.data&&o.data[0]}
 desenhar(m,n,p);
}
function desenhar(m,n,p){var t=tk,me=String(EU.email||'').toLowerCase(),meu=t.atendente_email===me,livre=t.estado==='fila'&&!t.atendente_email;
 var pode=meu||EU.chefe,fim=window.innerHeight+window.scrollY>=document.body.scrollHeight-80;
 titulo('💬 '+t.assunto,(EST[t.estado]||[t.estado])[0]+(t.atendente_email?' · '+t.atendente_email:' · sem agente'));
 var h='<div class="box"><div class="dd"><div>Aberta<b>'+quando(t.created_at)+'</b></div><div>Agente<b>'+esc(t.atendente_email?t.atendente_email.split('@')[0]:'—')+'</b></div>'+
  '<div>Cliente<b>#'+esc(String(t.user_id).slice(0,8))+'</b></div><div>1.ª resposta<b>'+(t.primeira_resposta_em&&t.atribuida_em?Math.max(0,horas(t.atribuida_em,t.primeira_resposta_em))+' h':'ainda não')+'</b></div></div>';
 if(p)h+='<div style="margin-top:8px">'+window.EscolherPedido.cartao(p)+'</div><div class="dd"><div>Pedido<b>#'+esc(String(p.id).slice(0,8))+'</b></div><div>Total<b>'+din(p.total,p.currency)+'</b></div><div>Estado<b>'+esc(p.status||'—')+'</b></div><div>Pagamento<b>'+esc(p.escrow_status||p.payment_status||'—')+'</b></div></div>'+
  (p.customer_email||p.customer_name?'<div class="inf">'+esc([p.customer_name,p.customer_email].filter(Boolean).join(' · '))+'</div>':'')+
  (p.disputa_estado?'<div class="inf">⚠️ Este pedido já tem disputa: '+esc(p.disputa_estado)+'</div>':'');
 h+='<div style="margin-top:8px"><button class="bt l" data-ac="pedidos">📦 Pedidos do cliente</button>';
 if(livre)h+='<button class="bt v" data-ac="pegar">✋ Pegar esta conversa</button>';
 if(pode&&t.estado!=='fechado'){
  if(t.estado!=='resolvido')h+='<button class="bt v" data-ac="resolver">✅ Resolvida</button>';
  if(t.pedido_id&&!(p&&p.disputa_estado))h+='<button class="bt a" data-ac="disputa">⚠️ Sugerir disputa</button>';
  if(!EU.chefe)h+='<button class="bt l" data-ac="ajuda">🆘 Pedir ajuda</button><button class="bt l" data-ac="encaminhar">⬆️ Encaminhar a superior</button><button class="bt l" data-ac="devolver">↩️ Devolver à fila</button>';
  else h+='<button class="bt l" data-ac="passar">👤 Passar a outro agente</button><button class="bt l" data-ac="devolver">↩️ Devolver à fila</button>';
 }
 if(EU.chefe&&!livre&&!meu&&t.estado!=='fechado')h+='<button class="bt" data-ac="assumir">🙋 Assumir eu</button>';
 h+='</div><div class="err" id="amsg"></div><div id="extra"></div></div>';
 if(t.avaliacao!=null)h+='<div class="box inf" style="margin-top:0">Avaliação do cliente: '+(t.avaliacao>0?'👍':'👎')+(t.avaliacao_texto?' — “'+esc(t.avaliacao_texto)+'”':'')+'</div>';
 var tudo=m.map(function(x){x._t='m';return x}).concat(n.map(function(x){x._t='n';return x})).sort(function(a,b){return new Date(a.created_at)-new Date(b.created_at)});
 h+='<div class="msgs">'+tudo.map(function(x){
  if(x._t==='n')return'<div class="m nota">📝 <b>'+esc(x.autor_email==='sistema'?'Sistema':x.autor_email.split('@')[0])+'</b> (só a equipa vê): '+esc(x.texto)+'<small>'+quando(x.created_at)+'</small></div>';
  if(x.autor==='sistema')return'<div class="m sistema">'+esc(x.texto)+'<small>'+quando(x.created_at)+'</small></div>';
  return'<div class="m '+(x.autor==='cliente'?'cliente':'admin')+'">'+(x.acao==='disputa'?'<b>⚠️ Sugestão de disputa</b>\n':'')+esc(x.texto)+window.provasVer(arr(x.provas),esc)+'<small>'+(x.autor==='cliente'?'Cliente · ':'Atendimento · ')+quando(x.created_at)+'</small></div>'}).join('')+'</div>';
 $('app').innerHTML=h;
 comp(pode&&!livre&&t.estado!=='fechado');
 document.querySelectorAll('[data-ac]').forEach(function(b){b.onclick=function(){acao(b.dataset.ac,b)}});
 if(fim||!window.__rolou){window.__rolou=1;window.scrollTo(0,document.body.scrollHeight)}
}
async function rpc(ac,txt,email,provas){var r=await sb.rpc('ticket_agente',{p_id:aberto,p_acao:ac,p_texto:txt||null,p_provas:provas?JSON.stringify(provas):null,p_email:email||null});if(r.error)throw r.error;return r.data}
async function acao(ac,b){var e=$('amsg');e.textContent='';
 if(ac==='encaminhar'||ac==='ajuda'||ac==='passar')return formulario(ac);
 if(ac==='pedidos'){b.disabled=true;var r=await sb.rpc('pedidos_do_cliente_ticket',{p_id:aberto});b.disabled=false;if(r.error){e.textContent=erro(r.error);return}
  var pode=tk.atendente_email===String(EU.email||'').toLowerCase()||EU.chefe;
  return window.EscolherPedido.abrir({titulo:'📦 Pedidos deste cliente',lista:r.data||[],atual:tk.pedido_id,botao:pode&&tk.estado!=='fechado'?'🔗 Ligar a esta conversa':null,
   ao:async function(p){var x=await sb.rpc('ticket_pedido',{p_id:aberto,p_acao:'agente',p_pedido:String(p.id),p_texto:null});if(x.error)throw x.error;ultimo='';await carregar(true)}})}
 var msg={resolver:'Marcar esta conversa como resolvida? O cliente pode reabri-la durante 7 dias.',devolver:'Devolver esta conversa à fila? Outro agente vai ficar com ela.',
  disputa:'Enviar ao cliente o botão para abrir disputa deste pedido?',assumir:'Ficar com esta conversa?'}[ac];
 if(msg&&!confirm(msg))return;
 b.disabled=true;
 try{if(ac==='pegar')await rpc('pegar');else if(ac==='resolver')await rpc('resolver');else if(ac==='disputa')await rpc('disputa');
  else if(ac==='devolver')await rpc('passar',null,null);else if(ac==='assumir')await rpc('passar',null,EU.email);
  ultimo='';await carregar(true);if(ac==='devolver'&&!EU.chefe)ir('conversas.html?f=minhas');
 }catch(x){e.textContent=erro(x);b.disabled=false}
}
async function formulario(ac){var x=$('extra'),h='';
 if(ac==='passar'){if(!agentes){var r=await sb.from('agentes').select('email,nome,nivel,ativo').eq('ativo',true).order('nome');agentes=r.data||[]}
  h='<label class="inf">Passar a:</label><select id="fem">'+agentes.filter(function(a){return a.email!==tk.atendente_email}).map(function(a){return'<option value="'+esc(a.email)+'">'+esc(a.nome||a.email)+(a.nivel==='superior'?' (superior)':'')+'</option>'}).join('')+'</select><textarea id="ftxt" rows="2" style="margin-top:6px" placeholder="Nota para o agente (opcional)"></textarea>'}
 else if(ac==='encaminhar'){var s=await sb.rpc('lista_superiores');var l=s.data||[];
  h='<label class="inf">Encaminhar a:</label><select id="fem"><option value="">O superior mais livre</option>'+l.map(function(a){return'<option value="'+esc(a.email)+'">'+esc(a.nome||a.email)+'</option>'}).join('')+'</select><textarea id="ftxt" rows="3" style="margin-top:6px" placeholder="Explique porque encaminha (obrigatório)"></textarea>'}
 else h='<textarea id="ftxt" rows="3" placeholder="Em que precisa de ajuda? O superior vê nas notas internas."></textarea>';
 x.innerHTML='<div style="margin-top:10px">'+h+'<button class="bt" id="fok">Confirmar</button><button class="bt l" id="fno">Cancelar</button></div>';
 $('fno').onclick=function(){x.innerHTML=''};
 $('fok').onclick=async function(){var b=this,t=$('ftxt').value.trim(),em=$('fem')?$('fem').value:null;b.disabled=true;$('amsg').textContent='';
  try{if(ac==='passar'){await rpc('passar',null,em);if(t)try{await rpc('nota','Para '+em+': '+t)}catch(z){}}
   else if(ac==='encaminhar'){var v=await rpc('encaminhar',t,em);alert('Encaminhado a '+v+'.');return ir('conversas.html?f=minhas')}
   else await rpc('ajuda',t);
   ultimo='';await carregar(true)}catch(z){$('amsg').textContent=erro(z);b.disabled=false}}
}

/* ---------- Escrever ---------- */
function pintarModo(){$('mcli').classList.toggle('on',modo==='cliente');$('mnota').classList.toggle('on',modo==='nota');
 $('ctxt').placeholder=modo==='nota'?'Nota interna — o cliente não vê':'Escreva a resposta ao cliente';
 $('clip').style.display=modo==='nota'?'none':'';$('rap').style.display=modo==='nota'?'none':'';
 if(modo==='nota')$('cprov').classList.add('hide')}
$('mcli').onclick=function(){modo='cliente';pintarModo()};$('mnota').onclick=function(){modo='nota';pintarModo()};
$('rap').innerHTML='<button id="rpb">📚 Respostas prontas</button><button id="rpp">📦 Pedir ao cliente o pedido</button>';
$('rpb').onclick=function(){window.RespostasProntas.abrir(sb,{chefe:EU.chefe,ao:function(r){var c=$('ctxt'),nm=String(EU.nome||'').split(' ')[0]||'da equipa BBabilônia';
 var t=r.texto.replace(/\{agente\}/g,nm).replace(/\{pedido\}/g,tk&&tk.pedido_id?'#'+String(tk.pedido_id).slice(0,8):'em causa');
 c.value=c.value?c.value+'\n\n'+t:t;c.oninput();
 if(r.imagens.length){r.imagens.forEach(function(u){cprov.addUrl(u)});$('cprov').classList.remove('hide');desenharProvas()}c.focus()}})};
$('rpp').onclick=async function(){var b=this;if(!confirm('Enviar ao cliente o botão para escolher o pedido em causa?'))return;b.disabled=true;
 var r=await sb.rpc('ticket_pedido',{p_id:aberto,p_acao:'pedir',p_pedido:null,p_texto:$('ctxt').value.trim()||null});b.disabled=false;
 if(r.error){$('cmsg').textContent=erro(r.error);return}$('ctxt').value='';ultimo='';carregar(true)};
function desenharProvas(){$('cprov').innerHTML=cprov.html();cprov.ligar(desenharProvas,function(m){$('cmsg').textContent=m})}
$('clip').onclick=function(){var c=$('cprov');c.classList.toggle('hide');if(!c.classList.contains('hide'))desenharProvas()};
$('ctxt').oninput=function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,140)+'px'};
$('cenv').onclick=async function(){var b=this,t=$('ctxt').value.trim();$('cmsg').textContent='';
 if(modo==='nota'){if(t.length<2)return;b.disabled=true;try{await rpc('nota',t);$('ctxt').value='';ultimo='';await carregar(true)}catch(e){$('cmsg').textContent=erro(e)}b.disabled=false;return}
 if(!t&&!cprov.l.length)return;
 if(t&&window.FiltroContactos){var f=window.FiltroContactos.verificar(t);if(!f.ok){$('cmsg').textContent=f.motivo;return}}
 b.disabled=true;
 try{var s=(await sb.auth.getSession()).data.session,urls=await cprov.enviar(sb,s.user.id,null);
  await rpc('mensagem',t,null,urls);
  $('ctxt').value='';$('ctxt').style.height='';cprov=new Provas('pconv');$('cprov').classList.add('hide');$('cprov').innerHTML='';
  ultimo='';await carregar(true);window.scrollTo(0,document.body.scrollHeight);
 }catch(e){$('cmsg').textContent=erro(e)}
 b.disabled=false};

iniciar();
        

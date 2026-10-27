/* disputa-a.js — BBabilônia: provas (fotos/vídeos) e abrir disputa */
var U='https://dsfoqoeawvjafypycldz.supabase.co',K='sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0',ADMIN='jovenciofoguete1904@gmail.com';
var sb=supabase.createClient(U,K);
function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function arr(x){if(typeof x==='string'){try{x=JSON.parse(x)}catch(e){x=[]}}return Array.isArray(x)?x:[]}
function din(v,m){return Number(v||0).toLocaleString('pt-PT',{maximumFractionDigits:2})+' '+(m||'')}
function eVideo(u){return /\.(mp4|mov|webm|3gp|m4v)(\?|$)/i.test(u)}
var Q=new URLSearchParams(location.search),PED=Q.get('pedido'),DID=Q.get('id');
var eu=null,ped=null,disp=null,msgs=[],papeis=[],papel='';
var MOTIVOS=[['Não recebi','O pacote não chegou'],['Diferente da descrição ou fotos','Não é o que estava no anúncio'],['Danificado','Chegou partido ou estragado'],['Faltam peças ou quantidade','Veio menos do que comprei'],['Tamanho ou cor errados','Não é o tamanho ou a cor que escolhi'],['Falsificado','Não é original']];
var PEDE={reembolso_total:['Reembolso total','Devolvem-me todo o valor'],reembolso_parcial:['Reembolso parcial','Fico com o produto e devolvem-me uma parte'],devolucao:['Devolver o produto','Envio o produto de volta e recebo o dinheiro']};
var FINAL={fornecedor_aceitou:'O fornecedor aceitou',acordo:'Acordo entre as partes',ganha_cliente:'A favor do cliente',ganha_fornecedor:'A favor do fornecedor',dividida:'Valor dividido',cancelada:'Cancelada pelo cliente'};
var ACAO={abrir:'Abriu a disputa',mensagem:'Nova mensagem / prova',propor:'Propôs outro valor',aceitar:'Aceitou o pedido',recusar:'Recusou',aceitar_proposta:'Aceitou a proposta',intervencao:'Pediu a intervenção da BBabilônia',cancelar:'Cancelou',nota:'Nota do Atendimento',prazo:'Deu mais dias ao prazo',final:'Decisão final'};
var QUEM={cliente:['Cliente','🛒'],fornecedor:['Fornecedor','🏪'],admin:['Atendimento BBabilônia','🎧'],sistema:['BBabilônia','⚖️']};
var MAX_VIDEO_SEG=60,MAX_VIDEO_MB=100,MAX_PROVAS=6;

/* ---------- Provas (fotos e vídeos) com envio rápido e barra de progresso ---------- */
function Provas(){this.l=[]}
Provas.prototype.html=function(id){
 return'<div class="fotos">'+this.l.map(function(x,j){return'<div>'+(x.video?'<video src="'+x.prev+'" muted playsinline></video><span class="du">'+Math.round(x.seg)+'s</span>':'<img src="'+x.prev+'" alt="">')+'<button class="x" data-rm="'+j+'" aria-label="Tirar">×</button></div>'}).join('')+
  (this.l.length<MAX_PROVAS?'<label class="add"><span>📷</span>Foto ou vídeo<input type="file" accept="image/jpeg,image/png,image/webp,video/*" hidden id="'+id+'"></label>':'')+'</div>'+
  '<p class="inf" id="'+id+'-inf">Fotos e vídeos de até 1 minuto. Sem contactos nas imagens.</p><div class="prog" id="'+id+'-p"><i></i></div>';
};
Provas.prototype.ligar=function(id,redesenhar,erro){
 var me=this;
 document.querySelectorAll('[data-rm]').forEach(function(b){b.onclick=function(){me.l.splice(+b.getAttribute('data-rm'),1);redesenhar()}});
 var fi=$(id);if(!fi)return;
 fi.onchange=async function(){
  var f=this.files&&this.files[0];this.value='';if(!f)return;erro('');
  var inf=$(id+'-inf');
  if(/^video\//.test(f.type)){
   if(f.size>MAX_VIDEO_MB*1048576){erro('O vídeo é grande demais (máximo '+MAX_VIDEO_MB+' MB).');return}
   inf.textContent='A ver a duração do vídeo…';
   var seg=await duracao(f);
   if(!seg){erro('Não foi possível ler este vídeo. Tente gravar em MP4.');inf.textContent='';return}
   if(seg>MAX_VIDEO_SEG+0.5){erro('O vídeo tem '+Math.round(seg)+' segundos. O máximo é 1 minuto.');inf.textContent='';return}
   me.l.push({file:f,prev:URL.createObjectURL(f),video:true,seg:seg});redesenhar();return;
  }
  if(!window.FiltroImagem){erro('Não foi possível verificar a imagem.');return}
  inf.textContent='A verificar a imagem…';
  var r=await window.FiltroImagem.verificar(f,function(t){inf.textContent=t});
  if(!r.ok){erro(r.motivo);inf.textContent='';return}
  me.l.push({file:f,prev:URL.createObjectURL(f)});redesenhar();
 };
};
Provas.prototype.enviar=async function(id,botao){
 var urls=[],tok=(await sb.auth.getSession()).data.session.access_token,bar=$(id+'-p');
 var total=this.l.reduce(function(t,x){return t+x.file.size},0),feito=0;
 if(bar&&this.l.length){bar.style.display='block'}
 for(var j=0;j<this.l.length;j++){
  var f=this.l[j].file,ext=(f.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
  var cam=eu.id+'/disputa-'+Date.now()+'-'+j+'.'+ext;
  if(botao)botao.textContent='A enviar '+(j+1)+' de '+this.l.length+'…';
  await envio(cam,f,tok,function(p){if(bar)bar.firstChild.style.width=Math.round((feito+p*f.size)*100/total)+'%'});
  feito+=f.size;
  urls.push(U+'/storage/v1/object/public/produtos/'+cam.split('/').map(encodeURIComponent).join('/'));
 }
 return urls;
};
function duracao(f){return new Promise(function(ok){var v=document.createElement('video'),u=URL.createObjectURL(f),t=setTimeout(function(){ok(0)},15000);v.preload='metadata';v.muted=true;
 v.onloadedmetadata=function(){clearTimeout(t);var d=v.duration;URL.revokeObjectURL(u);ok(isFinite(d)?d:0)};v.onerror=function(){clearTimeout(t);ok(0)};v.src=u})}
function envio(cam,f,tok,prog){return new Promise(function(ok,falha){
 var x=new XMLHttpRequest();x.open('POST',U+'/storage/v1/object/produtos/'+cam.split('/').map(encodeURIComponent).join('/'));
 x.setRequestHeader('Authorization','Bearer '+tok);x.setRequestHeader('apikey',K);x.setRequestHeader('x-upsert','false');x.setRequestHeader('Content-Type',f.type||'application/octet-stream');
 x.upload.onprogress=function(e){if(e.lengthComputable)prog(e.loaded/e.total)};
 x.onload=function(){if(x.status>=200&&x.status<300){prog(1);ok()}else{var m='';try{m=JSON.parse(x.responseText).message}catch(e){}falha(new Error('O ficheiro não foi enviado'+(m?': '+m:'.')))}};
 x.onerror=function(){falha(new Error('Sem ligação à internet. Tente outra vez.'))};
 x.send(f);
})}
function provasVer(l){return l.length?'<div class="fotos">'+l.map(function(u){return eVideo(u)?'<div><video src="'+esc(u)+'" controls playsinline preload="metadata"></video></div>':'<div><a href="'+esc(u)+'" target="_blank"><img loading="lazy" src="'+esc(u)+'" alt=""></a></div>'}).join('')+'</div>':''}
function textoOk(t){return!t||!window.FiltroContactos||window.FiltroContactos.verificar(t).ok}

/* ---------- Abrir disputa ---------- */
var NOVA={motivo:'',pede:'',valor:'',texto:'',provas:new Provas()};
function formNova(){
 $('tit').textContent='⚠️ Abrir disputa';
 var h=resumoPedido()+
 '<div class="box">'+fasesHtml('nova')+'<div class="vez"><b>Antes de abrir</b>Fale primeiro com o fornecedor no chat. Se não resolver, abra a disputa: o dinheiro fica congelado até haver decisão.</div></div>'+
 '<div class="box"><h3>1. Qual é o problema?</h3>'+MOTIVOS.map(function(m){return'<label class="op'+(NOVA.motivo===m[0]?' on':'')+'"><input type="radio" name="mo" value="'+esc(m[0])+'"'+(NOVA.motivo===m[0]?' checked':'')+'><div><b>'+esc(m[0])+'</b><small>'+esc(m[1])+'</small></div></label>'}).join('')+'</div>'+
 '<div class="box"><h3>2. O que pretende?</h3>'+Object.keys(PEDE).map(function(k){return'<label class="op'+(NOVA.pede===k?' on':'')+'"><input type="radio" name="pe" value="'+k+'"'+(NOVA.pede===k?' checked':'')+'><div><b>'+PEDE[k][0]+'</b><small>'+PEDE[k][1]+'</small></div></label>'}).join('')+
 '<div class="'+(NOVA.pede==='reembolso_parcial'?'':'hide')+'"><p class="inf">Valor a devolver (máximo '+din(ped.total,ped.currency)+')</p><input id="valor" type="number" min="1" step="0.01" inputmode="decimal" value="'+esc(NOVA.valor)+'"></div></div>'+
 '<div class="box"><h3>3. Explique o que aconteceu</h3><textarea id="texto" rows="4" maxlength="2000" placeholder="Conte com detalhe o problema">'+esc(NOVA.texto)+'</textarea>'+
 '<h3 style="margin-top:14px">4. Provas '+(NOVA.motivo&&NOVA.motivo!=='Não recebi'?'(obrigatório)':'')+'</h3>'+NOVA.provas.html('fn')+
 '<button class="bt" id="abrir">Abrir disputa</button><div class="err" id="msg"></div>'+
 '<p class="inf">O fornecedor tem 3 dias para responder. Se não responder, recebe o reembolso automaticamente.</p></div>';
 $('app').innerHTML=h;
 function guarda(){NOVA.texto=$('texto').value;var v=$('valor');if(v)NOVA.valor=v.value}
 document.querySelectorAll('input[name=mo]').forEach(function(r){r.onchange=function(){guarda();NOVA.motivo=r.value;formNova()}});
 document.querySelectorAll('input[name=pe]').forEach(function(r){r.onchange=function(){guarda();NOVA.pede=r.value;formNova()}});
 NOVA.provas.ligar('fn',function(){guarda();formNova()},function(t){$('msg').textContent=t});
 $('abrir').onclick=async function(){
  var b=this,m=$('msg');guarda();m.textContent='';
  if(!NOVA.motivo)return m.textContent='Escolha qual é o problema.';
  if(!NOVA.pede)return m.textContent='Escolha o que pretende.';
  var val=NOVA.pede==='reembolso_parcial'?Number(String(NOVA.valor).replace(',','.')):null;
  if(NOVA.pede==='reembolso_parcial'&&(!val||val<=0||val>Number(ped.total)))return m.textContent='Escreva um valor válido, até '+din(ped.total,ped.currency)+'.';
  if(NOVA.texto.trim().length<10)return m.textContent='Explique o problema com pelo menos 10 letras.';
  if(!textoOk(NOVA.texto))return m.textContent='O texto tem contactos, links ou redes sociais. Não é permitido.';
  if(NOVA.motivo!=='Não recebi'&&!NOVA.provas.l.length)return m.textContent='Adicione pelo menos uma foto ou vídeo como prova.';
  b.disabled=true;
  try{
   var urls=await NOVA.provas.enviar('fn',b);b.textContent='A abrir…';
   var r=await sb.rpc('abrir_disputa',{p_pedido:String(ped.id),p_motivo:NOVA.motivo,p_pedido_tipo:NOVA.pede,p_valor:val,p_descricao:NOVA.texto.trim(),p_provas:JSON.stringify(urls)});
   if(r.error)throw new Error(r.error.message);
   DID=r.data;history.replaceState({},'','disputa.html?id='+encodeURIComponent(DID));carregar();
  }catch(e){m.textContent=e.message||String(e);b.disabled=false;b.textContent='Abrir disputa'}
 };
}

          

/* provas-envio.js — BBabilônia
   Fotos e vídeos (até 1 minuto) para conversas de atendimento.
   Fotos verificadas pelo filtro de imagens (sem contactos/QR). Envio rápido com barra de progresso. */
(function(){
 var U='https://dsfoqoeawvjafypycldz.supabase.co',K='sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
 var MAX_SEG=60,MAX_MB=100,MAX=6;
 function g(i){return document.getElementById(i)}
 function duracao(f){return new Promise(function(ok){var v=document.createElement('video'),u=URL.createObjectURL(f),t=setTimeout(function(){ok(0)},15000);v.preload='metadata';v.muted=true;
  v.onloadedmetadata=function(){clearTimeout(t);var d=v.duration;URL.revokeObjectURL(u);ok(isFinite(d)?d:0)};v.onerror=function(){clearTimeout(t);ok(0)};v.src=u})}
 function envio(cam,f,tok,prog){return new Promise(function(ok,falha){
  var x=new XMLHttpRequest();x.open('POST',U+'/storage/v1/object/produtos/'+cam.split('/').map(encodeURIComponent).join('/'));
  x.setRequestHeader('Authorization','Bearer '+tok);x.setRequestHeader('apikey',K);x.setRequestHeader('x-upsert','false');x.setRequestHeader('Content-Type',f.type||'application/octet-stream');
  x.upload.onprogress=function(e){if(e.lengthComputable)prog(e.loaded/e.total)};
  x.onload=function(){if(x.status>=200&&x.status<300){prog(1);ok()}else{var m='';try{m=JSON.parse(x.responseText).message}catch(e){}falha(new Error('O ficheiro não foi enviado'+(m?': '+m:'.')))}};
  x.onerror=function(){falha(new Error('Sem ligação à internet. Tente outra vez.'))};x.send(f)})}
 function Provas(id,op){this.id=id;this.l=[];this.op=op||{}}
 Provas.prototype.addUrl=function(u){if(this.l.length<MAX&&!this.l.some(function(x){return x.url===u}))this.l.push({url:u,prev:u,video:/\.(mp4|mov|webm|3gp|m4v)(\?|$)/i.test(u),seg:0})};
 Provas.prototype.html=function(){var id=this.id;
  return'<div class="pv-l">'+this.l.map(function(x,j){return'<div class="pv-i">'+(x.video?'<video src="'+x.prev+'" muted playsinline></video>'+(x.seg?'<span>'+Math.round(x.seg)+'s</span>':''):'<img src="'+x.prev+'" alt="">')+'<button type="button" data-pvrm="'+id+':'+j+'" aria-label="Tirar">×</button></div>'}).join('')+
   (this.l.length<MAX?'<label class="pv-add">📷<small>Foto/vídeo</small><input type="file" accept="image/jpeg,image/png,image/webp,video/*" hidden id="'+id+'"></label>':'')+'</div>'+
   '<div class="pv-inf" id="'+id+'-inf"></div><div class="pv-bar" id="'+id+'-p"><i></i></div>'};
 Provas.prototype.ligar=function(redesenhar,erro){var me=this,id=this.id;
  document.querySelectorAll('[data-pvrm^="'+id+':"]').forEach(function(b){b.onclick=function(){me.l.splice(+b.getAttribute('data-pvrm').split(':')[1],1);redesenhar()}});
  var fi=g(id);if(!fi)return;
  fi.onchange=async function(){var f=this.files&&this.files[0];this.value='';if(!f)return;erro('');var inf=g(id+'-inf');
   if(/^video\//.test(f.type)){
    if(f.size>MAX_MB*1048576)return erro('O vídeo é grande demais (máximo '+MAX_MB+' MB).');
    inf.textContent='A ver a duração do vídeo…';var s=await duracao(f);inf.textContent='';
    if(!s)return erro('Não foi possível ler este vídeo. Grave em MP4.');
    if(s>MAX_SEG+0.5)return erro('O vídeo tem '+Math.round(s)+' segundos. O máximo é 1 minuto.');
    me.l.push({file:f,prev:URL.createObjectURL(f),video:true,seg:s});return redesenhar()}
   if(me.op.semFiltro){me.l.push({file:f,prev:URL.createObjectURL(f)});return redesenhar()}
   if(!window.FiltroImagem)return erro('Não foi possível verificar a imagem.');
   inf.textContent='A verificar a imagem…';var r=await window.FiltroImagem.verificar(f,function(t){inf.textContent=t});inf.textContent='';
   if(!r.ok)return erro(r.motivo);
   me.l.push({file:f,prev:URL.createObjectURL(f)});redesenhar()}};
 Provas.prototype.enviar=async function(cliente,uid,botao){
  if(!this.l.length)return[];
  var tok=(await cliente.auth.getSession()).data.session.access_token,bar=g(this.id+'-p'),tot=this.l.reduce(function(t,x){return t+(x.file?x.file.size:0)},0)||1,feito=0,urls=[];
  if(bar)bar.style.display='block';
  for(var j=0;j<this.l.length;j++){if(this.l[j].url){urls.push(this.l[j].url);continue}var f=this.l[j].file,ext=(f.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
   var cam=uid+'/'+(this.op.prefixo||'ajuda')+'-'+Date.now()+'-'+j+'.'+ext;if(botao)botao.textContent='A enviar '+(j+1)+' de '+this.l.length+'…';
   await envio(cam,f,tok,function(p){if(bar)bar.firstChild.style.width=Math.round((feito+p*f.size)*100/tot)+'%'});feito+=f.size;
   urls.push(U+'/storage/v1/object/public/produtos/'+cam.split('/').map(encodeURIComponent).join('/'))}
  return urls};
 window.Provas=Provas;
 window.provasVer=function(l,esc){l=Array.isArray(l)?l:[];return l.length?'<div class="pv-l">'+l.map(function(u){return /\.(mp4|mov|webm|3gp|m4v)(\?|$)/i.test(u)?'<div class="pv-i"><video src="'+esc(u)+'" controls playsinline preload="metadata"></video></div>':'<div class="pv-i"><a href="'+esc(u)+'" target="_blank"><img loading="lazy" src="'+esc(u)+'" alt=""></a></div>'}).join('')+'</div>':''};
 var css=document.createElement('style');
 css.textContent='.pv-l{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.pv-i{position:relative}.pv-i img,.pv-i video{width:84px;height:84px;object-fit:cover;border-radius:12px;background:#000;display:block}'+
  '.pv-i button{position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;width:22px;height:22px;border-radius:50%;border:0;font-size:14px;line-height:22px;padding:0}'+
  '.pv-i span{position:absolute;bottom:4px;right:4px;background:#000a;color:#fff;font-size:11px;padding:1px 5px;border-radius:6px}'+
  '.pv-add{width:84px;height:84px;border:2px dashed #94a3b8;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:22px;color:#64748b;cursor:pointer}.pv-add small{font-size:11px}'+
  '.pv-inf{font-size:13px;color:#64748b;margin-top:4px;min-height:2px}.pv-bar{height:7px;border-radius:5px;background:#e2e8f0;overflow:hidden;margin-top:6px;display:none}.pv-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#10b981,#0ea5e9);transition:width .2s}';
 document.head.appendChild(css);
})();
   

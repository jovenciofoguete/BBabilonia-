/* foto-ampliar.js \u2014 BBabil\u00f4nia
   Toque numa foto do produto para a ver em ecr\u00e3 inteiro: deslizar entre fotos,
   tocar duas vezes para ampliar e bot\u00e3o "Guardar foto" (funciona tamb\u00e9m dentro de apps). */
(function(){
 if(window.__bbFotoAmpliar)return;window.__bbFotoAmpliar=1;
 var css=document.createElement('style');
 css.textContent='.fa-f{position:fixed;inset:0;z-index:99999;background:#000;display:flex;flex-direction:column}'+
  '.fa-t{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;color:#fff;font:600 15px system-ui,sans-serif}'+
  '.fa-t button{border:0;background:rgba(255,255,255,.15);color:#fff;height:38px;min-width:38px;border-radius:19px;font:600 14px system-ui,sans-serif;padding:0 12px;margin-left:8px}'+
  '.fa-s{flex:1;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}.fa-s::-webkit-scrollbar{display:none}'+
  '.fa-i{flex:0 0 100%;scroll-snap-align:center;overflow:auto;display:flex;align-items:center;justify-content:center}'+
  '.fa-i img{width:100%;height:100%;object-fit:contain;display:block}.fa-i.z{display:block}.fa-i.z img{width:250%;height:auto}'+
  '.fa-s{padding-bottom:env(safe-area-inset-bottom,0px)}';
 document.head.appendChild(css);
 function fotos(){var l=[];document.querySelectorAll('#galeria img').forEach(function(i){if(i.src&&l.indexOf(i.src)<0)l.push(i.src)});return l}
 function guardar(u,b){var t=b.textContent;b.textContent='A preparar\u2026';
  var nome='bbabilonia-'+Date.now()+'.jpg';
  function baixar(){var a=document.createElement('a');a.href=u+(/supabase\.co\/storage/.test(u)?(u.indexOf('?')<0?'?':'&')+'download='+nome:'');a.download=nome;a.target='_blank';document.body.appendChild(a);a.click();a.remove()}
  fetch(u).then(function(r){return r.blob()}).then(function(bl){
   var f=new File([bl],nome,{type:bl.type||'image/jpeg'});
   if(navigator.share&&navigator.canShare&&navigator.canShare({files:[f]}))return navigator.share({files:[f],title:'Foto do produto'});
   baixar()}).catch(function(e){if(!e||e.name!=='AbortError')baixar()}).then(function(){b.textContent=t})}
 function abrir(src){
  var l=fotos();if(l.indexOf(src)<0)l.unshift(src);var n=l.indexOf(src);
  var f=document.createElement('div');f.className='fa-f';
  f.innerHTML='<div class="fa-t"><span class="fa-n"></span><span><button type="button" class="fa-g">\u2b07 Salvar</button><button type="button" class="fa-x" aria-label="Fechar">\u2715</button></span></div><div class="fa-s">'+
   l.map(function(u){return'<div class="fa-i"><img src="'+u.replace(/"/g,'&quot;')+'" alt=""></div>'}).join('')+
   '</div>';
  document.body.appendChild(f);document.body.style.overflow='hidden';
  var s=f.querySelector('.fa-s'),num=f.querySelector('.fa-n');
  function atual(){return Math.round(s.scrollLeft/(s.clientWidth||1))}
  function pinta(){num.textContent=(atual()+1)+' / '+l.length}
  s.scrollLeft=n*s.clientWidth;pinta();s.addEventListener('scroll',pinta);
  function fechar(){f.remove();document.body.style.overflow=''}
  f.querySelector('.fa-x').onclick=fechar;
  f.querySelector('.fa-g').onclick=function(){guardar(l[atual()],this)};
  var ult=0;f.querySelectorAll('.fa-i').forEach(function(d){d.addEventListener('click',function(){var h=Date.now();if(h-ult<320){d.classList.toggle('z');s.style.scrollSnapType=d.classList.contains('z')?'none':''}ult=h})});
 }
 document.addEventListener('click',function(e){var i=e.target.closest&&e.target.closest('#galeria img');if(!i)return;e.preventDefault();e.stopPropagation();abrir(i.src)},true);
 var st=document.createElement('style');st.textContent='#galeria img{cursor:zoom-in}';document.head.appendChild(st);
})();
  

/* respostas-prontas.js — biblioteca de respostas formais para os agentes */
(function(){
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function arr(x){if(typeof x==='string'){try{x=JSON.parse(x)}catch(e){x=[]}}return Array.isArray(x)?x:[]}
 var cache=null;
 var css=document.createElement('style');
 css.textContent='.rp-f{position:fixed;inset:0;background:#0008;z-index:50;display:flex;align-items:flex-end;justify-content:center}'+
  '.rp-p{background:var(--fundo,#f3f0fb);color:var(--texto,#1b1740);width:100%;max-width:720px;max-height:88vh;border-radius:20px 20px 0 0;display:flex;flex-direction:column}'+
  '.rp-h{display:flex;align-items:center;gap:8px;padding:14px 14px 8px}.rp-h b{flex:1;font-size:16px}.rp-h button,.rp-h a{border:0;background:var(--papel,#fff);color:inherit;height:36px;min-width:36px;padding:0 10px;border-radius:18px;font:inherit;font-size:14px;text-decoration:none;display:flex;align-items:center}'+
  '.rp-q{margin:0 14px 8px;padding:11px;border:2px solid var(--linha,#e7e3f3);border-radius:12px;font:inherit;font-size:16px;background:var(--papel,#fff);color:inherit}'+
  '.rp-a{display:flex;gap:6px;overflow-x:auto;padding:0 14px 8px;flex:none}.rp-a button{flex:none;border:0;border-radius:18px;padding:8px 12px;font:inherit;font-size:13px;font-weight:700;background:var(--papel,#fff);color:var(--suave,#6b6590)}.rp-a button.on{background:#0f766e;color:#fff}'+
  '.rp-l{overflow-y:auto;padding:4px 14px calc(16px + env(safe-area-inset-bottom,0px))}'+
  '.rp-c{display:block;width:100%;text-align:left;border:0;font:inherit;color:inherit;background:var(--papel,#fff);border-radius:14px;padding:12px;margin-bottom:8px}'+
  '.rp-c b{display:block;font-size:14.5px}.rp-c small{display:block;color:var(--suave,#6b6590);font-size:12.5px;margin-top:3px;white-space:pre-line;max-height:3.9em;overflow:hidden}'+
  '.rp-c i{font-style:normal;font-size:11.5px;font-weight:800;background:#ccfbf1;color:#115e59;border-radius:10px;padding:1px 8px;margin-right:4px}.rp-v{text-align:center;color:var(--suave,#6b6590);padding:26px 0}';
 document.head.appendChild(css);
 window.RespostasProntas={
  limpar:function(){cache=null},
  abrir:async function(sb,o){var cat='Todas',busca='',f=document.createElement('div');f.className='rp-f';
   f.innerHTML='<div class="rp-p"><div class="rp-h"><b>📚 Respostas prontas</b>'+(o.chefe?'<a href="respostas.html">✏️ Gerir</a>':'')+'<button type="button" aria-label="Fechar">✕</button></div>'+
    '<input class="rp-q" type="search" placeholder="Procurar resposta (ex.: rastreamento, disputa)"><div class="rp-a"></div><div class="rp-l"><div class="rp-v">A carregar…</div></div></div>';
   document.body.appendChild(f);document.body.style.overflow='hidden';
   function fechar(){f.remove();document.body.style.overflow=''}
   f.onclick=function(e){if(e.target===f)fechar()};f.querySelector('.rp-h button').onclick=fechar;
   f.querySelector('.rp-q').oninput=function(){busca=this.value.toLowerCase().trim();pintar()};
   if(!cache){var r=await sb.from('respostas_prontas').select('*').eq('ativo',true).order('usos',{ascending:false}).order('titulo');
    if(r.error){f.querySelector('.rp-l').innerHTML='<div class="rp-v">'+esc(r.error.message)+'</div>';return}cache=r.data||[]}
   function pintar(){var cats=['Todas'];cache.forEach(function(x){if(cats.indexOf(x.categoria)<0)cats.push(x.categoria)});
    f.querySelector('.rp-a').innerHTML=cats.map(function(c){return'<button type="button" data-c="'+esc(c)+'" class="'+(c===cat?'on':'')+'">'+esc(c)+'</button>'}).join('');
    f.querySelectorAll('.rp-a button').forEach(function(b){b.onclick=function(){cat=b.dataset.c;pintar()}});
    var v=cache.filter(function(x){return(cat==='Todas'||x.categoria===cat)&&(!busca||(x.titulo+' '+x.texto+' '+x.categoria).toLowerCase().indexOf(busca)>-1)});
    f.querySelector('.rp-l').innerHTML=v.length?v.map(function(x){var n=arr(x.imagens).length;
     return'<button type="button" class="rp-c" data-r="'+x.id+'"><b>'+esc(x.titulo)+'</b><small>'+esc(x.texto)+'</small><div style="margin-top:6px"><i>'+esc(x.categoria)+'</i>'+(n?'<i>🖼 '+n+' imagem(ns)</i>':'')+'</div></button>'}).join(''):'<div class="rp-v">Nenhuma resposta encontrada.</div>';
    f.querySelectorAll('[data-r]').forEach(function(b){b.onclick=function(){var x=cache.filter(function(y){return y.id===b.dataset.r})[0];fechar();
     try{sb.rpc('resposta_usada',{p_id:x.id})}catch(e){}o.ao({texto:x.texto,imagens:arr(x.imagens),titulo:x.titulo})}});
   }
   pintar();
  }};
})();
     

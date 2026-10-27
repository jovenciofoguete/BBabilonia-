/* avaliacoes-produto.js — BBabilônia
   Corre dentro da página do produto (carregado pelo produto-bbabilonia.html).
   Mostra por baixo dos detalhes: média de estrelas, número de avaliações,
   barras de 5 a 1 estrela e a lista de avaliações com fotos dos clientes. */
(function(){
  var d=document,n=0;
  var U='https://dsfoqoeawvjafypycldz.supabase.co',K='sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function est(v){var s='';for(var i=1;i<=5;i++)s+=v>=i-0.25?'★':'☆';return s}
  function arr(x){if(typeof x==='string'){try{x=JSON.parse(x)}catch(e){x=[]}}return Array.isArray(x)?x:[]}
  var t=setInterval(function(){
    if(++n>80){clearInterval(t);return}
    if(typeof P==='undefined'||!P||!P.id)return;
    clearInterval(t);
    if(d.getElementById('bb-aval'))return;
    var css=d.createElement('style');
    css.textContent=
      '#bb-aval h3{margin:0 0 10px;font-size:1.05rem}'+
      '#bb-aval .res{display:flex;gap:16px;align-items:center;margin-bottom:12px}'+
      '#bb-aval .med{font-size:2.2rem;font-weight:900;line-height:1}#bb-aval .med small{display:block;font-size:.8rem;font-weight:400;opacity:.75;margin-top:4px}'+
      '#bb-aval .s{color:#f59e0b;letter-spacing:1px}'+
      '#bb-aval .barras{flex:1;font-size:.78rem}#bb-aval .barras div{display:flex;align-items:center;gap:6px;margin:2px 0}'+
      '#bb-aval .barras i{flex:1;height:7px;border-radius:4px;background:rgba(127,127,127,.25);overflow:hidden;display:block}'+
      '#bb-aval .barras i b{display:block;height:100%;background:#f59e0b}'+
      '#bb-aval .av{border-top:1px solid var(--linha,#333);padding:10px 0}'+
      '#bb-aval .av .l1{display:flex;justify-content:space-between;font-size:.8rem;opacity:.8}'+
      '#bb-aval .av p{margin:6px 0;font-size:.95rem;line-height:1.4;white-space:pre-line}'+
      '#bb-aval .av .det{font-size:.78rem;opacity:.7}'+
      '#bb-aval .fs{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}#bb-aval .fs img{width:72px;height:72px;object-fit:cover;border-radius:8px}'+
      '#bb-aval .mais{width:100%;margin-top:8px;padding:10px;border:1px solid var(--linha,#333);border-radius:10px;background:none;color:inherit;font-weight:700}'+
      '#bb-aval .vz{opacity:.75;font-size:.9rem}';
    d.head.appendChild(css);
    var box=d.createElement('div');box.id='bb-aval';box.className='bloco';
    box.innerHTML='<h3>⭐ Avaliações dos clientes</h3><div class="vz">A carregar…</div>';
    var ref=d.getElementById('detalhes');
    if(ref&&ref.parentNode)ref.parentNode.insertBefore(box,ref.nextSibling);else d.body.appendChild(box);
    fetch(U+'/rest/v1/avaliacoes?select=*&product_id=eq.'+encodeURIComponent(P.id)+'&order=created_at.desc&limit=200',{headers:{apikey:K,Authorization:'Bearer '+K}})
      .then(function(r){return r.ok?r.json():[]}).catch(function(){return[]}).then(function(l){
        if(!l.length){box.innerHTML='<h3>⭐ Avaliações dos clientes</h3><div class="vz">Ainda sem avaliações. Os clientes avaliam depois de receber o produto.</div>';return}
        var soma=0,c=[0,0,0,0,0,0];l.forEach(function(a){soma+=a.estrelas;c[a.estrelas]++});
        var med=soma/l.length,mostrar=5;
        function lista(){
          return l.slice(0,mostrar).map(function(a){
            var fs=arr(a.fotos);
            return'<div class="av"><div class="l1"><span><span class="s">'+est(a.estrelas)+'</span> '+esc(a.nome||'Cliente')+'</span><span>'+new Date(a.created_at).toLocaleDateString()+'</span></div>'+
              (a.detalhe?'<div class="det">'+esc(a.detalhe)+'</div>':'')+(a.comentario?'<p>'+esc(a.comentario)+'</p>':'')+
              (fs.length?'<div class="fs">'+fs.map(function(u){return'<a href="'+esc(u)+'" target="_blank"><img loading="lazy" src="'+esc(u)+'" alt=""></a>'}).join('')+'</div>':'')+'</div>';
          }).join('')+(l.length>mostrar?'<button class="mais">Ver mais avaliações ('+(l.length-mostrar)+')</button>':'');
        }
        function desenhar(){
          box.innerHTML='<h3>⭐ Avaliações dos clientes</h3><div class="res"><div class="med">'+med.toFixed(1).replace('.',',')+'<small><span class="s">'+est(med)+'</span><br>'+l.length+' avaliaç'+(l.length===1?'ão':'ões')+'</small></div>'+
            '<div class="barras">'+[5,4,3,2,1].map(function(s){return'<div>'+s+'★<i><b style="width:'+Math.round(c[s]*100/l.length)+'%"></b></i>'+c[s]+'</div>'}).join('')+'</div></div>'+lista();
          var b=box.querySelector('.mais');if(b)b.onclick=function(){mostrar+=10;desenhar()};
        }
        desenhar();
      });
  },300);
})();
    

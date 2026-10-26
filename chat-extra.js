/* chat-extra.js — BBabilônia
   Corre dentro do chat.html (carregado pelo chat-novo.html).
   Quando o cliente abre o chat a partir de um produto (botão Chat da página do produto):
   - aparece em baixo "Pergunte sobre este produto:" com foto, preço, nome e botão "Enviar";
   - o cliente só toca em "Enviar" e o cartão do produto vai para a conversa;
   - se tocar em "Escreva a mensagem" (ou no ×) o cartão desaparece sem ser enviado.
   Também mostra os cartões de produto já enviados como cartão (foto + nome + preço). */
(function(){
  var d=document;
  var p=new URLSearchParams(location.search),prod=p.get('produto');

  var css=d.createElement('style');
  css.textContent=
    '#bb-pp{position:relative;border:1px solid #e5e7eb;border-radius:14px;padding:10px 12px;margin:0 0 8px;background:#fff;box-shadow:0 2px 8px #0001}'+
    '#bb-pp .t{font-size:13px;color:#6b7280;margin-bottom:8px}'+
    '#bb-pp .x{position:absolute;top:4px;right:6px;border:0;background:none;font-size:22px;color:#555;padding:2px 8px}'+
    '#bb-pp .l{display:flex;align-items:center;gap:10px}'+
    '#bb-pp img,#bb-pp .sf{width:64px;height:64px;border-radius:8px;object-fit:cover;flex:none;background:#eee}'+
    '#bb-pp .i{flex:1;min-width:0}'+
    '#bb-pp .i b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
    '#bb-pp .i span{display:block;font-size:13px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
    '#bb-pp .e{border:0;border-radius:20px;padding:10px 18px;font-size:15px;font-weight:800;color:#fff;background:linear-gradient(90deg,#10b981,#0ea5e9)}'+
    '#bb-pp .e:disabled{opacity:.5}'+
    '.bb-pc{display:block;color:inherit;text-decoration:none}'+
    '.bb-pc img{width:100%;max-height:220px;object-fit:cover;border-radius:8px;display:block}'+
    '.bb-pc b{display:block;margin-top:6px;font-size:15px}'+
    '.bb-pc span{display:block;font-weight:800;font-size:16px;color:#0b7a55;margin-top:2px}'+
    '.bb-pc em{display:block;font-style:normal;font-size:12px;color:#0b57d0;margin-top:4px}';
  d.head.appendChild(css);

  /* 1) Mostrar cartões de produto nas mensagens (substitui o desenho das mensagens) */
  function corpoProduto(x){
    var q=x.dados&&x.dados.produto;
    return '<a class="bb-pc" target="_top" href="produto-bbabilonia.html?id='+esc(q.id)+'">'+
      (x.anexo_url?'<img loading="lazy" src="'+esc(x.anexo_url)+'">':'')+
      '<b>'+esc(q.nome||'Produto')+'</b><span>'+esc(q.preco||'')+'</span><em>Ver produto ›</em></a>';
  }
  if(typeof carregar==='function'&&typeof api==='function'){
    window.carregar=async function(forcar){
      var m=await api('mensagens?select=*&conversa_id=eq.'+conv.id+'&order=created_at.asc');
      var marca=m.length+':'+(m.length?m[m.length-1].id:'');
      if(!forcar&&marca===ultimo)return;
      ultimo=marca;
      var box=$('msgs');
      var perto=box.scrollHeight-box.scrollTop-box.clientHeight<80;
      box.innerHTML=m.map(function(x){
        var meu=x.remetente_id===eu;
        var corpo;
        if(x.dados&&x.dados.produto)corpo=corpoProduto(x);
        else if(x.tipo==='endereco')corpo=cartao(x.dados);
        else if(x.tipo==='imagem')corpo='<a href="'+esc(x.anexo_url)+'" target="_blank"><img class="foto" loading="lazy" src="'+esc(x.anexo_url)+'"></a>';
        else corpo=esc(x.texto);
        return '<div class="m'+(meu?' eu':'')+(x.tipo==='endereco'?' end':'')+'">'+corpo+'<small>'+hora(x.created_at)+'</small></div>';
      }).join('');
      if(forcar||perto)box.scrollTop=box.scrollHeight;
    };
    try{if(typeof conv!=='undefined'&&conv&&vista==='chat')window.carregar(true)}catch(e){}
  }

  /* 2) Cartão "Pergunte sobre este produto" em baixo, à espera de "Enviar" */
  if(!prod||!p.get('vendedor'))return;
  var tent=0,feito=false;
  var t=setInterval(async function(){
    if(++tent>60){clearInterval(t);return}
    if(typeof conv==='undefined'||!conv||String(conv.produto_id)!==String(prod)||typeof api!=='function')return;
    clearInterval(t);
    if(feito)return;feito=true;
    try{
      var r=await api('products?select=id,name,price,currency,image_url,images&id=eq.'+encodeURIComponent(prod));
      var x=r&&r[0];if(!x)return;
      var foto=x.image_url||'';
      var im=x.images;if(typeof im==='string'){try{im=JSON.parse(im)}catch(e){im=[]}}
      if(!foto&&Array.isArray(im)&&im.length)foto=typeof im[0]==='string'?im[0]:(im[0].url||'');
      var preco=Number(x.price||0).toLocaleString('pt-PT')+' '+(x.currency||'MZN');
      mostrarCartao(x,foto,preco);
    }catch(e){}
  },400);

  function mostrarCartao(x,foto,preco){
    var linha=$('linha');if(!linha||$('bb-pp'))return;
    var c=d.createElement('div');c.id='bb-pp';
    c.innerHTML='<button class="x" aria-label="Fechar">×</button><div class="t">Pergunte sobre este produto:</div>'+
      '<div class="l">'+(foto?'<img src="'+esc(foto)+'" alt="">':'<div class="sf"></div>')+
      '<div class="i"><b>'+esc(preco)+'</b><span>'+esc(x.name||'Produto')+'</span></div>'+
      '<button class="e">Enviar</button></div>';
    linha.parentNode.insertBefore(c,linha);
    function tirar(){if(c.parentNode)c.parentNode.removeChild(c);txt.removeEventListener('focus',tirar);txt.removeEventListener('pointerdown',tirar)}
    var txt=$('texto');
    txt.addEventListener('focus',tirar);
    txt.addEventListener('pointerdown',tirar);
    c.querySelector('.x').onclick=tirar;
    $('voltar').addEventListener('click',tirar);
    var b=c.querySelector('.e');
    b.onclick=async function(){
      b.disabled=true;
      var dados={produto:{id:x.id,nome:x.name||'Produto',preco:preco}};
      try{
        try{
          await api('mensagens','POST',{conversa_id:conv.id,remetente_id:eu,tipo:'imagem',texto:'',anexo_url:foto||null,dados:dados});
        }catch(e1){
          if(foto)await api('mensagens','POST',{conversa_id:conv.id,remetente_id:eu,tipo:'imagem',texto:'',anexo_url:foto});
          await api('mensagens','POST',{conversa_id:conv.id,remetente_id:eu,tipo:'texto',
            texto:'🛍️ '+(x.name||'Produto')+' — '+preco+'\n'+location.origin+'/produto-bbabilonia.html?id='+x.id});
        }
        tirar();
        await window.carregar(true);
      }catch(e){alert(e.message);b.disabled=false}
    };
  }
})();

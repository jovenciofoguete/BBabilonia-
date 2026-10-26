/* chat-extra.js — BBabilônia
   Corre dentro do chat.html (carregado pelo chat-novo.html).
   Quando o cliente abre o chat a partir de um produto, envia sozinho o cartão do produto
   (foto + nome, preço e ligação) — só uma vez, na conversa nova. */
(function(){
  var p=new URLSearchParams(location.search),prod=p.get('produto');
  if(!prod||!p.get('vendedor'))return;
  var chave='bb-prod-enviado-'+prod,tentativas=0;
  var t=setInterval(async function(){
    if(++tentativas>40){clearInterval(t);return}
    if(typeof conv==='undefined'||!conv||String(conv.produto_id)!==String(prod)||typeof api!=='function')return;
    clearInterval(t);
    try{
      if(sessionStorage.getItem(chave+conv.id))return;
      var m=await api('mensagens?select=id&conversa_id=eq.'+conv.id+'&limit=1');
      if(m.length)return;
      var r=await api('products?select=id,name,price,currency,image_url,images&id=eq.'+encodeURIComponent(prod));
      var x=r[0];if(!x)return;
      var foto=x.image_url;if(!foto&&Array.isArray(x.images)&&x.images.length)foto=typeof x.images[0]==='string'?x.images[0]:(x.images[0].url||'');
      sessionStorage.setItem(chave+conv.id,'1');
      if(foto)await api('mensagens','POST',{conversa_id:conv.id,remetente_id:eu,tipo:'imagem',texto:'',anexo_url:foto});
      var preco=Number(x.price||0).toLocaleString('pt-PT')+' '+(x.currency||'MZN');
      await api('mensagens','POST',{conversa_id:conv.id,remetente_id:eu,tipo:'texto',
        texto:'🛍️ Tenho interesse neste produto:\n'+(x.name||'Produto')+' — '+preco+'\n'+location.origin+'/produto-bbabilonia.html?id='+x.id});
      if(typeof carregar==='function')carregar(true);
    }catch(e){}
  },500);
})();

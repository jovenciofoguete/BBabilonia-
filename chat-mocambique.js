/* chat-mocambique.js — BBabilônia (14/11/2026)
   Corre dentro do chat.html (carregado pelo chat-novo.html).
   Por enquanto, quando o fornecedor tem a loja em Moçambique e o cliente está em Moçambique:
   - o cliente não vê "Compartilhar endereço de entrega";
   - o fornecedor não vê "💳 Criar link de pagamento".
   A base de dados (PARTE10.sql) também bloqueia, mesmo que alguém tente por fora.
   Não mexe em mais nada: texto, fotos, vídeos e cartões de produto continuam. */
(function(){
  var d=document;
  if(typeof api!=='function')return;
  var css=d.createElement('style');
  css.textContent=
    'body.bb-mz #partilhar,body.bb-mz #bb-lp,body.bb-mz #bb-lpm{display:none!important}'+
    '#bb-mz-nota{display:none;font-size:12.5px;color:#0e7490;background:#ecfeff;border-radius:8px;padding:6px 10px;margin:0 0 6px}'+
    'body.bb-mz #bb-mz-nota{display:block}';
  d.head.appendChild(css);
  var nota=d.createElement('div');nota.id='bb-mz-nota';
  var rod=d.getElementById('rodape');if(rod)rod.insertBefore(nota,rod.firstChild);

  var cache={},atual=null;
  function aplicar(mz,souCliente){
    d.body.classList.toggle('bb-mz',!!mz);
    nota.textContent=mz?(souCliente
      ?'🇲🇿 Em Moçambique a BBabilônia trata da busca e da entrega: pague pelo carrinho, não partilhe o endereço com o fornecedor.'
      :'🇲🇿 Em Moçambique, por enquanto, não se envia link de pagamento: o cliente paga pelo carrinho. Pode responder sobre stock e enviar fotos ou vídeos.'):'';
  }
  async function ver(){
    var c=(typeof conv!=='undefined')?conv:null;
    if(!c||!c.id){if(atual!==null){atual=null;aplicar(false)}return}
    var souCliente=String(c.cliente_id)===String(typeof eu!=='undefined'?eu:'');
    if(c.id in cache){aplicar(cache[c.id],souCliente);atual=c.id;return}
    if(atual==='a-ver:'+c.id)return;
    atual='a-ver:'+c.id;
    try{
      var r=await api('rpc/bb_conversa_mz','POST',{p_conversa:c.id});
      cache[c.id]=r===true;
    }catch(e){cache[c.id]=false}
    atual=c.id;
    aplicar(cache[c.id],souCliente);
  }
  window.BBMzRever=function(){cache={};atual=null;ver()};  /* o cliente escolheu o país: voltar a perguntar (pais-cliente.js) */
  setInterval(ver,500);ver();
})();

/* produto-chat.js — BBabilônia
   Corre dentro da página do produto: põe o botão "Chat com o fornecedor".
   Ao tocar, abre o chat com esse fornecedor e o produto vai sozinho para a conversa. */
(function(){
  var d=document,n=0;
  var t=setInterval(function(){
    if(++n>60){clearInterval(t);return}
    if(typeof P==='undefined'||!P)return;
    clearInterval(t);
    var v=P.supplier_id||P.vendedor_id||P.fornecedor_id;
    if(!v||d.getElementById('bb-chat-forn'))return;
    try{var ses=JSON.parse(localStorage.getItem('sb-dsfoqoeawvjafypycldz-auth-token')||'null');if(ses&&ses.user&&ses.user.id===v)return}catch(e){}
    var a=d.createElement('a');a.id='bb-chat-forn';
    a.href='chat-novo2.html?vendedor='+encodeURIComponent(v)+'&produto='+encodeURIComponent(P.id)+'&assunto='+encodeURIComponent('Produto: '+(P.nome_||P.name||'Produto'));
    a.target='_top';
    a.textContent='💬 Chat com o fornecedor';
    a.style.cssText='display:block;margin:12px 16px;padding:13px;border-radius:12px;text-align:center;font-weight:800;color:#fff;text-decoration:none;background:linear-gradient(90deg,#10b981,#0ea5e9);box-shadow:0 6px 14px #0ea5e955';
    var info=d.querySelector('.info');
    if(info&&info.parentNode)info.parentNode.insertBefore(a,info.nextSibling);else d.body.appendChild(a);
  },300);
})();

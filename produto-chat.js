/* produto-chat.js — BBabilônia
   Corre dentro da página do produto.
   Na barra de baixo põe o botão "Chat" ANTES de "Adicionar ao carrinho" (como no Alibaba).
   Ao tocar em Chat abre a conversa com o fornecedor deste produto; o cartão do produto
   aparece lá pronto, e o cliente só toca em "Enviar". */
(function(){
  var d=document,n=0;
  var t=setInterval(function(){
    if(++n>60){clearInterval(t);return}
    if(typeof P==='undefined'||!P)return;
    var add=d.getElementById('add');
    if(!add)return;
    clearInterval(t);
    if(d.getElementById('bb-chat-forn'))return;
    var v=P.supplier_id||P.vendedor_id||P.fornecedor_id||'';

    var css=d.createElement('style');
    css.textContent=
      '#bb-chat-forn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:64px;padding:8px 12px;border:0;border-radius:10px;'+
      'background:linear-gradient(135deg,#10b981,#0ea5e9);color:#fff;font-weight:800;font-size:.85rem;text-decoration:none;box-shadow:0 4px 12px #0ea5e955}'+
      '#bb-chat-forn svg{width:22px;height:22px}';
    d.head.appendChild(css);

    var a=d.createElement('a');a.id='bb-chat-forn';a.target='_top';
    a.href=v
      ?'chat-novo2.html?vendedor='+encodeURIComponent(v)+'&produto='+encodeURIComponent(P.id)+'&assunto='+encodeURIComponent('Produto: '+(P.nome_||P.name||'Produto'))
      :'chat-novo2.html';
    a.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Chat';
    add.parentNode.insertBefore(a,add);
  },300);
})();

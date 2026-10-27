/* chat-pagamento.js — BBabilônia
   Corre dentro do chat.html (carregado pelo chat-novo.html, depois do chat-extra.js).
   - O FORNECEDOR vê "💳 Criar link de pagamento" no fundo do chat:
     descrição, quantidade, preço unitário, envio, moeda e prazo de produção.
     O link vai para a conversa como um cartão.
   - O CLIENTE vê o cartão com o botão "Pagar agora" (abre pagar-link.html).
   - O cartão mostra o estado: a aguardar pagamento, pago ou cancelado.
   Não mexe no que já funciona: mantém os cartões de produto, endereço e imagens. */
(function(){
  var d=document;
  if(typeof api!=='function'||typeof $!=='function')return;

  var css=d.createElement('style');
  css.textContent=
    '#bb-lp{display:none;color:#047857;font-size:14px;font-weight:800;text-decoration:underline;margin:0 0 6px 14px}'+
    '.bb-pg{min-width:220px}.bb-pg .h{font-size:12.5px;font-weight:800;color:#0e7490;letter-spacing:.3px;margin-bottom:4px}'+
    '.bb-pg b{display:block;font-size:15.5px;margin-bottom:4px}.bb-pg .l{font-size:13.5px;color:#334155}'+
    '.bb-pg .t{font-size:18px;font-weight:900;color:#065f46;margin:6px 0 4px}'+
    '.bb-pg a.pagar{display:block;text-align:center;margin-top:8px;padding:11px;border-radius:12px;color:#fff;font-weight:800;text-decoration:none;background:linear-gradient(90deg,#10b981,#0ea5e9)}'+
    '.bb-pg .e{display:inline-block;margin-top:8px;font-size:12.5px;font-weight:800;padding:4px 10px;border-radius:20px;background:#fef3c7;color:#92400e}'+
    '.bb-pg .e.ok{background:#d1fae5;color:#065f46}.bb-pg .e.no{background:#ffe4e6;color:#9f1239}'+
    '.bb-pg button.cx{display:block;margin-top:8px;border:0;background:none;color:#be123c;font-size:13px;text-decoration:underline;padding:0}'+
    '#bb-lpm{display:none;position:fixed;inset:0;background:#000a;z-index:20;align-items:flex-end}'+
    '#bb-lpm .cx2{background:#fff;width:100%;max-height:88vh;overflow:auto;border-radius:18px 18px 0 0;padding:16px}'+
    '#bb-lpm h3{margin:0 0 4px;font-size:18px}#bb-lpm p.s{margin:0 0 6px;font-size:13px;color:#64748b}'+
    '#bb-lpm label{display:block;font-size:13.5px;font-weight:700;color:#334155;margin:10px 0 4px}'+
    '#bb-lpm input,#bb-lpm select,#bb-lpm textarea{width:100%;padding:11px;border:2px solid #e2e8f0;border-radius:10px;font-size:16px;font-family:inherit}'+
    '#bb-lpm .g{display:flex;gap:8px}#bb-lpm .g>div{flex:1}'+
    '#bb-lpm .tot{margin-top:12px;font-size:17px;font-weight:900;color:#065f46}'+
    '#bb-lpm .err{color:#dc2626;font-size:13.5px;min-height:18px;margin-top:6px}'+
    '#bb-lpm .bt{display:flex;gap:8px;margin-top:10px}#bb-lpm .bt button{flex:1;padding:13px;border:0;border-radius:12px;font-size:15px;font-weight:800}'+
    '#bb-lpm .ok{background:linear-gradient(90deg,#10b981,#0ea5e9);color:#fff}#bb-lpm .ok:disabled{opacity:.5}#bb-lpm .no{background:#e2e8f0;color:#0f172a}';
  d.head.appendChild(css);

  var MOEDAS=['MZN','USD','EUR','ZAR','CNY','AOA','BRL','GBP','AED','INR','TRY','KES','TZS','NGN','MWK','ZMW'];
  var moedaPref='MZN';try{var bp=JSON.parse(localStorage.getItem('bb_prefs')||'null');if(bp&&bp.moeda)moedaPref=bp.moeda}catch(e){}
  if(MOEDAS.indexOf(moedaPref)<0)MOEDAS.unshift(moedaPref);
  function num(v){return Number(String(v||'').replace(',','.'))||0}
  function dinheiro(v,m){return Number(v||0).toLocaleString('pt-PT',{maximumFractionDigits:2})+' '+(m||'')}

  /* Link "Criar link de pagamento" (só para o fornecedor) */
  var bt=d.createElement('a');bt.id='bb-lp';bt.textContent='💳 Criar link de pagamento';
  var part=$('partilhar');if(part&&part.parentNode)part.parentNode.insertBefore(bt,part.nextSibling);
  setInterval(function(){
    var mostra=typeof conv!=='undefined'&&conv&&vista==='chat'&&String(conv.vendedor_id)===String(eu);
    bt.style.display=mostra?'inline-block':'none';
  },500);

  /* Janela para criar o link */
  var md=d.createElement('div');md.id='bb-lpm';
  md.innerHTML='<div class="cx2"><h3>💳 Criar link de pagamento</h3><p class="s">Para personalização combinada com o cliente. O cliente paga na plataforma pelo link enviado aqui no chat.</p>'+
    '<label>O que o cliente vai pagar *</label><textarea id="lp-d" rows="2" maxlength="300" placeholder="Ex.: Vestido de noiva por medida, cor marfim"></textarea>'+
    '<div class="g"><div><label>Quantidade *</label><input id="lp-q" type="number" min="1" step="1" value="1" inputmode="numeric"></div>'+
    '<div><label>Preço unitário *</label><input id="lp-p" type="number" min="0" step="0.01" inputmode="decimal"></div></div>'+
    '<div class="g"><div><label>Envio (opcional)</label><input id="lp-e" type="number" min="0" step="0.01" value="0" inputmode="decimal"></div>'+
    '<div><label>Moeda *</label><select id="lp-m">'+MOEDAS.map(function(m){return'<option'+(m===moedaPref?' selected':'')+'>'+m+'</option>'}).join('')+'</select></div></div>'+
    '<label>Prazo de produção</label><select id="lp-z"><option value="">Pronto a enviar</option>'+[2,4,7,15,22,30,45,60].map(function(n){return'<option value="'+n+'">'+n+' dias</option>'}).join('')+'</select>'+
    '<div class="tot" id="lp-t">Total: 0</div><div class="err" id="lp-x"></div>'+
    '<div class="bt"><button class="no" id="lp-f">Fechar</button><button class="ok" id="lp-ok">Enviar link</button></div></div>';
  d.body.appendChild(md);
  function total(){return Math.round((num($('lp-q').value)*num($('lp-p').value)+num($('lp-e').value))*100)/100}
  function atualiza(){$('lp-t').textContent='Total a pagar: '+dinheiro(total(),$('lp-m').value)}
  ['lp-q','lp-p','lp-e','lp-m'].forEach(function(i){$(i).addEventListener('input',atualiza);$(i).addEventListener('change',atualiza)});
  bt.onclick=function(){$('lp-x').textContent='';$('lp-ok').disabled=false;atualiza();md.style.display='flex'};
  $('lp-f').onclick=function(){md.style.display='none'};
  $('lp-ok').onclick=async function(){
    var x=$('lp-x'),b=this;x.textContent='';
    var desc=$('lp-d').value.trim(),q=Math.floor(num($('lp-q').value)),p=num($('lp-p').value),e=num($('lp-e').value),m=$('lp-m').value,z=$('lp-z').value;
    if(desc.length<3)return x.textContent='Escreva o que o cliente vai pagar.';
    if(q<1)return x.textContent='A quantidade tem de ser 1 ou mais.';
    if(p<=0)return x.textContent='Escreva o preço unitário.';
    if(e<0)return x.textContent='O envio não pode ser negativo.';
    if(window.FiltroContactos&&!window.FiltroContactos.verificar(desc).ok)return x.textContent='A descrição tem contactos ou links. Não é permitido.';
    var t=total();
    b.disabled=true;
    try{
      var r=await api('links_pagamento','POST',{conversa_id:String(conv.id),vendedor_id:eu,cliente_id:conv.cliente_id,descricao:desc,quantidade:q,preco_unitario:p,envio:e,total:t,moeda:m,prazo_dias:z?Number(z):null});
      var L=r&&r[0];if(!L)throw new Error('Não foi possível criar o link.');
      await api('mensagens','POST',{conversa_id:conv.id,remetente_id:eu,tipo:'texto',texto:'💳 Link de pagamento: '+desc+' — '+dinheiro(t,m),dados:{pagamento:{id:L.id}}});
      md.style.display='none';$('lp-d').value='';$('lp-p').value='';$('lp-e').value='0';$('lp-q').value='1';
      await window.carregar(true);
    }catch(er){x.textContent=er.message||String(er);b.disabled=false}
  };

  /* Desenho das mensagens (igual ao chat-extra.js + cartão de pagamento) */
  var links={};
  function corpoProduto(x){
    var q=x.dados&&x.dados.produto;
    return '<a class="bb-pc" target="_top" href="produto-bbabilonia.html?id='+esc(q.id)+'">'+
      (x.anexo_url?'<img loading="lazy" src="'+esc(x.anexo_url)+'">':'')+
      '<b>'+esc(q.nome||'Produto')+'</b><span>'+esc(q.preco||'')+'</span><em>Ver produto ›</em></a>';
  }
  function corpoPagamento(x,meu){
    var L=links[x.dados.pagamento.id];
    if(!L)return '<div class="bb-pg"><div class="h">💳 LINK DE PAGAMENTO</div>'+esc(x.texto)+'</div>';
    var est=L.estado==='pago'?'<span class="e ok">✅ Pago</span>':(L.estado==='cancelado'?'<span class="e no">Cancelado</span>':'');
    var acao='';
    if(L.estado==='por_pagar'){
      if(String(L.cliente_id)===String(eu))acao='<a class="pagar" target="_top" href="pagar-link.html?id='+esc(L.id)+'">Pagar agora</a>';
      else acao='<span class="e">⏳ A aguardar pagamento</span><button class="cx" data-cancelar="'+esc(L.id)+'">Cancelar este link</button>';
    }
    return '<div class="bb-pg"><div class="h">💳 LINK DE PAGAMENTO</div><b>'+esc(L.descricao)+'</b>'+
      '<div class="l">'+esc(L.quantidade)+' × '+dinheiro(L.preco_unitario,L.moeda)+'</div>'+
      (Number(L.envio)?'<div class="l">Envio: '+dinheiro(L.envio,L.moeda)+'</div>':'')+
      (L.prazo_dias?'<div class="l">Prazo de produção: '+esc(L.prazo_dias)+' dias</div>':'')+
      '<div class="t">'+dinheiro(L.total,L.moeda)+'</div>'+est+acao+'</div>';
  }
  window.carregar=async function(forcar){
    var m=await api('mensagens?select=*&conversa_id=eq.'+conv.id+'&order=created_at.asc');
    var temPg=m.some(function(x){return x.dados&&x.dados.pagamento});
    var ls=[];
    if(temPg){try{ls=await api('links_pagamento?select=*&conversa_id=eq.'+encodeURIComponent(String(conv.id)))}catch(e){ls=[]}}
    var marca=m.length+':'+(m.length?m[m.length-1].id:'')+':'+ls.map(function(l){return l.estado}).join(',');
    if(!forcar&&marca===ultimo)return;
    ultimo=marca;links={};ls.forEach(function(l){links[l.id]=l});
    var box=$('msgs');
    var perto=box.scrollHeight-box.scrollTop-box.clientHeight<80;
    box.innerHTML=m.map(function(x){
      var meu=x.remetente_id===eu,corpo;
      if(x.dados&&x.dados.pagamento)corpo=corpoPagamento(x,meu);
      else if(x.dados&&x.dados.produto)corpo=corpoProduto(x);
      else if(x.tipo==='endereco')corpo=cartao(x.dados);
      else if(x.tipo==='imagem')corpo='<a href="'+esc(x.anexo_url)+'" target="_blank"><img class="foto" loading="lazy" src="'+esc(x.anexo_url)+'"></a>';
      else corpo=esc(x.texto);
      return '<div class="m'+(meu?' eu':'')+(x.tipo==='endereco'?' end':'')+'">'+corpo+'<small>'+hora(x.created_at)+'</small></div>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('[data-cancelar]'),function(b){
      b.onclick=async function(){
        if(!confirm('Cancelar este link de pagamento? O cliente já não poderá pagar por ele.'))return;
        b.disabled=true;
        try{await api('links_pagamento?id=eq.'+encodeURIComponent(b.getAttribute('data-cancelar')),'PATCH',{estado:'cancelado'});await window.carregar(true)}
        catch(e){alert(e.message);b.disabled=false}
      };
    });
    if(forcar||perto)box.scrollTop=box.scrollHeight;
  };
  try{if(typeof conv!=='undefined'&&conv&&vista==='chat')window.carregar(true)}catch(e){}
})();
              

/* chat-pagamento-fotos.js — BBabilônia
   Junta FOTOS ao link de pagamento do chat (como no Alibaba). Corre dentro do chat.html,
   carregado pelo chat-novo.html DEPOIS do chat-pagamento.js. Não altera o chat-pagamento.js.
   - O fornecedor, ao criar o link, escolhe as fotos: do chat (as que o cliente enviou),
     dos seus produtos publicados (com cor e tamanho) ou carregadas do aparelho.
   - O cartão do link no chat e a página de pagamento mostram essas fotos.
   - É obrigatório pelo menos 1 foto: fica como prova do que foi combinado. */
(function () {
  if (window.__bbLpFotos) return; window.__bbLpFotos = 1;
  var d = document;
  if (typeof api !== 'function' || typeof $ !== 'function' || !$('bb-lpm')) return;
  var MAX = 9;
  var fotos = [], produto = null, painel = '';

  var css = d.createElement('style');
  css.textContent =
    '#lpf label.t{display:block;font-size:13.5px;font-weight:700;color:#334155;margin:12px 0 4px}' +
    '#lpf-g{display:flex;flex-wrap:wrap;gap:8px}' +
    '#lpf-g div{position:relative}#lpf-g img{width:72px;height:72px;object-fit:cover;border-radius:10px;display:block;border:1px solid #e2e8f0}' +
    '#lpf-g b{position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:#ef4444;color:#fff;font-size:14px;line-height:22px;text-align:center;cursor:pointer}' +
    '#lpf-g .vz{font-size:13px;color:#b45309}' +
    '#lpf .bts{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}' +
    '#lpf .bts button,#lpf .bts label{flex:1;min-width:100px;border:1px solid #0ea5e9;background:#f0f9ff;color:#0369a1;border-radius:10px;padding:9px 6px;font-size:13.5px;font-weight:700;text-align:center;cursor:pointer;margin:0}' +
    '#lpf-esc{margin-top:8px}#lpf-esc .gr{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-height:230px;overflow:auto}' +
    '#lpf-esc .gr img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:3px solid transparent;display:block;cursor:pointer}' +
    '#lpf-esc .gr img.on{border-color:#10b981}' +
    '#lpf-esc .pl{max-height:230px;overflow:auto;border:1px solid #e2e8f0;border-radius:10px}' +
    '#lpf-esc .pl button{display:flex;gap:8px;align-items:center;width:100%;border:0;border-bottom:1px solid #f1f5f9;background:#fff;padding:7px;text-align:left;font-size:14px}' +
    '#lpf-esc .pl img,#lpf-esc .pl i{width:44px;height:44px;border-radius:8px;object-fit:cover;flex:none;background:#f1f5f9}' +
    '#lpf-esc .pl span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#lpf-esc .sub{font-size:12.5px;color:#64748b;margin:0 0 6px}' +
    '#lpf-pi{margin-top:8px;background:#ecfdf5;border-radius:10px;padding:8px 10px;font-size:13.5px}' +
    '#lpf-pi .x{float:right;border:0;background:none;color:#be123c;text-decoration:underline;font-size:13px;padding:0}' +
    '.bb-pg .fs{display:flex;gap:4px;overflow-x:auto;margin:6px 0}.bb-pg .fs img{width:64px;height:64px;object-fit:cover;border-radius:8px;flex:none;display:block}' +
    '.bb-pg .pr{display:block;font-size:12.5px;color:#0b57d0;margin-top:2px}';
  d.head.appendChild(css);

  /* ---------- secção de fotos dentro da janela "Criar link de pagamento" ---------- */
  var sec = d.createElement('div'); sec.id = 'lpf';
  sec.innerHTML = '<label class="t">Fotos do que o cliente vai pagar * <small style="font-weight:400;color:#64748b">(até ' + MAX + ')</small></label>' +
    '<div id="lpf-g"></div>' +
    '<div class="bts"><button type="button" id="lpf-chat">🖼️ Do chat</button><button type="button" id="lpf-prod">📦 Dos meus produtos</button>' +
    '<label>📷 Carregar<input type="file" id="lpf-file" accept="image/jpeg,image/png,image/webp" multiple hidden></label></div>' +
    '<div id="lpf-pi" style="display:none"></div>' +
    '<div id="lpf-esc"></div>';
  $('lp-t').parentNode.insertBefore(sec, $('lp-t'));

  function arr(x) { if (typeof x === 'string') { try { x = JSON.parse(x); } catch (e) { x = x ? [x] : []; } } return Array.isArray(x) ? x : []; }
  function urlDe(a) { return typeof a === 'string' ? a : (a && (a.url || a.foto || a.src)) || ''; }
  function fotosProduto(p) {
    var l = [];
    if (p.image_url) l.push(p.image_url);
    arr(p.images).forEach(function (a) { l.push(urlDe(a)); });
    arr(p.colors).forEach(function (c) { l.push(urlDe(c)); });
    return l.filter(function (u, i) { return /^https?:\/\//.test(u) && l.indexOf(u) === i; });
  }
  function coresProduto(p) { return arr(p.colors).map(function (c) { return typeof c === 'string' ? c : (c && (c.nome || c.cor || c.name)) || ''; }).filter(Boolean); }
  function tamanhosProduto(p) {
    var t = arr(p.sizes).map(String);
    arr(p.variants).forEach(function (v) { var x = v && (v.tamanho || v.size); if (x && t.indexOf(String(x)) < 0) t.push(String(x)); });
    return t;
  }
  function juntar(u) { if (!u || fotos.indexOf(u) > -1) return; if (fotos.length >= MAX) { erro('Máximo de ' + MAX + ' fotos.'); return; } fotos.push(u); }
  function tirar(u) { var i = fotos.indexOf(u); if (i > -1) fotos.splice(i, 1); }
  function erro(t) { var x = $('lp-x'); if (x) x.textContent = t || ''; }

  function desenhar() {
    $('lpf-g').innerHTML = fotos.length ? fotos.map(function (u, i) { return '<div><img src="' + esc(u) + '" alt=""><b data-rm="' + i + '">×</b></div>'; }).join('')
      : '<span class="vz">Ainda sem fotos. Escolha do chat, dos seus produtos ou carregue.</span>';
    var pi = $('lpf-pi');
    if (produto) {
      var cs = coresProduto(produto), ts = tamanhosProduto(produto);
      pi.style.display = 'block';
      pi.innerHTML = '<button type="button" class="x" id="lpf-px">Tirar</button>📦 <b>' + esc(produto.name || 'Produto') + '</b>' +
        '<div style="display:flex;gap:8px;margin-top:6px"><div style="flex:1"><label style="margin:0 0 3px;font-size:12.5px">Cor</label><input id="lpf-cor" list="lpf-cl" value="' + esc(produto._cor || '') + '"><datalist id="lpf-cl">' + cs.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></div>' +
        '<div style="flex:1"><label style="margin:0 0 3px;font-size:12.5px">Tamanho / modelo</label><input id="lpf-tam" list="lpf-tl" value="' + esc(produto._tam || '') + '"><datalist id="lpf-tl">' + ts.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></div></div>';
      $('lpf-px').onclick = function () { produto = null; desenhar(); };
      $('lpf-cor').oninput = function () { produto._cor = this.value; };
      $('lpf-tam').oninput = function () { produto._tam = this.value; };
    } else { pi.style.display = 'none'; pi.innerHTML = ''; }
  }
  $('lpf-g').addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (!b) return; fotos.splice(+b.getAttribute('data-rm'), 1); desenhar(); marcarGrelha(); });

  function grelha(urls, titulo) {
    if (!urls.length) { $('lpf-esc').innerHTML = '<p class="sub">' + esc(titulo.vazio) + '</p>'; return; }
    $('lpf-esc').innerHTML = '<p class="sub">' + esc(titulo.txt) + '</p><div class="gr">' + urls.map(function (u) { return '<img data-u="' + esc(u) + '" src="' + esc(u) + '" loading="lazy" alt="" class="' + (fotos.indexOf(u) > -1 ? 'on' : '') + '">'; }).join('') + '</div>';
  }
  function marcarGrelha() { Array.prototype.forEach.call($('lpf-esc').querySelectorAll('img[data-u]'), function (im) { im.classList.toggle('on', fotos.indexOf(im.getAttribute('data-u')) > -1); }); }
  $('lpf-esc').addEventListener('click', function (e) {
    var im = e.target.closest('img[data-u]');
    if (im) { var u = im.getAttribute('data-u'); if (fotos.indexOf(u) > -1) tirar(u); else juntar(u); desenhar(); marcarGrelha(); return; }
    var pb = e.target.closest('button[data-p]');
    if (pb) escolherProduto(pb.getAttribute('data-p'));
  });

  /* Do chat: imagens enviadas na conversa (pelo cliente ou pelo fornecedor) e fotos dos cartões de produto */
  $('lpf-chat').onclick = async function () {
    if (painel === 'chat') { painel = ''; $('lpf-esc').innerHTML = ''; return; }
    painel = 'chat'; $('lpf-esc').innerHTML = '<p class="sub">A carregar…</p>';
    try {
      var m = await api('mensagens?select=anexo_url,tipo,created_at&conversa_id=eq.' + conv.id + '&order=created_at.desc&limit=200');
      var l = []; (m || []).forEach(function (x) { if (x.anexo_url && /^https?:\/\//.test(x.anexo_url) && l.indexOf(x.anexo_url) < 0) l.push(x.anexo_url); });
      if (painel === 'chat') grelha(l, { txt: 'Toque nas fotos para juntar ao link:', vazio: 'Ainda não há fotos nesta conversa. Peça ao cliente para enviar com 📎, ou carregue.' });
    } catch (e) { $('lpf-esc').innerHTML = '<p class="sub">' + esc(e.message) + '</p>'; }
  };

  /* Dos meus produtos publicados */
  var meus = null;
  $('lpf-prod').onclick = async function () {
    if (painel === 'prod') { painel = ''; $('lpf-esc').innerHTML = ''; return; }
    painel = 'prod'; $('lpf-esc').innerHTML = '<p class="sub">A carregar…</p>';
    try {
      if (!meus) meus = await api('products?select=*&supplier_id=eq.' + eu + '&order=created_at.desc&limit=300') || [];
      if (painel !== 'prod') return;
      var l = meus.slice();
      if (conv.produto_id) l.sort(function (a, b) { return (String(b.id) === String(conv.produto_id)) - (String(a.id) === String(conv.produto_id)); });
      $('lpf-esc').innerHTML = l.length ? '<p class="sub">Escolha o produto:</p><div class="pl">' + l.map(function (p) {
        var f = fotosProduto(p)[0];
        return '<button type="button" data-p="' + esc(p.id) + '">' + (f ? '<img src="' + esc(f) + '" alt="">' : '<i></i>') + '<span>' + esc(p.name || 'Produto') + '</span><small>' + esc(Number(p.price || 0).toLocaleString('pt-PT') + ' ' + (p.currency || '')) + '</small></button>';
      }).join('') + '</div>' : '<p class="sub">Ainda não tem produtos publicados.</p>';
    } catch (e) { $('lpf-esc').innerHTML = '<p class="sub">' + esc(e.message) + '</p>'; }
  };
  function escolherProduto(id) {
    var p = (meus || []).filter(function (x) { return String(x.id) === String(id); })[0]; if (!p) return;
    produto = p; p._cor = ''; p._tam = '';
    if (!$('lp-d').value.trim()) $('lp-d').value = p.name || '';
    if (!Number($('lp-p').value) && Number(p.price)) $('lp-p').value = p.price;
    if (p.currency) { var s = $('lp-m'); if (![].some.call(s.options, function (o) { return o.value === p.currency; })) s.insertAdjacentHTML('beforeend', '<option>' + esc(p.currency) + '</option>'); s.value = p.currency; }
    ['lp-p', 'lp-m'].forEach(function (i) { $(i).dispatchEvent(new Event('input')); });
    var fs = fotosProduto(p); if (fs.length && !fotos.length) juntar(fs[0]);
    desenhar();
    grelha(fs, { txt: 'Fotos deste produto — toque para juntar:', vazio: 'Este produto não tem fotos.' });
  }

  /* Carregar do aparelho (passa pelo filtro de imagens com contactos, como no chat) */
  $('lpf-file').onchange = async function () {
    var lista = [].slice.call(this.files || []); this.value = '';
    for (var i = 0; i < lista.length; i++) {
      var f = lista[i];
      if (fotos.length >= MAX) { erro('Máximo de ' + MAX + ' fotos.'); break; }
      try {
        if (window.FiltroImagem) {
          var r = await window.FiltroImagem.verificar(f, function (t) { erro(t); });
          if (!r.ok) { erro(r.motivo); continue; }
        }
        erro('A enviar a foto ' + (i + 1) + ' de ' + lista.length + '…');
        var t = await token();
        var ext = f.type === 'image/png' ? 'png' : (f.type === 'image/webp' ? 'webp' : 'jpg');
        var caminho = conv.id + '/link-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext;
        var up = await fetch(U + '/storage/v1/object/chat-imagens/' + caminho, { method: 'POST', headers: { apikey: K, Authorization: 'Bearer ' + (t || K), 'Content-Type': f.type, 'x-upsert': 'false' }, body: f });
        if (!up.ok) throw new Error('Não foi possível enviar a foto ' + (i + 1) + '.');
        juntar(U + '/storage/v1/object/public/chat-imagens/' + caminho); desenhar(); erro('');
      } catch (e) { erro(e.message || String(e)); }
    }
  };

  /* Abrir a janela: começa sempre limpo */
  $('bb-lp').addEventListener('click', function () { fotos = []; produto = null; painel = ''; $('lpf-esc').innerHTML = ''; desenhar(); });
  desenhar();

  /* ---------- enviar o link (substitui o botão do chat-pagamento.js, agora com fotos) ---------- */
  function num(v) { return Number(String(v || '').replace(',', '.')) || 0; }
  function dinheiro(v, m) { return Number(v || 0).toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + ' ' + (m || ''); }
  function semContacto(t) { return !t || !window.FiltroContactos || window.FiltroContactos.verificar(t).ok; }
  $('lp-ok').onclick = async function () {
    var b = this; erro('');
    var desc = $('lp-d').value.trim(), q = Math.floor(num($('lp-q').value)), p = num($('lp-p').value), e = num($('lp-e').value), m = $('lp-m').value, z = $('lp-z').value;
    var cor = produto ? String(produto._cor || '').trim() : '', tam = produto ? String(produto._tam || '').trim() : '';
    if (desc.length < 3) return erro('Escreva o que o cliente vai pagar.');
    if (q < 1) return erro('A quantidade tem de ser 1 ou mais.');
    if (p <= 0) return erro('Escreva o preço unitário.');
    if (e < 0) return erro('O envio não pode ser negativo.');
    if (!fotos.length) return erro('Junte pelo menos 1 foto do que o cliente vai pagar.');
    if (!semContacto(desc) || !semContacto(cor) || !semContacto(tam)) return erro('O texto tem contactos ou links. Não é permitido.');
    var t = Math.round((q * p + e) * 100) / 100;
    var opcoes = [cor && 'Cor: ' + cor, tam && 'Tamanho: ' + tam].filter(Boolean).join(' · ') || null;
    b.disabled = true;
    try {
      var r;
      try {
        r = await api('links_pagamento', 'POST', { conversa_id: String(conv.id), vendedor_id: eu, cliente_id: conv.cliente_id, descricao: desc, quantidade: q, preco_unitario: p, envio: e, total: t, moeda: m, prazo_dias: z ? Number(z) : null, fotos: fotos, produto_id: produto ? produto.id : null, opcoes: opcoes });
      } catch (er) {
        if (/fotos|produto_id|opcoes|column|schema cache/i.test(er.message)) throw new Error('Falta correr o SQL das fotos do link no Supabase.');
        throw er;
      }
      var L = r && r[0]; if (!L) throw new Error('Não foi possível criar o link.');
      await api('mensagens', 'POST', { conversa_id: conv.id, remetente_id: eu, tipo: 'texto', texto: '💳 Link de pagamento: ' + desc + ' — ' + dinheiro(t, m), dados: { pagamento: { id: L.id } } });
      $('bb-lpm').style.display = 'none'; $('lp-d').value = ''; $('lp-p').value = ''; $('lp-e').value = '0'; $('lp-q').value = '1';
      fotos = []; produto = null; desenhar();
      await window.carregar(true);
    } catch (er2) { erro(er2.message || String(er2)); }
    finally { b.disabled = false; }
  };

  /* ---------- desenho das mensagens: igual ao chat-pagamento.js + fotos no cartão ---------- */
  var links = {};
  function corpoProduto(x) {
    var q = x.dados && x.dados.produto;
    return '<a class="bb-pc" target="_top" href="produto-bbabilonia.html?id=' + esc(q.id) + '">' + (x.anexo_url ? '<img loading="lazy" src="' + esc(x.anexo_url) + '">' : '') +
      '<b>' + esc(q.nome || 'Produto') + '</b><span>' + esc(q.preco || '') + '</span><em>Ver produto ›</em></a>';
  }
  function corpoPagamento(x) {
    var L = links[x.dados.pagamento.id];
    if (!L) return '<div class="bb-pg"><div class="h">💳 LINK DE PAGAMENTO</div>' + esc(x.texto) + '</div>';
    var fs = arr(L.fotos).map(urlDe).filter(Boolean);
    var est = L.estado === 'pago' ? '<span class="e ok">✅ Pago</span>' : (L.estado === 'cancelado' ? '<span class="e no">Cancelado</span>' : '');
    var acao = '';
    if (L.estado === 'por_pagar') {
      if (String(L.cliente_id) === String(eu)) acao = '<a class="pagar" target="_top" href="pagar-link-v2.html?id=' + esc(L.id) + '">Pagar agora</a>';
      else acao = '<span class="e">⏳ A aguardar pagamento</span><button class="cx" data-cancelar="' + esc(L.id) + '">Cancelar este link</button>';
    }
    return '<div class="bb-pg"><div class="h">💳 LINK DE PAGAMENTO</div>' +
      (fs.length ? '<div class="fs">' + fs.map(function (u) { return '<a href="' + esc(u) + '" target="_blank"><img loading="lazy" src="' + esc(u) + '" alt=""></a>'; }).join('') + '</div>' : '') +
      '<b>' + esc(L.descricao) + '</b>' +
      (L.opcoes ? '<div class="l">' + esc(L.opcoes) + '</div>' : '') +
      '<div class="l">' + esc(L.quantidade) + ' × ' + dinheiro(L.preco_unitario, L.moeda) + '</div>' +
      (Number(L.envio) ? '<div class="l">Envio: ' + dinheiro(L.envio, L.moeda) + '</div>' : '') +
      (L.prazo_dias ? '<div class="l">Prazo de produção: ' + esc(L.prazo_dias) + ' dias</div>' : '') +
      (L.produto_id ? '<a class="pr" target="_top" href="produto-bbabilonia.html?id=' + esc(L.produto_id) + '">Ver o produto publicado ›</a>' : '') +
      '<div class="t">' + dinheiro(L.total, L.moeda) + '</div>' + est + acao + '</div>';
  }
  window.carregar = async function (forcar) {
    var m = await api('mensagens?select=*&conversa_id=eq.' + conv.id + '&order=created_at.asc');
    var temPg = m.some(function (x) { return x.dados && x.dados.pagamento; });
    var ls = [];
    if (temPg) { try { ls = await api('links_pagamento?select=*&conversa_id=eq.' + encodeURIComponent(String(conv.id))); } catch (e) { ls = []; } }
    var marca = m.length + ':' + (m.length ? m[m.length - 1].id : '') + ':' + ls.map(function (l) { return l.estado; }).join(',');
    if (!forcar && marca === ultimo) return;
    ultimo = marca; links = {}; ls.forEach(function (l) { links[l.id] = l; });
    var box = $('msgs');
    var perto = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    box.innerHTML = m.map(function (x) {
      var meu = x.remetente_id === eu, corpo;
      if (x.dados && x.dados.pagamento) corpo = corpoPagamento(x);
      else if (x.dados && x.dados.produto) corpo = corpoProduto(x);
      else if (x.tipo === 'endereco') corpo = cartao(x.dados);
      else if (x.tipo === 'imagem') corpo = '<a href="' + esc(x.anexo_url) + '" target="_blank"><img class="foto" loading="lazy" src="' + esc(x.anexo_url) + '"></a>';
      else corpo = esc(x.texto);
      return '<div class="m' + (meu ? ' eu' : '') + (x.tipo === 'endereco' ? ' end' : '') + '">' + corpo + '<small>' + hora(x.created_at) + '</small></div>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('[data-cancelar]'), function (bt) {
      bt.onclick = async function () {
        if (!confirm('Cancelar este link de pagamento? O cliente já não poderá pagar por ele.')) return;
        bt.disabled = true;
        try { await api('links_pagamento?id=eq.' + encodeURIComponent(bt.getAttribute('data-cancelar')), 'PATCH', { estado: 'cancelado' }); await window.carregar(true); }
        catch (e) { alert(e.message); bt.disabled = false; }
      };
    });
    if (forcar || perto) box.scrollTop = box.scrollHeight;
  };
  try { if (typeof conv !== 'undefined' && conv && vista === 'chat') window.carregar(true); } catch (e) {}
})();

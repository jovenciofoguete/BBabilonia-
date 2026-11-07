/* rastreio-ligar.js — BBabilônia: liga o rastreamento em tempo real (rastreio.html) às páginas existentes.
   pedidos.html (cliente): no detalhe do pedido mostra a última atualização do envio, ao vivo, e o botão "Ver rastreamento".
   fornecedor-envios.html (vendedor): em cada pedido "Enviado" põe o botão "Atualizar rastreamento".
   Não altera nada do que já existe: só acrescenta. */
(function () {
  if (window.BBRastreioLigar) return; window.BBRastreioLigar = 1;
  var pg = location.pathname.split('/').pop() || '';
  var sb = window.sb;
  if (!sb && window.supabase) sb = window.supabase.createClient('https://dsfoqoeawvjafypycldz.supabase.co', 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0');
  if (!sb) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function quando(d) { try { return new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  function nomePais(c) { if (!c) return ''; try { return new Intl.DisplayNames([navigator.language || 'pt', 'pt'], { type: 'region' }).of(c) || c; } catch (e) { return c; } }

  var css = document.createElement('style');
  css.textContent = '#bb-rast{background:#fff;border-radius:18px;padding:14px;margin-bottom:12px;box-shadow:0 6px 18px #0ea5e91a}' +
    '#bb-rast h3{font-size:15px;margin-bottom:8px;display:flex;align-items:center;gap:8px}' +
    '#bb-rast .vv{font-size:11.5px;font-weight:800;color:#047857;background:#d1fae5;border-radius:999px;padding:2px 8px;display:inline-flex;align-items:center;gap:4px}' +
    '#bb-rast .vv i{width:7px;height:7px;border-radius:50%;background:#10b981;animation:bbp 1.2s infinite}@keyframes bbp{50%{opacity:.25}}' +
    '#bb-rast .ul{display:flex;gap:10px;align-items:flex-start;font-size:14px}#bb-rast .ul span.e{font-size:22px;line-height:1}' +
    '#bb-rast .ul b{display:block}#bb-rast .ul small{color:#64748b;display:block;margin-top:2px}' +
    '#bb-rast a.vr,.bb-rast-bt{display:block;text-align:center;margin-top:10px;padding:12px;border-radius:14px;background:linear-gradient(90deg,#10b981,#0ea5e9);color:#fff!important;font-weight:800;text-decoration:none;font-size:14.5px}';
  document.head.appendChild(css);

  /* ---------- cliente: detalhe do pedido ---------- */
  if (pg === 'pedidos.html') {
    var atual = null, pedindo = 0, ultimo = null, canal = null;
    function idAberto() { try { if (window.aberto) return String(window.aberto); } catch (e) {} return new URLSearchParams(location.search).get('pedido'); }
    function caixa(dados, id) {
      var det = document.getElementById('det'); if (!det || det.classList.contains('hide')) return;
      var velho = document.getElementById('bb-rast'); if (velho) velho.remove();
      var ev = (dados.eventos || [])[0];
      if (!dados.enviado && !ev) return;
      var lugar = ev ? [ev.local_cidade, nomePais(ev.local_pais)].filter(Boolean).join(', ') : '';
      var d = document.createElement('div'); d.id = 'bb-rast';
      d.innerHTML = '<h3>📍 Rastreamento <span class="vv"><i></i>Ao vivo</span></h3>' +
        (ev ? '<div class="ul"><span class="e">' + esc((ev.rotulo || '').split(' ')[0]) + '</span><div><b>' + esc((ev.rotulo || ev.estado).replace(/^\S+\s/, '')) + '</b>' +
          (lugar ? '<small>📍 ' + esc(lugar) + '</small>' : '') + '<small>' + quando(ev.created_at) + '</small></div></div>' : '<div class="ul"><small>A aguardar a primeira atualização.</small></div>') +
        '<a class="vr" href="rastreio.html?pedido=' + encodeURIComponent(id) + '">Ver rastreamento completo ›</a>';
      var primeira = det.querySelector('.box');
      if (primeira) primeira.insertAdjacentElement('afterend', d); else det.insertBefore(d, det.firstChild);
    }
    async function buscar(id) {
      var n = ++pedindo;
      var r = await sb.rpc('rastreio_info', { p_pedido: id });
      if (n !== pedindo || r.error || !r.data) return;
      ultimo = { id: id, dados: r.data };
      if (idAberto() === id) caixa(r.data, id);
    }
    function ouvir(id) {
      if (canal) { try { sb.removeChannel(canal); } catch (e) {} canal = null; }
      try { canal = sb.channel('rast-cli-' + id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rastreio_eventos', filter: 'pedido_id=eq.' + id }, function () { buscar(id); }).subscribe(); } catch (e) {}
    }
    function verificar() {
      var det = document.getElementById('det');
      if (!det || det.classList.contains('hide')) { atual = null; return; }
      var id = idAberto(); if (!id) return;
      if (id !== atual) { atual = id; ultimo = null; buscar(id); ouvir(id); return; }
      if (!document.getElementById('bb-rast') && ultimo && ultimo.id === id) caixa(ultimo.dados, id);
    }
    new MutationObserver(verificar).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    setInterval(function () { if (!document.hidden && atual) buscar(atual); }, 30000);
    verificar();
    return;
  }

  /* ---------- vendedor: pedidos enviados ---------- */
  if (pg === 'fornecedor-envios.html') {
    var mapa = null, aCarregar = false;
    async function carregarMapa() {
      if (aCarregar) return; aCarregar = true;
      var r = await sb.rpc('pedidos_do_fornecedor');
      var l = r.data || []; if (!Array.isArray(l)) l = [];
      mapa = {}; l.forEach(function (p) { mapa[String(p.id).slice(0, 8)] = String(p.id); });
      aCarregar = false; botoes();
    }
    function botoes() {
      document.querySelectorAll('#lista .ped:not([data-id])').forEach(function (c) {
        if (c.querySelector('.bb-rast-bt')) return;
        var t = c.querySelector('.l1 span'); if (!t) return;
        var curto = (t.textContent.match(/Pedido\s+(\S+)/) || [])[1]; if (!curto) return;
        if (!mapa) { carregarMapa(); return; }
        var id = mapa[curto]; if (!id) return;
        var a = document.createElement('a'); a.className = 'bb-rast-bt'; a.href = 'rastreio.html?pedido=' + encodeURIComponent(id); a.textContent = '📍 Atualizar rastreamento';
        c.appendChild(a);
      });
    }
    new MutationObserver(botoes).observe(document.body, { childList: true, subtree: true });
    botoes();
  }
})();

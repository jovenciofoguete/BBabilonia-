/* disputa-equipa.js — BBabilônia (13/11/2026)
   A disputa fica aberta a todos os envolvidos: cliente, fornecedor, agentes de atendimento, o agente de busca que tratou
   e enviou o pedido, e o dono. Quem não é cliente nem fornecedor (nem o agente responsável pelo caso) entra como "equipa":
   vê a disputa completa (todas as mensagens e provas) e pode responder ao cliente, ao fornecedor ou aos dois.
   Não altera disputa-a/b/c.js: acrescenta por cima. */
(function () {
  if (window.__bbDispEq) return; window.__bbDispEq = 1;
  QUEM.agente = ['Agente de busca BBabilônia', '🛡️'];
  var css = document.createElement('style');
  css.textContent = '.msg.agente .av{background:#047857}';
  document.head.appendChild(css);
  var EQ = null, NOMEP = { dono: 'dono da plataforma', atendimento: 'Atendimento', busca: 'agente de busca' };

  /* carregar: igual ao original, mas quem é da equipa também vê a disputa */
  carregar = async function () {
    try { await sb.rpc('rever_prazos'); } catch (e) {}
    var d = null; EQ = null;
    if (DID) { var r = await sb.from('disputas').select('*').eq('id', DID).maybeSingle(); d = r.data; }
    else if (PED) { var r2 = await sb.from('disputas').select('*').eq('order_id', String(PED)).order('created_at', { ascending: false }).limit(1); d = (r2.data || [])[0] || null; if (d && d.estado === 'cancelada' && !Q.get('ver')) d = null; }
    if (!d || (String(d.cliente_id) !== eu.id && String(d.vendedor_id) !== eu.id)) {
      try { var x = await sb.rpc('disputa_ver', { p_id: DID || (d && d.id) || null, p_pedido: (!DID && PED) ? String(PED) : null }); if (!x.error && x.data) { EQ = x.data; if (!d) d = EQ.disputa; } } catch (e) {}
    }
    var pid = d ? d.order_id : PED;
    if (pid) {
      var o = await sb.from('orders').select('*').eq('id', pid).maybeSingle(); ped = o.data || null;
      if (!ped && EQ) ped = EQ.pedido || null;
      if (!ped && d) { var pf = await sb.rpc('pedidos_do_fornecedor'); (pf.data || []).forEach(function (x) { if (String(x.id) === String(pid)) ped = x; }); }
      if (!ped && d) { var pa = await sb.rpc('pedido_da_disputa', { p_id: d.id }); ped = (pa.data || [])[0] || null; }
    }
    if (!d) {
      if (!ped) { $('app').innerHTML = '<div class="box">Pedido não encontrado.</div>'; return; }
      formNova(); return;
    }
    disp = d;
    var m = await sb.from('disputa_mensagens').select('*').eq('disputa_id', d.id).order('created_at'); msgs = m.data || [];
    papeis = []; if (String(d.cliente_id) === eu.id) papeis.push('cliente'); if (String(d.vendedor_id) === eu.id) papeis.push('fornecedor');
    if (window.atdCarregar) await atdCarregar(d);
    if (window.ATD && (ATD.pode || ATD.fila)) papeis.push('admin');
    if (EQ && papeis.indexOf('admin') < 0) { papeis.push('equipa'); if (EQ.mensagens) msgs = EQ.mensagens; }
    if (!papeis.length) { $('app').innerHTML = '<div class="box">Esta disputa não é da sua conta.' + (window.ATD && ATD.semCodigo ? ' Entre primeiro pelo <a href="atendimento.html">Atendimento</a> e espere a aprovação.' : '') + '</div>'; return; }
    if (papeis.indexOf(papel) < 0) { var pq = Q.get('como'); papel = papeis.indexOf(pq) > -1 ? pq : (papeis.indexOf('equipa') > -1 && papeis.length > 1 ? papeis[0] : papeis[0]); }
    ver();
  };

  /* painel de resposta da equipa */
  var _painel = painelAcoes, _ligar = ligarAcoes, EPARA = 'todos', ET = '';
  painelAcoes = function (aberta) {
    if (papel !== 'equipa') return _painel(aberta);
    if (!aberta) return '<div class="box"><p class="inf" style="margin:0">Esta disputa já tem decisão final.</p></div>';
    return '<div class="box" id="acoes"><h3>💬 Responder na disputa <span style="font-size:12px;color:var(--suave)">(como ' + esc(NOMEP[EQ && EQ.papel] || 'equipa BBabilônia') + ')</span></h3>' +
      '<div class="papel" id="para">' + [['todos', 'Cliente e fornecedor'], ['cliente', 'Só cliente'], ['fornecedor', 'Só fornecedor']].map(function (o) { return '<button data-epara="' + o[0] + '" class="' + (EPARA === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<textarea id="et" rows="3" maxlength="2000" placeholder="Escreva a mensagem">' + esc(ET) + '</textarea>' + R.html('rp') +
      '<button class="bt a" id="emsg">Enviar mensagem</button><div class="err" id="am2"></div></div>';
  };
  ligarAcoes = function () {
    if (papel !== 'equipa') return _ligar();
    function guarda() { var t = $('et'); if (t) ET = t.value; }
    R.ligar('rp', function () { guarda(); ver(); var a = $('acoes'); if (a) a.scrollIntoView({ block: 'start' }); }, function (t) { $('am2').textContent = t; });
    document.querySelectorAll('[data-epara]').forEach(function (b) { b.onclick = function () { guarda(); EPARA = b.getAttribute('data-epara'); ver(); var a = $('acoes'); if (a) a.scrollIntoView({ block: 'start' }); }; });
    var bt = $('emsg'); if (!bt) return;
    bt.onclick = async function () {
      guarda(); var m = $('am2'), t = ET.trim(); m.textContent = '';
      if (!t && !R.l.length) { m.textContent = 'Escreva uma mensagem.'; return; }
      if (!textoOk(t)) { m.textContent = 'O texto tem contactos, links ou redes sociais. Não é permitido.'; return; }
      bt.disabled = true;
      try {
        var urls = await R.enviar('rp', bt);
        var r = await sb.rpc('disputa_equipa_msg', { p_id: disp.id, p_texto: t, p_provas: JSON.stringify(urls), p_para: EPARA });
        if (r.error) throw new Error(r.error.message);
        R = new Provas(); ET = ''; carregar();
      } catch (e) { m.textContent = e.message || String(e); bt.disabled = false; bt.textContent = 'Enviar mensagem'; }
    };
  };

  /* a seta ← da página leva a equipa ao seu painel (e não à página do cliente) */
  $('voltar').onclick = function () {
    if (papel === 'equipa' || papel === 'admin') { location.href = /^(admin|administrator)\./i.test(location.hostname) ? '/' : (EQ && EQ.papel === 'busca' ? 'confirmar-produto.html' : 'atd-verificacoes.html?f=disputas'); return; }
    if (history.length > 1) history.back(); else location.href = 'pedidos.html';
  };

  if (typeof abrir === 'function') abrir();
})();

/* checkout-levantamento.js — BBabilônia (14/11/2026)
   Carregado pelo pais-cliente.js no checkout.html.
   Cliente em Moçambique (o país que escolheu) + todos os produtos do carrinho de lojas em Moçambique:
   a única forma de pagamento é "💵 Levantamento M-Pesa / e-Mola" — o cliente paga direto à BBabilônia
   e a BBabilônia paga o fornecedor. Depois de criar o pedido abre levantamento.html (números da
   BBabilônia + provas). Os outros clientes e países continuam com cartão, cripto e M-Pesa como antes.
   O servidor (PARTE 11) só dá o pedido como pago depois de o atendimento confirmar as provas. */
(function () {
  if (window.__bbLev) return; window.__bbLev = 1;
  var d = document, $ = function (i) { return d.getElementById(i); };
  if (!$('continuar') || !$('pag') || !$('dados')) return;
  var TXT = 'Pagar com levantamento direto na BBabilônia e a BBabilônia paga o fornecedor.';

  var css = d.createElement('style');
  css.textContent = 'body.bb-lev #lc,body.bb-lev #lx,body.bb-lev #bb-lmp{display:none!important}' +
    '#bb-llev{display:none}body.bb-lev #bb-llev{display:block!important;flex:1 1 100%;border-color:#d9a93f!important;background:#1d2335!important;text-align:left!important}' +
    '#bb-llev b{display:block;font-size:16px}#bb-llev small{display:block;margin-top:4px;color:#e9ecf2;font-size:13.5px;line-height:1.4}' +
    '#bb-lev-aviso{display:none;margin:10px 0;padding:10px 12px;border-radius:10px;background:#2a2110;border:1px solid #d9a93f;color:#ffe9b3;font-size:14px;line-height:1.45}';
  d.head.appendChild(css);

  /* opção levantamento ao lado das outras (só aparece em Moçambique) */
  var r1 = d.querySelector('input[name=m]'); if (!r1) return;
  var grupo = r1.closest('.op') || r1.closest('label').parentNode;
  var op = d.createElement('label'); op.id = 'bb-llev';
  op.innerHTML = '<input type="radio" name="m" value="levantamento"><b>💵 Levantamento M-Pesa / e-Mola</b><small>' + TXT + '</small>';
  grupo.appendChild(op); grupo.style.flexWrap = 'wrap';
  var aviso = d.createElement('div'); aviso.id = 'bb-lev-aviso';
  $('continuar').insertAdjacentElement('beforebegin', aviso);

  function itens() { try { return JSON.parse(localStorage.getItem('carrinho') || '[]') || []; } catch (e) { return []; } }
  var ids = Array.from(new Set(itens().map(function (i) { return String(i.id || i.produto_id || i.product_id || ''); }).filter(Boolean)));
  var cartMZ = null;   // null = a confirmar; true/false = resposta do servidor
  function perguntar(n) {
    if (!ids.length || typeof sb === 'undefined') { cartMZ = false; aplicar(); return; }
    sb.rpc('bb_carrinho_mz', { p_produtos: ids }).then(function (r) {
      if (r.error) { if ((n || 0) < 3) setTimeout(function () { perguntar((n || 0) + 1); }, 2000); else { cartMZ = false; aplicar(); } return; }
      cartMZ = r.data === true; aplicar();
    }, function () { if ((n || 0) < 3) setTimeout(function () { perguntar((n || 0) + 1); }, 2000); });
  }
  function clienteMZ() { try { return window.BBPais && window.BBPais.obter() === 'MZ'; } catch (e) { return false; } }
  function ativo() { return cartMZ === true && clienteMZ(); }
  var radio = op.querySelector('input');
  function metodo() { var r = d.querySelector('input[name=m]:checked'); return r ? r.value : ''; }
  function aplicar() {
    var a = ativo();
    d.body.classList.toggle('bb-lev', a);
    if (a && metodo() !== 'levantamento') { radio.checked = true; }
    if (!a && metodo() === 'levantamento') { var c = d.querySelector('input[name=m][value=cartao]'); if (c) { c.checked = true; try { c.onchange && c.onchange(); } catch (e) {} } }
    if (a) { var dc = $('dica'); if (dc && dc.textContent) dc.textContent = ''; }
  }
  /* o checkout e o M-Pesa mudam a escolha quando se escreve o país da morada: em Moçambique volta sempre ao levantamento */
  setInterval(aplicar, 400);
  try { window.BBPais && window.BBPais.aoMudar(function () { aplicar(); }); } catch (e) {}
  perguntar(0);

  /* o levantamento precisa de conta (as provas ficam na conta do cliente) */
  async function temConta() { try { var r = await sb.auth.getSession(); return !!(r && r.data && r.data.session); } catch (e) { return false; } }
  var liberado = false;
  window.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#continuar') : null;
    /* só o toque da pessoa (os outros scripts do checkout repetem o clique depois de verificar: esse passa) */
    if (!b || liberado || !ativo() || !e.isTrusted) return;
    e.preventDefault(); e.stopImmediatePropagation();
    temConta().then(function (ok) {
      if (!ok) {
        aviso.innerHTML = '🔐 <b>Para pagar por levantamento entre na sua conta</b> (em cima, em "Os seus endereços de entrega"). As provas do pagamento ficam guardadas na sua conta.';
        aviso.style.display = 'block'; aviso.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
      }
      aviso.style.display = 'none';
      radio.checked = true;
      liberado = true; try { b.click(); } finally { liberado = false; }
    });
  }, true);

  /* depois de criar o pedido: em vez do cartão/cripto/M-Pesa, abre a página do levantamento */
  var original = window.iniciar;
  if (typeof original === 'function') {
    window.iniciar = function (m) {
      if (m !== 'levantamento') return original.apply(this, arguments);
      var pid = null; try { pid = id; } catch (e) {}
      if (!pid) { $('msg').textContent = 'Não foi possível criar o pedido. Tente outra vez.'; return Promise.resolve(); }
      try { localStorage.removeItem('carrinho'); } catch (e) {}
      $('msg').textContent = ''; $('pag').hidden = false;
      $('taxas').innerHTML = '💵 Pedido criado. A abrir o pagamento por levantamento…';
      location.href = 'levantamento.html?pedido=' + encodeURIComponent(pid);
      return Promise.resolve();
    };
  }
  window.BBLevantamento = { ativo: ativo, estado: function () { return { cartMZ: cartMZ, clienteMZ: clienteMZ() }; } };
})();

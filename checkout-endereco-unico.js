(function () {
  var T_INT = 'Endereço de entrega interna: é o endereço do agente de transporte no país do fornecedor. Se você está no mesmo país do fornecedor, é o seu endereço final.';
  var T_EXT = 'Endereço de entrega internacional: é o endereço onde quer receber o produto, quando o fornecedor envia direto para o seu país. Ou o endereço onde o agente de carga fará o envio direto, no país onde você está.';
  var RE_AZUL = /os seus endere[çc]os de entrega/i;
  var RE_PAGAMENTO = /\b(mastercard|visa|cripto|usdt)\b/i;
  var agendado = false;

  function acharPorTexto(re) {
    var els = document.querySelectorAll('h1,h2,h3,h4,h5,strong,b,p,div,span,label');
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].textContent || '').trim();
      if (els[i].childElementCount <= 2 && t.length < 80 && re.test(t)) return els[i];
    }
    return null;
  }

  function ocultarAmarelo() {
    var bs = document.querySelectorAll('button,a,input[type=button],input[type=submit]');
    for (var i = 0; i < bs.length; i++) {
      var t = bs[i].textContent || bs[i].value || '';
      if (!/continuar e pagar/i.test(t)) continue;
      var el = bs[i], niveis = 0;
      while (el.parentElement && el.parentElement !== document.body && niveis < 3) {
        var pt = el.parentElement.textContent || '';
        if (RE_AZUL.test(pt) || RE_PAGAMENTO.test(pt)) break;
        el = el.parentElement;
        niveis++;
      }
      if (el.getAttribute('data-bb-oculto') !== '1') {
        el.setAttribute('data-bb-oculto', '1');
        el.style.display = 'none';
      }
    }
  }

  function colocar(id, re, texto) {
    if (document.getElementById(id)) return;
    var h = acharPorTexto(re);
    if (!h) return;
    var d = document.createElement('div');
    d.id = id;
    d.style.cssText = 'margin:8px 0;padding:10px;border-radius:8px;background:#eef6ff;color:#1a3b5c;font-size:13px;line-height:1.45';
    d.textContent = texto;
    h.insertAdjacentElement('beforebegin', d);
  }

  function inserirTextos() {
    colocar('bb-txt-interno', /^\W*entrega interna\b/i, T_INT);
    colocar('bb-txt-internacional', /^\W*entrega internacional/i, T_EXT);
  }

  function rodar() {
    agendado = false;
    try { ocultarAmarelo(); inserirTextos(); } catch (e) {}
  }

  function agendar() {
    if (agendado) return;
    agendado = true;
    setTimeout(rodar, 300);
  }

  document.addEventListener('DOMContentLoaded', agendar);
  new MutationObserver(agendar).observe(document.documentElement, { childList: true, subtree: true });
  agendar();
})();

/* filtro-contactos.js - BBabilonia (versao 2, corrigida)
   Bloqueia contactos, links e convites para fora da plataforma */
(function () {
  'use strict';

  var MSG = 'Não pode enviar contactos, links, convites ou pagamentos fora da plataforma.';

  function limpar(t) {
    t = String(t || '').toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return t.replace(/\s+/g, ' ').trim();
  }

  function compacto(t) {
    return t.replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
      .replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
      .replace(/[$]/g, 's').replace(/!/g, 'i').replace(/@/g, 'a')
      .replace(/[^a-z]/g, '');
  }

  var LONGAS = ['whatsapp', 'whatsap', 'watsap', 'instagram', 'facebook', 'telegram',
    'snapchat', 'messenger', 'wechat', 'weixin', 'tiktok', 'yupoo', 'reddit', 'skype',
    'viber', 'discord', 'linkedin', 'pinterest', 'alibaba', 'aliexpress', 'taobao',
    'dhgate', 'paypal', 'westernunion', 'moneygram', 'twitter', 'gmail', 'hotmail',
    'yahoo', 'outlook', 'icloud', 'protonmail'];

  var CURTAS = new RegExp('(^|[^a-z0-9])(wpp|zap|zapzap|insta|fb|inbox|pix|iban|nib|kwai|1688)([^a-z0-9]|$)');

  var PERMITIDOS = [
    /\b(vestidos?|fatos?|trajes?|roupas?|looks?|conjuntos?|saias?|blusas?|sapatos?|outfits?|dresses?)\s+(de|para)\s+convidad[oa]s?\b/g,
    /\bconvites?\s+(de|para)\s+(casamento|noiva|noivado|aniversario|batizado|festa|formatura)\b/g,
    /\bconvidad[oa]s?\b/g
  ];

  var CONTEXTO_CONVITE = /\b(grupo|canal|site|link|plataforma|comunidade|pagina|perfil|app|aplicativo|entre|entra|entrar|clique|clica|click|acesse|aceda|visite|siga|join|qr)\b/;

  var REGRAS = [
    [/(https?:\/\/|www\.)\S+/, 'Não pode enviar links ou sites.'],
    [/\b(t\.me|wa\.me|bit\.ly|goo\.gl|tinyurl|linktr\.ee|fb\.com|ig\.me)\b/, 'Não pode enviar links ou sites.'],
    [/\b[a-z0-9-]{2,}\.(com|net|org|cn|mz|br|pt|io|me|app|shop|store|xyz|info|ly|gl|link|site|online|top|cc|co)\b/, 'Não pode enviar links ou sites.'],
    [/\b[a-z0-9-]{2,}\s?[(\[]ponto[)\]]\s?[a-z]{2,}/, 'Não pode enviar links ou sites.'],
    [/[a-z0-9._%+-]+\s?@\s?[a-z0-9-]+/, 'Não pode enviar emails.'],
    [/@\s?[a-z0-9._]{3,}/, 'Não pode enviar contas de redes sociais.'],
    [/\bqr\b|\bqrcode\b|\bcodigo\s*qr\b/, 'Não pode enviar códigos QR.'],
    [/\b(meu|minha|meus|minhas|nosso|nossa|nossos|nossas|my|our)\s+(contato|contacto|contatos|contactos|whats|zap|email|e-mail|perfil|canal|grupo|site|link|plataforma|app|aplicativo|comunidade|contact|profile|channel|group|website)\b/, 'Não pode indicar contactos ou outros sites/plataformas.'],
    [/\b(chama|chame|chamar|liga|ligue|ligar|adiciona|adicione|add|segue|siga|procura|procure|encontra|encontre|contacta|contacte|contata|contate)(-(me|nos)|\s+me)\b/, 'Não pode pedir contacto fora da plataforma.'],
    [/\b(me|nos)\s+(chama|chame|liga|ligue|adiciona|adicione|add|segue|siga|contacta|contacte|contata|contate)\b/, 'Não pode pedir contacto fora da plataforma.'],
    [/\b(mande|manda|mandar|envie|envia|enviar|escreva|escreve|deixe|deixa)(?:-me|\s+me)?\s+(uma\s+)?(mensagem|msg|sms|dm|mail|email|e-mail)\s+(pelo|pela|via|nesse|nessa|neste|nesta)\b/, 'Não pode pedir mensagens fora da plataforma.'],
    [/fora da plataforma|fora do site|fora daqui|fora do chat|fora da loja|em privado|no privado|chat privado|outra plataforma|outro app|outro canal|diretamente comigo|direto comigo|negociar direto|negociamos direto|falar direto|fale direto|\b(pagar|pagamento|negociar|vender|comprar|tratar|combinar|resolver|falar)\s+(\w+\s+)?por fora\b/, 'Tudo tem de ser tratado dentro da plataforma.'],
    [/\bconta bancaria\b/, 'Não pode combinar pagamentos fora da plataforma.'],
    [/\b(pagar|pague|pagamento|transferir|transfira|transferencia|depositar|deposite|deposito|enviar|envie)\b[^.!?]{0,25}\b(minha conta|minha carteira)\b/, 'Não pode combinar pagamentos fora da plataforma.'],
    [/\b(clique|clica|clicar|click)\b[^.!?]{0,25}\b(link|site|aqui|grupo|canal|perfil|qr|codigo|contato|contacto)\b/, 'Não pode pedir para clicar em links.'],
    [/\b(acesse|acessa|aceda|acede|visite|visita|siga|segue|subscreva|inscreva|inscreve|escaneie|escaneia|escanear|scan|join|junte|junta)\s+(?:(?:o|a|os|as|no|na|nos|nas|em|ao|neste|nesse|nesta|nessa|nosso|nossa|meu|minha|este|esse|esta|essa)\s+)?(?:\w+\s+){0,2}?(link|site|canal|grupo|perfil|comunidade|qr|codigo|contato|contacto)\b/, 'Não pode convidar para sites, grupos ou canais.'],
    [/\b(entre|entra|entrem|entrar)\s+(?:(?:ja|agora)\s+)?(?:no|na|nos|nas|em|para|pelo|pela|neste|nesse|nesta|nessa|nosso|nossa)\s+(?:\w+\s+){0,2}?(link|site|canal|grupo|perfil|comunidade|contato|contacto)\b/, 'Não pode convidar para sites, grupos ou canais.']
  ];

  var DATA = /\b(0?[1-9]|[12]\d|3[01])[\/.\-](0?[1-9]|1[0-2])[\/.\-](19|20)\d\d\b/g;
  var CTX_MEDIDA = /tamanh|medida|numeracao|size|altura|cintura|peito|ombro|manga|busto|quadril|comprimento|largura|calcad|sapato|calca|cinto|cabelo|polegada|inch/;
  var PALAVRA_NUM = '(?:zero|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|one|two|three|four|five|six|seven|eight|nine)';
  var CORRIDA = new RegExp('\\b(?:' + PALAVRA_NUM + '[\\s,.\\-]+){5,}' + PALAVRA_NUM + '\\b');

  function listaTamanhos(g, ctx) {
    var n = g.map(Number), i;
    for (i = 0; i < n.length; i++) {
      if (isNaN(n[i]) || g[i].length > 3) return false;
    }
    var passo = true;
    for (i = 1; i < n.length; i++) {
      var d = n[i] - n[i - 1];
      if (d < 0 || d > 10) { passo = false; break; }
    }
    if (passo) return true;
    if (ctx) {
      for (i = 0; i < n.length; i++) { if (n[i] > 300) return false; }
      return true;
    }
    return false;
  }

  function numeroContacto(t) {
    var ctx = CTX_MEDIDA.test(t);
    var s = t.replace(DATA, ' ')
      .replace(/\d+(?:[.,\s]\d+)*\s?(?:cm|mm|m|kg|g|ml|l|pol|polegadas?|tn|tnl|tnlds|ton|toneladas?|pcs|pecas?|unidades?|un|dias?|mzn|mt|usd|eur|kw|kv|w|v|ah|gb|tb|mb|hz|rpm|cv|hp|km|kms)\b/g, ' ')
      .replace(/\d+(?:[.,\s]\d+)*\s?[$%"]/g, ' ')
      .replace(/(?:\b(?:mzn|usd|eur|mt)\s?|\$\s?)\d+(?:[.,\s]\d+)*/g, ' ')
      .replace(/\d+(?:[.,]\d+)?\s?[x*]\s?\d+(?:[.,]\d+)?(?:\s?[x*]\s?\d+(?:[.,]\d+)?)?/g, ' ');

    if (/\b\d{8,}\b/.test(s)) return true;

    var achados = s.match(/\+?\d[\d\s.,;\-()]{6,}\d/g) || [];
    for (var i = 0; i < achados.length; i++) {
      var m = achados[i].trim().replace(/(\d{1,2})[.,]5(?!\d)/g, '$1');
      var digitos = m.replace(/\D/g, '');
      if (digitos.length < 8) continue;
      if (/^(\+|00)/.test(m)) return true;
      var grupos = m.split(/[\s.,;\-()]+/).filter(Boolean);
      var unicos = grupos.filter(function (g) { return g.length === 1; }).length;
      if (unicos >= 6) return true;
      if (listaTamanhos(grupos, ctx)) continue;
      return true;
    }

    if (CORRIDA.test(t)) return true;
    return false;
  }

  function verificar(texto) {
    var t = limpar(texto);
    if (!t) return { ok: true, motivo: '' };

    var i;
    for (i = 0; i < REGRAS.length; i++) {
      if (REGRAS[i][0].test(t)) return { ok: false, motivo: REGRAS[i][1] };
    }

    var c = compacto(t);
    for (i = 0; i < LONGAS.length; i++) {
      if (c.indexOf(LONGAS[i]) !== -1) return { ok: false, motivo: 'Não pode indicar outras redes, apps ou plataformas.' };
    }
    if (CURTAS.test(t)) return { ok: false, motivo: 'Não pode indicar outras redes, apps ou plataformas.' };

    var sem = t;
    for (i = 0; i < PERMITIDOS.length; i++) sem = sem.replace(PERMITIDOS[i], ' ');
    if (/\bconvid\w*|\binvit(e|o|amos)\b/.test(sem)) return { ok: false, motivo: 'Não pode enviar convites.' };
    if (/\b(convites?|invites?)\b/.test(sem) && CONTEXTO_CONVITE.test(sem)) return { ok: false, motivo: 'Não pode enviar convites para grupos, canais ou sites.' };

    if (numeroContacto(t)) return { ok: false, motivo: 'Não pode enviar números de contacto.' };

    return { ok: true, motivo: '' };
  }

  function ligar(campo, botao, aviso) {
    if (!campo) return function () { return true; };
    if (campo.__filtroAtualizar) return campo.__filtroAtualizar;
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.style.cssText = 'color:#d93025;font-size:13px;margin:4px 0;display:none';
      campo.parentNode.insertBefore(aviso, campo.nextSibling);
    }
    function atualizar() {
      var r = verificar(campo.value);
      if (botao) {
        botao.disabled = !r.ok;
        botao.style.opacity = r.ok ? '' : '0.4';
        botao.style.pointerEvents = r.ok ? '' : 'none';
      }
      aviso.textContent = r.ok ? '' : r.motivo;
      aviso.style.display = r.ok ? 'none' : 'block';
      return r.ok;
    }
    campo.addEventListener('input', atualizar);
    campo.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.keyCode === 13) && !atualizar()) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
    if (campo.form) {
      campo.form.addEventListener('submit', function (e) {
        if (!atualizar()) { e.preventDefault(); e.stopImmediatePropagation(); }
      }, true);
    }
    campo.__filtroAtualizar = atualizar;
    atualizar();
    return atualizar;
  }

  function auto() {
    var campos = document.querySelectorAll('[data-filtro]');
    for (var i = 0; i < campos.length; i++) {
      var c = campos[i];
      var b = c.getAttribute('data-filtro-botao');
      var a = c.getAttribute('data-filtro-aviso');
      ligar(c, b ? document.querySelector(b) : null, a ? document.querySelector(a) : null);
    }
  }

  var api = { verificar: verificar, ligar: ligar, mensagem: MSG };
  if (typeof window !== 'undefined') window.FiltroContactos = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
    else auto();
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(auto).observe(document.documentElement, { childList: true, subtree: true });
    }
  }
})();

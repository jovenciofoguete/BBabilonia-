/* chat-compacto.js — B-Babilônia: chat como no Alibaba — as mensagens ocupam quase o ecrã todo.
   Em baixo fica só uma linha: ➕ · caixa de escrever · Enviar. O ➕ abre: link de pagamento,
   respostas prontas, foto e endereço. Não apaga nada: só reorganiza os botões que já existem. */
(function () {
  var d = document, $ = function (i) { return d.getElementById(i); };
  if (!$('rodape') || !$('linha') || $('bb-mais')) return;
  var css = d.createElement('style');
  css.textContent =
    '#topo{padding:8px 12px!important;min-height:44px}' +
    '#bb-func{padding:3px 8px!important;font-size:11.5px!important}' +
    '#rodape{padding:6px 8px!important}' +
    '#bb-mais{flex:none;width:42px;height:42px;border:0;border-radius:50%;background:#111;color:#fff;font-size:24px;line-height:42px;padding:0;transition:transform .2s}' +
    '#bb-mais.on{transform:rotate(45deg);background:#555}' +
    '#bb-tray{display:none;flex-wrap:wrap;gap:8px;padding:8px 2px 10px;border-bottom:1px solid #eee;margin-bottom:6px;max-height:45vh;overflow:auto}' +
    '#bb-tray.on{display:flex}' +
    '#bb-tray>*{margin:0!important}' +
    '#bb-tray #bb-lp,#bb-tray #partilhar,#bb-tray #anexar{border:1px solid #ddd;border-radius:12px;padding:10px 12px!important;background:#fafafa;text-decoration:none!important;font-size:14px!important;font-weight:700;color:#111!important;width:auto!important;height:auto!important}' +
    '#bb-tray #anexar{gap:6px}' +
    '#bb-tray #bb-pq{width:100%;flex-wrap:wrap;overflow:visible!important;white-space:normal!important}' +
    '#linha{align-items:center}#enviar{height:42px;flex:none;padding:0 14px!important}#texto{height:42px;min-width:0;width:0}' +
    '.bb-pc img{max-height:140px!important}';
  d.head.appendChild(css);

  var linha = $('linha'), tray = d.createElement('div'); tray.id = 'bb-tray';
  linha.parentNode.insertBefore(tray, linha);
  var mais = d.createElement('button'); mais.id = 'bb-mais'; mais.type = 'button'; mais.setAttribute('aria-label', 'Mais opções'); mais.textContent = '+';
  linha.insertBefore(mais, linha.firstChild);
  function abre(s) { tray.classList.toggle('on', s); mais.classList.toggle('on', s); }
  mais.onclick = function () { abre(!tray.classList.contains('on')); };
  tray.addEventListener('click', function (e) { var b = e.target.closest('a,button'); if (b && !b.closest('select')) setTimeout(function () { abre(false); }, 50); });
  $('texto').addEventListener('focus', function () { abre(false); });

  var anexar = $('anexar');
  if (anexar && !anexar.querySelector('.bb-t')) { var t = d.createElement('span'); t.className = 'bb-t'; t.textContent = ' Foto'; anexar.appendChild(t); anexar.addEventListener('change', function () { abre(false); }); }
  function arruma() { ['bb-lp', 'partilhar', 'anexar', 'bb-pq'].forEach(function (i) { var e = $(i); if (e && e.parentNode !== tray) tray.appendChild(e); }); }
  arruma(); var n = 0, ti = setInterval(function () { arruma(); if (++n > 40) clearInterval(ti); }, 250);
})();

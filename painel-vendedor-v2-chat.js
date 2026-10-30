/* painel-vendedor-v2-chat.js — B-Babilônia: a conversa da sub-conta ocupa o ecrã inteiro
   (só a barra "← Voltar ao painel" em cima, sem o sino por cima do chat). Ficheiro novo, só estilo. */
(function () {
  var css = document.createElement("style");
  css.textContent =
    "#v-fmsg:not(.hide){position:fixed;inset:0;z-index:45;margin:0;padding:0;background:#fff;display:flex;flex-direction:column}" +
    "#v-fmsg:not(.hide) .voltar{flex:none;margin:8px 10px;box-shadow:none;background:#f3f0ff;align-self:flex-start}" +
    "#v-fmsg:not(.hide) .cx{flex:1;display:flex;margin:0;padding:0!important;border-radius:0;box-shadow:none;min-height:0}" +
    "#v-fmsg:not(.hide) iframe{flex:1;width:100%;height:auto!important;min-height:0!important}" +
    "body:has(#v-fmsg:not(.hide)){overflow:hidden}" +
    "body:has(#v-fmsg:not(.hide)) .bb-sino,body:has(#v-fmsg:not(.hide)) .bb-av{display:none!important}";
  document.head.appendChild(css);
})();

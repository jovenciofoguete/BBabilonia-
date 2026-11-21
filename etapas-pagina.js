/* etapas-pagina.js — BBabilônia (21/11/2026)
   Na página "Os meus pedidos" (pedidos.html), ao abrir uma encomenda mostra no topo as ETAPAS, uma a uma, com a
   etapa atual a laranja ("Em curso"). Em Moçambique incluem a cotação e o pagamento do transporte (o chat e os
   dados de pagamento continuam logo por baixo, no próprio pedido). Estrangeiros veem: pago, enviado, a caminho,
   chegou. Usa a função pedido_etapas_pref do Supabase e o avisos-pastas.js. */
(function () {
  if (window.__bbEtapasPag) return; window.__bbEtapasPag = 1;
  var d = document;
  function ligar() { try { if (window.sb && window.BBPastas) window.BBPastas.usar(window.sb); } catch (e) {} }
  function carregarModulo(ok) {
    if (window.BBPastas) { ligar(); return ok(); }
    var x = d.createElement("script"); x.src = "avisos-pastas.js?v=5"; x.onload = function () { ligar(); ok(); };
    (d.head || d.documentElement).appendChild(x);
  }
  var feito = "";
  function pintar() {
    var det = d.getElementById("det"); if (!det || det.classList.contains("hide")) { feito = ""; return; }
    var id = String(window.aberto || ""); if (!id) return;
    var cx = d.getElementById("bb-etapas");
    if (cx && cx.getAttribute("data-id") === id && det.contains(cx)) {
      if (feito === id + "|" + (cx.getAttribute("data-ok") || "")) return;
    }
    var b1 = det.querySelector(".box"); if (!b1) return;
    if (!cx || !det.contains(cx) || cx.getAttribute("data-id") !== id) {
      if (cx) cx.remove();
      cx = d.createElement("div"); cx.id = "bb-etapas"; cx.setAttribute("data-id", id);
      b1.insertAdjacentElement("afterend", cx);
      var barra = b1.querySelector(".linha"); if (barra) barra.style.display = "none"; /* as 4 bolinhas simples dão lugar às etapas completas */
    }
    var k = id.replace(/-/g, "").slice(0, 8).toUpperCase();
    carregarModulo(function () {
      var h = window.BBPastas.cartao(k, function () { feito = ""; pintar(); }, true);
      cx.innerHTML = h; cx.setAttribute("data-ok", /bbp-et/.test(h) ? "1" : "0");
      feito = id + "|" + cx.getAttribute("data-ok");
    });
  }
  /* 💬 chat com a BBabilônia (agentes de busca, atendimento e dono) desde o início da encomenda — Moçambique.
     Depois de recolhido, o chat do transporte (envio-cliente.js, com o pagamento do transporte) toma o lugar deste. */
  function pedidoAberto() { try { var id = window.aberto; return (window.pedidos || []).filter(function (x) { return String(x.id) === String(id); })[0] || null; } catch (e) { return null; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function quando(t) { try { return new Date(t).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  var cs = d.createElement("style");
  cs.textContent = "#bb-chat0 h3{margin:0 0 4px}#bb-chat0 .ms{max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin:10px 0}#bb-chat0 .b{max-width:86%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word;color:#0f172a}#bb-chat0 .b b{display:block;font-size:12.5px;color:#0f766e}#bb-chat0 .b small{display:block;font-size:11.5px;color:#64748b;margin-top:3px}#bb-chat0 .b.eu{align-self:flex-end;background:#dbeafe}#bb-chat0 .b.ou{align-self:flex-start;background:#f1f5f9}#bb-chat0 .sis{align-self:center;font-size:12.5px;color:#475569;background:#e2e8f0;border-radius:10px;padding:6px 10px;text-align:center}#bb-chat0 .es{display:flex;gap:6px}#bb-chat0 .es input{flex:1;min-width:0;padding:11px;border:2px solid #e2e8f0;border-radius:10px;font:inherit;font-size:15px;background:#fff;color:#0f172a}#bb-chat0 .es button{border:0;border-radius:10px;padding:0 16px;font:inherit;font-weight:800;background:#0ea5e9;color:#fff}#bb-chat0 .m{color:#dc2626;font-size:13.5px;margin-top:6px}";
  d.head.appendChild(cs);
  async function pintaChat(p) {
    var ms = d.getElementById("bb-c0-ms"); if (!ms) return;
    var r = await window.sb.rpc("envio_chat_ver", { p_order: String(p.id) });
    if (r.error) { ms.innerHTML = '<div class="sis">' + esc(r.error.message) + "</div>"; return; }
    var L = r.data || [];
    ms.innerHTML = L.length ? L.map(function (m) {
      if (m.tipo === "aviso") return '<div class="sis">' + esc(m.texto) + "</div>";
      var eu = m.autor === "cliente";
      return '<div class="b ' + (eu ? "eu" : "ou") + '"><b>' + (eu ? "Eu" : esc(m.nome || "BBabilônia")) + "</b>" + esc(m.texto || "") + "<small>" + esc(quando(m.criado_em)) + "</small></div>";
    }).join("") : '<div class="sis">Ainda não há mensagens. Escreva aqui: os agentes BBabilônia respondem.</div>';
    ms.scrollTop = ms.scrollHeight;
  }
  function chat0() {
    var det = d.getElementById("det"); if (!det || det.classList.contains("hide")) return;
    var cx = d.getElementById("bb-chat0"), p = pedidoAberto();
    /* se o chat do transporte já existe, este sai (não ficam dois chats) */
    if (d.getElementById("bb-env-ch") || !p || String(p.cliente_pais || "").toUpperCase() !== "MZ" || !window.sb) { if (cx) cx.remove(); return; }
    if (cx && cx.getAttribute("data-id") === String(p.id) && det.contains(cx)) return;
    if (cx) cx.remove();
    var e = d.getElementById("bb-etapas"); if (!e) return;
    cx = d.createElement("div"); cx.className = "box"; cx.id = "bb-chat0"; cx.setAttribute("data-id", String(p.id));
    cx.innerHTML = '<h3>💬 Chat com a BBabilônia</h3><small style="color:#64748b">Fale com os agentes de busca e o atendimento sobre esta encomenda. O agente envia aqui o pagamento do transporte.</small><div class="ms" id="bb-c0-ms"><div class="sis">A carregar…</div></div><div class="es"><input id="bb-c0-in" maxlength="1000" placeholder="Escreva uma mensagem"><button type="button" id="bb-c0-en">Enviar</button></div><div class="m" id="bb-c0-m"></div>';
    e.insertAdjacentElement("afterend", cx);
    var enviar = async function () {
      var i = d.getElementById("bb-c0-in"), t = i.value.trim(); if (!t) return;
      var b = d.getElementById("bb-c0-en"); b.disabled = true;
      var x = await window.sb.rpc("envio_chat_enviar", { p_order: String(p.id), p_texto: t }); b.disabled = false;
      if (x.error) { d.getElementById("bb-c0-m").textContent = x.error.message; return; }
      d.getElementById("bb-c0-m").textContent = ""; i.value = ""; pintaChat(p);
    };
    d.getElementById("bb-c0-en").onclick = enviar;
    d.getElementById("bb-c0-in").onkeydown = function (ev) { if (ev.key === "Enter") enviar(); };
    pintaChat(p);
  }
  setInterval(function () { if (!d.hidden && d.getElementById("bb-c0-ms")) { var p = pedidoAberto(); if (p) pintaChat(p); } }, 10000);
  setInterval(chat0, 1500);
  new MutationObserver(function () { setTimeout(pintar, 50); }).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  pintar();
})();

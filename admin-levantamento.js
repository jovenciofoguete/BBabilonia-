/* admin-levantamento.js — BBabilônia (14/11/2026): painel do dono (administrator.bbabilonia.com)
   Cartão "💵 Levantamento Moçambique": o dono escreve os números M-Pesa e e-Mola (e o nome) da BBabilônia
   para os clientes de Moçambique pagarem os produtos por levantamento, e vê os pagamentos para confirmar.
   Carregado pelo painel-admin-rececao.js. Não altera painel-admin.html nem os outros cartões.
   (O número do transporte continua em 👥 Agentes → "💳 Número de pagamento do envio".) */
(function () {
  if (window.__bbAdmLev) return; window.__bbAdmLev = 1;
  var $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function erroSql(e) { var t = String(e && e.message || e); return /function|find|relation|exist/i.test(t) ? "Falta correr o SQL novo (PARTE 11) no Supabase." : t; }
  function tel(n) { n = String(n || ""); return n.length === 9 ? n.slice(0, 2) + " " + n.slice(2, 5) + " " + n.slice(5) : n; }

  var tent = 0;
  (function arrancar() {
    var g = document.querySelector("#t-inicio .grid");
    if (typeof window.sb === "undefined" || !g || !$("t-extra")) { if (++tent < 120) setTimeout(arrancar, 150); return; }
    if (!$("bb-card-lev")) {
      var a = document.createElement("a");
      a.id = "bb-card-lev"; a.className = "c k6"; a.href = "#"; a.setAttribute("data-x", "levmz");
      a.innerHTML = '<span class="i">💵</span><b>Levantamento Moçambique</b><span>Números M-Pesa e e-Mola da BBabilônia e pagamentos dos clientes</span><span id="bb-lev-n" style="display:none;margin-top:6px;font-weight:800;color:#b91c1c"></span>';
      var ag = g.querySelector('a[href="admin-agentes.html"]');
      if (ag) ag.insertAdjacentElement("afterend", a); else g.appendChild(a);
      contar();
    }
  })();

  async function contar() {
    try {
      var r = await sb.rpc("levantamento_lista"); if (r.error) return;
      var n = (r.data || []).filter(function (x) { return x.estado === "por_confirmar"; }).length, s = $("bb-lev-n");
      if (s) { s.textContent = n ? "⏳ " + n + " por confirmar" : ""; s.style.display = n ? "block" : "none"; }
      var l = $("lev-pend"); if (l) l.textContent = n ? "⏳ " + n + " à espera de confirmação" : "Nenhum à espera de confirmação 👍";
    } catch (e) {}
  }

  function abrir() {
    var ex = $("t-extra"); if (!ex) return;
    ["t-inicio", "t-produtos", "t-pedidos"].forEach(function (x) { var e = $(x); if (e) e.classList.add("hide"); });
    document.querySelectorAll("#tabs button").forEach(function (b) { b.classList.remove("on"); });
    ex.innerHTML = '<button class="voltar" data-x="voltar">← Voltar ao início</button>' +
      '<div class="box"><b>💵 Levantamento Moçambique — números da BBabilônia</b>' +
      '<p style="font-size:13px;color:#64748b;margin:6px 0 0">Cliente em Moçambique a comprar a um fornecedor com loja em Moçambique: no checkout só aparece o pagamento por levantamento. O cliente envia o dinheiro para estes números, carrega as provas, o atendimento confirma e a BBabilônia paga o fornecedor. Só o dono pode mudar.</p>' +
      '<label style="display:block;margin-top:12px;font-weight:700">📱 M-Pesa (começa por 84 ou 85)</label><input id="lev-mp" inputmode="tel" placeholder="Ex.: 84 123 4567">' +
      '<input id="lev-mpn" placeholder="Nome que aparece na transferência M-Pesa" style="margin-top:6px">' +
      '<label style="display:block;margin-top:12px;font-weight:700">📱 e-Mola (começa por 86 ou 87)</label><input id="lev-em" inputmode="tel" placeholder="Ex.: 86 123 4567">' +
      '<input id="lev-emn" placeholder="Nome que aparece na transferência e-Mola" style="margin-top:6px">' +
      '<div class="row"><button class="bt" id="lev-gu" type="button">💾 Guardar</button></div><div class="msg" id="lev-m"></div></div>' +
      '<div class="box"><b>🧾 Pagamentos dos clientes</b><p style="font-size:13.5px;margin:6px 0 0" id="lev-pend">A contar…</p>' +
      '<div class="row"><a class="bt" href="atd-levantamento.html" style="display:block;text-align:center;text-decoration:none">Ver e confirmar pagamentos</a></div></div>';
    ex.classList.remove("hide"); window.scrollTo(0, 0);
    $("lev-gu").onclick = guardar;
    carregar(); contar();
  }
  function msg(t, bom) { var m = $("lev-m"); if (m) { m.className = "msg" + (bom ? "" : " e"); m.textContent = t || ""; } }
  async function carregar() {
    var r = await sb.rpc("admin_levantamento_definicoes_ver");
    if (r.error) { msg(erroSql(r.error)); return; }
    var d = r.data || {};
    $("lev-mp").value = tel(d.mpesa_numero); $("lev-mpn").value = d.mpesa_nome || "";
    $("lev-em").value = tel(d.emola_numero); $("lev-emn").value = d.emola_nome || "";
    if (!d.mpesa_numero && !d.emola_numero) msg("⚠️ Ainda não escreveu os números: os clientes de Moçambique não conseguem pagar por levantamento.");
  }
  async function guardar() {
    var b = this; msg(""); b.disabled = true;
    var r = await sb.rpc("admin_levantamento_definicoes", { p_mpesa: $("lev-mp").value, p_mpesa_nome: $("lev-mpn").value, p_emola: $("lev-em").value, p_emola_nome: $("lev-emn").value });
    b.disabled = false;
    if (r.error) { msg(erroSql(r.error)); return; }
    await carregar(); msg("✅ Guardado. Os clientes já veem estes números ao pagar.", true);
  }

  document.addEventListener("click", function (e) {
    var x = e.target && e.target.closest ? e.target.closest('[data-x="levmz"]') : null;
    if (!x) return; e.preventDefault(); abrir();
  });
  setInterval(function () { if (!document.hidden && $("bb-card-lev")) contar(); }, 30000);
})();

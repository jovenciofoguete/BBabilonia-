/* atendimento-rececao.js — B-Babilônia: os agentes confirmam a receção de um pedido.
   No painel do atendimento aparece a caixa "Confirmar receção de um pedido":
   escreve-se o número do pedido (os 8 primeiros caracteres chegam), vê-se o pedido e confirma-se.
   Liberta o valor para o vendedor. Não altera atendimento.html. */
(function () {
  if (!window.sb) return;
  function k(x) { return String(x || "").toLowerCase(); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function arr(x) { if (typeof x === "string") { try { x = JSON.parse(x); } catch (e) { x = []; } } return Array.isArray(x) ? x : []; }
  function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
  function data(d) { try { return d ? new Date(d).toLocaleDateString("pt-PT") : "—"; } catch (e) { return "—"; } }

  var css = document.createElement("style");
  css.textContent = "#bb-rec{margin-bottom:12px}#bb-rec h3{font-size:16px;margin-bottom:4px}#bb-rec p{font-size:13.5px;color:var(--suave,#64748b)}" +
    "#bb-rec .lin{display:flex;gap:8px;align-items:center}#bb-rec .lin input{flex:1;min-width:0}#bb-rec .lin button{width:auto;flex:none;margin:0;padding:13px 16px}" +
    "#bb-rec .ped{margin-top:10px;padding:12px;border-radius:12px;border:2px solid var(--linha,#e2e8f0);font-size:14px;line-height:1.55}" +
    "#bb-rec .er{color:#e11d48;font-weight:700;font-size:14px;margin-top:8px}#bb-rec .ok{color:#047857;font-weight:800;font-size:14.5px;margin-top:8px}";
  document.head.appendChild(css);

  function montar() {
    var painel = document.getElementById("painel"), lista = document.getElementById("lista");
    if (!painel || !lista || painel.classList.contains("hide") || document.getElementById("bb-rec")) return;
    var d = document.createElement("div"); d.id = "bb-rec"; d.className = "box";
    d.innerHTML = "<h3>✅ Confirmar receção de um pedido</h3><p>Quando o cliente disser que já recebeu, ou a entrega foi feita na logística dele. O valor fica disponível para o vendedor.</p>" +
      '<div class="lin"><input id="bb-rn" placeholder="Número do pedido (ex.: 1A2B3C4D)" autocomplete="off"><button class="bt" id="bb-rp" type="button">Procurar</button></div>' +
      '<div id="bb-rr"></div>';
    painel.insertBefore(d, lista);
    var inp = d.querySelector("#bb-rn");
    d.querySelector("#bb-rp").onclick = procurar;
    inp.onkeydown = function (e) { if (e.key === "Enter") procurar(); };
  }

  async function procurar() {
    var out = document.getElementById("bb-rr"), num = document.getElementById("bb-rn").value.trim(), b = document.getElementById("bb-rp");
    if (!num) { out.innerHTML = '<div class="er">Escreva o número do pedido.</div>'; return; }
    b.disabled = true; out.innerHTML = '<div class="ped">A procurar…</div>';
    var r = await sb.rpc("ver_pedido_equipa", { p_num: num });
    b.disabled = false;
    if (r.error) { out.innerHTML = '<div class="er">' + esc(r.error.message) + "</div>"; return; }
    mostrar(r.data);
  }

  function mostrar(p) {
    var out = document.getElementById("bb-rr"), its = arr(p.items), e = k(p.escrow_status), motivo = "";
    if (p.disputa_estado) motivo = "⚠️ Este pedido tem uma disputa aberta. Resolva a disputa primeiro.";
    else if (k(p.status).indexOf("cancel") > -1) motivo = "Este pedido está cancelado.";
    else if (/entregue|liberado/.test(e)) motivo = "✅ A receção deste pedido já foi confirmada.";
    else if (e !== "retido") motivo = "Este pedido ainda não foi pago.";
    var h = '<div class="ped"><b>Pedido ' + esc(String(p.id).slice(0, 8).toUpperCase()) + "</b> · " + esc(din(p.total, p.currency)) +
      "<br>Cliente: " + esc(p.customer_name || "—") + (p.country ? " · " + esc(p.country) : "") +
      "<br>Feito a " + data(p.created_at) + " · Enviado a " + data(p.enviado) +
      (p.rastreio ? "<br>🚚 " + esc(p.transportadora || "") + " " + esc(p.rastreio) : "") +
      its.slice(0, 5).map(function (i) { return "<br>• " + esc(i.nome || "Produto") + (i.cor || i.tamanho ? " (" + esc([i.cor, i.tamanho].filter(Boolean).join(" · ")) + ")" : "") + " × " + esc(i.qtd || 1); }).join("") +
      "</div>";
    h += motivo ? '<div class="er">' + motivo + "</div>" : '<button class="bt v" id="bb-rc" type="button">✅ Confirmar receção</button><div id="bb-rm"></div>';
    out.innerHTML = h;
    var c = document.getElementById("bb-rc");
    if (c) c.onclick = async function () {
      if (!confirm("Confirmar a receção do pedido " + String(p.id).slice(0, 8).toUpperCase() + "?\nO valor fica disponível para o vendedor. Não dá para desfazer.")) return;
      c.disabled = true;
      var r = await sb.rpc("confirmar_rececao_equipa", { p_pedido: String(p.id) });
      var m = document.getElementById("bb-rm");
      if (r.error) { c.disabled = false; m.innerHTML = '<div class="er">' + esc(r.error.message) + "</div>"; return; }
      c.remove(); m.innerHTML = '<div class="ok">✅ Receção confirmada. O vendedor foi avisado e o valor ficou disponível.</div>';
    };
  }

  new MutationObserver(montar).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  montar();
})();

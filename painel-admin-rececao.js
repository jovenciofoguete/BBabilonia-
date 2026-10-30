/* painel-admin-rececao.js — B-Babilônia: o dono confirma a receção de um pedido.
   Nos detalhes de cada pedido com valor retido aparece "✅ Confirmar receção".
   Liberta o valor para o vendedor (igual a quando o cliente confirma).
   Não altera painel-admin.html: só acrescenta o botão. */
(function () {
  if (!window.sb) return;
  function k(x) { return String(x || "").toLowerCase(); }
  function lista() { try { return window.pedidos || pedidos || []; } catch (e) { return []; } }
  function podeConfirmar(p) {
    return p && k(p.escrow_status) === "retido" && !p.disputa_estado && k(p.status).indexOf("cancel") < 0;
  }

  var css = document.createElement("style");
  css.textContent = ".bb-rec{margin-top:12px;padding:12px;border-radius:12px;background:#ecfdf5;border:1px solid #a7f3d0}" +
    ".bb-rec button{display:block;width:100%;padding:13px;border:0;border-radius:12px;font:inherit;font-size:15px;font-weight:800;color:#fff;background:linear-gradient(90deg,#10b981,#059669)}" +
    ".bb-rec button:disabled{opacity:.5}.bb-rec small{display:block;margin-top:6px;color:#065f46;font-size:12.5px;line-height:1.4}" +
    ".bb-rec .er{color:#e11d48;font-weight:700}";
  document.head.appendChild(css);

  function pintar() {
    var caixas = document.querySelectorAll("#olista [data-o]");
    for (var i = 0; i < caixas.length; i++) {
      var c = caixas[i], sel = c.querySelector("[data-s]");
      if (!sel || c.querySelector(".bb-rec")) continue;
      var id = c.getAttribute("data-o");
      var p = lista().filter(function (x) { return String(x.id) === id; })[0];
      if (!podeConfirmar(p)) continue;
      // "Entregue" na lista só mudava o estado sem libertar o valor: aqui usa-se o botão
      var op = sel.querySelector('option[value="entregue"]'); if (op) op.remove();
      var d = document.createElement("div"); d.className = "bb-rec";
      d.innerHTML = '<button type="button">✅ Confirmar receção</button>' +
        "<small>Use quando tiver a certeza de que o cliente recebeu (ou a entrega foi feita na logística do cliente). O valor fica disponível para o vendedor.</small><small class=\"er\"></small>";
      var m = c.querySelector("[data-m]");
      if (m) m.insertAdjacentElement("afterend", d); else c.appendChild(d);
      ligar(d, p);
    }
  }

  function ligar(d, p) {
    var b = d.querySelector("button"), er = d.querySelector(".er");
    b.onclick = async function () {
      if (!confirm("Confirmar a receção do pedido " + String(p.id).slice(0, 8) + "?\nO valor fica disponível para o vendedor. Não dá para desfazer.")) return;
      b.disabled = true; er.textContent = "";
      var r = await sb.rpc("confirmar_rececao_equipa", { p_pedido: String(p.id) });
      if (r.error) { b.disabled = false; er.textContent = r.error.message; return; }
      var o = await sb.from("orders").select("*").eq("id", p.id).limit(1);
      if (o.data && o.data[0]) Object.assign(p, o.data[0]);
      else Object.assign(p, { escrow_status: "entregue", status: "recebido" });
      try { pintarPedidos(); } catch (e) { b.textContent = "✅ Receção confirmada"; }
    };
  }

  new MutationObserver(pintar).observe(document.body, { childList: true, subtree: true });
  pintar();
})();

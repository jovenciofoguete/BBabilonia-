/* pedido-minimo.js — B-Babilônia
   1) Painel do vendedor: botão "Eliminar" em cada produto + campo "Pedido mínimo" no Editar.
   2) Registar produto: campo "Pedido mínimo (peças)" ao lado do preço.
   3) Página de produto: mostra o pedido mínimo e não deixa adicionar menos.
   4) Carrinho: não deixa finalizar com menos peças do que o pedido mínimo.
   Não altera os outros ficheiros: só acrescenta. Coluna usada: products.pedido_minimo */
(function () {
  if (window.__bbPedidoMinimo) return; window.__bbPedidoMinimo = 1;
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var d = document;
  function minDe(p) { var v = Math.floor(Number(p && (p.pedido_minimo || p.min_order || p.moq)) || 1); return v > 1 ? v : 1; }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pecas(n) { return n + (n === 1 ? " peça" : " peças"); }

  /* ================= 1) PAINEL DO VENDEDOR ================= */
  if (window.PVsec && typeof PVsec.editar === "function") {
    var X = null, sync0 = PVsec.sync;
    PVsec.sync = function (x) { X = x; return sync0.apply(this, arguments); };

    var css = d.createElement("style");
    css.textContent = ".bt.bb-del{color:#b91c1c;background:#fee2e2}.ln.bb-l{flex-wrap:wrap}.ln.bb-l .t{flex:1 1 calc(100% - 60px)}.ln.bb-l .ac{width:100%;justify-content:flex-end;flex-wrap:wrap}";
    d.head.appendChild(css);

    /* botão Eliminar ao lado de Editar / Ver */
    function poeBotoes() {
      d.querySelectorAll(".ln .ac [data-ed]").forEach(function (b) {
        var ac = b.parentNode; if (ac.querySelector(".bb-del")) return;
        var ln = ac.closest(".ln"); if (ln) ln.classList.add("bb-l");
        var x = d.createElement("button"); x.type = "button"; x.className = "bt bb-del"; x.textContent = "Eliminar";
        x.setAttribute("data-del", b.getAttribute("data-ed")); ac.appendChild(x);
      });
    }
    new MutationObserver(poeBotoes).observe(d.body, { childList: true, subtree: true });
    poeBotoes();

    function prodDe(id) { return X && X.D ? X.D.prods.filter(function (p) { return String(p.id) === String(id); })[0] : null; }
    function fecha() { d.getElementById("modal").classList.remove("on"); }

    async function eliminar(p) {
      var m = d.getElementById("dM"), b = d.getElementById("dS"); m.className = "msg"; m.textContent = "A eliminar…"; b.disabled = true;
      var filtro = "products?id=eq." + encodeURIComponent(p.id) + "&supplier_id=eq." + X.S.user.id;
      try {
        var r = await X.api(filtro, "DELETE");
        if (!r || !r.length) throw new Error("Não foi eliminado: sem permissão para este produto. Confirme a impressão digital e tente de novo.");
        X.D.prods = X.D.prods.filter(function (q) { return String(q.id) !== String(p.id); });
        fecha(); X.aviso("Produto eliminado."); X.desenhar();
      } catch (e) {
        if (/foreign key|23503|still referenced/i.test(e.message)) {   // o produto tem encomendas ligadas: oculta em vez de apagar
          try {
            var o = await X.api(filtro, "PATCH", { active: false });
            if (o && o.length) Object.assign(p, o[0]);
            fecha(); X.aviso("Este produto tem encomendas ligadas, por isso foi ocultado: os clientes já não o veem."); X.desenhar(); return;
          } catch (e2) { e = e2; }
        }
        m.textContent = e.message; b.disabled = false;
      }
    }

    d.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("[data-del]") : null; if (!t) return;
      e.preventDefault(); e.stopPropagation();
      if (PVsec.sync && X === null) return;
      var p = prodDe(t.getAttribute("data-del")); if (!p) return;
      d.getElementById("modalCx").innerHTML = '<h2>Eliminar produto?</h2><p style="margin:8px 0 14px">«' + esc(p.name || "Produto") + '» vai ser apagado da sua loja. Isto não se pode desfazer.</p>' +
        '<button class="bt g bb-del" id="dS" style="width:100%">Sim, eliminar</button><button class="bt g" id="dN" style="margin-top:8px;width:100%">Cancelar</button><p class="msg" id="dM"></p>';
      d.getElementById("modal").classList.add("on");
      d.getElementById("dN").onclick = fecha;
      d.getElementById("dS").onclick = function () { eliminar(p); };
    }, true);

    /* campo "Pedido mínimo" dentro do Editar (o resto do Editar fica igual) */
    var editar0 = PVsec.editar;
    PVsec.editar = function (id) {
      var r = editar0.apply(this, arguments);
      var p = prodDe(id), g = d.getElementById("eG"); if (!p || !g || d.getElementById("eMin")) return r;
      var lb = d.createElement("label"); lb.className = "lb"; lb.textContent = "Pedido mínimo (peças por compra)";
      var inp = d.createElement("input"); inp.className = "cp"; inp.id = "eMin"; inp.type = "number"; inp.min = "1"; inp.step = "1"; inp.inputMode = "numeric"; inp.value = minDe(p);
      g.parentNode.insertBefore(lb, g); g.parentNode.insertBefore(inp, g);
      var guardar0 = g.onclick;
      g.onclick = async function () {
        var v = Math.floor(Number(inp.value)), m = d.getElementById("eM");
        if (!(v >= 1)) { m.className = "msg"; m.textContent = "Escreva o pedido mínimo: 1 ou mais peças."; return; }
        if (v !== minDe(p)) {
          g.disabled = true;
          try {
            var o = await X.api("products?id=eq." + encodeURIComponent(p.id) + "&supplier_id=eq." + X.S.user.id, "PATCH", { pedido_minimo: v });
            if (!o || !o.length) throw new Error("Não foi guardado: sem permissão para este produto.");
            Object.assign(p, o[0]);
          } catch (e) { m.className = "msg"; m.textContent = /pedido_minimo/.test(e.message) ? "Falta correr no Supabase o SQL do pedido mínimo." : e.message; g.disabled = false; return; }
          g.disabled = false;
        }
        return guardar0 ? guardar0.apply(this, arguments) : undefined;
      };
      return r;
    };
    return;
  }

  /* ================= 2) REGISTAR PRODUTO ================= */
  var preco = d.getElementById("preco");
  if (preco && preco.tagName === "INPUT" && d.getElementById("sv") && typeof sb !== "undefined") {
    if (!d.getElementById("pedMin")) {
      var lb = d.createElement("label"); lb.textContent = "Pedido mínimo (peças por compra)";
      var inp = d.createElement("input"); inp.id = "pedMin"; inp.type = "number"; inp.min = "1"; inp.step = "1"; inp.inputMode = "numeric"; inp.value = "1";
      var dica = d.createElement("div"); dica.style.cssText = "font-size:12px;color:#6b7280;margin:2px 0 8px";
      dica.textContent = "O cliente só pode comprar a partir desta quantidade (soma de todas as cores e tamanhos). Deixe 1 se vende à peça.";
      var depois = d.getElementById("moeda") || preco;
      depois.parentNode.insertBefore(dica, depois.nextSibling);
      depois.parentNode.insertBefore(inp, dica);
      depois.parentNode.insertBefore(lb, inp);
    }
    var sv = d.getElementById("sv"), sv0 = sv.onclick;
    sv.onclick = function (e) {
      var v = Math.floor(Number(d.getElementById("pedMin").value));
      if (!(v >= 1)) { var m = d.getElementById("m"); if (m) m.textContent = "Preencha: Pedido mínimo (1 ou mais peças)"; d.getElementById("pedMin").focus(); return; }
      return sv0 ? sv0.call(this, e) : undefined;
    };
    var from0 = sb.from.bind(sb);
    sb.from = function (t) {
      var q = from0(t);
      if (t === "products" && q && q.insert) {
        var ins0 = q.insert.bind(q);
        q.insert = function (row, o) {
          try { var v = Math.floor(Number(d.getElementById("pedMin").value)); if (v >= 1 && row && !Array.isArray(row)) row.pedido_minimo = v; } catch (e) {}
          return ins0(row, o);
        };
      }
      return q;
    };
    return;
  }

  /* ================= 3) PÁGINA DE PRODUTO ================= */
  if (d.getElementById("add") && d.getElementById("cores") && typeof window.totais === "function") {
    var totais0 = window.totais;
    function noCarrinho() {
      var n = 0; try { JSON.parse(localStorage.getItem("carrinho") || "[]").forEach(function (i) { if (window.P && String(i.id) === String(P.id)) n += Number(i.qtd) || 0; }); } catch (e) {}
      return n;
    }
    function mostrarMin() {
      if (!window.P) return;
      var mn = minDe(P), el = d.getElementById("bb-min");
      if (mn <= 1) { if (el) el.remove(); return; }
      if (!el) {
        el = d.createElement("div"); el.id = "bb-min";
        el.style.cssText = "display:inline-block;margin:6px 0;background:#FFF4EC;color:#9a3412;border:1px solid #fed7aa;border-radius:8px;padding:4px 10px;font:600 13px system-ui,sans-serif";
        var pr = d.getElementById("preco"); if (pr && pr.parentNode) pr.parentNode.insertBefore(el, pr.nextSibling); else return;
      }
      el.textContent = "Pedido mínimo: " + pecas(mn);
    }
    function verificarMin() {
      try {
        mostrarMin();
        if (window.P) {
          var mn = minDe(P), n = 0;
          escolhidos().forEach(function (x) { n += x.q; });
          var falta = mn - noCarrinho() - n;
          if (n > 0 && falta > 0) {
            d.getElementById("add").disabled = true;
            d.getElementById("resumo").textContent = "Pedido mínimo: " + pecas(mn) + " (faltam " + falta + ")";
          }
        }
      } catch (e) {}
    }
    window.totais = function () { var r = totais0.apply(this, arguments); verificarMin(); return r; };
    /* a página pode ter ligado o total antigo aos campos antes deste ficheiro: verifica também depois de cada mudança */
    d.addEventListener("input", function () { setTimeout(verificarMin, 0); });
    d.addEventListener("change", function () { setTimeout(verificarMin, 0); });
    d.addEventListener("click", function () { setTimeout(verificarMin, 0); });
    var esperar = setInterval(function () { if (window.P) { clearInterval(esperar); window.totais(); } }, 300);
    setTimeout(function () { clearInterval(esperar); }, 30000);
    return;
  }

  /* ================= 4) CARRINHO ================= */
  if (d.getElementById("rodape") && d.getElementById("lista") && typeof window.desenhar === "function") {
    var MIN = {}, NOMES = {}, pedidos = {};
    var desenhar0 = window.desenhar;
    function lerCarrinho() { try { var r = JSON.parse(localStorage.getItem("carrinho") || "[]"); return Array.isArray(r) ? r : []; } catch (e) { return []; } }
    function idI(i) { return i.id || i.produto_id || i.product_id || ""; }
    function verificar() {
      var soma = {}, falta = [];
      lerCarrinho().forEach(function (i) { var k = idI(i); if (!k) return; soma[k] = (soma[k] || 0) + (Number(i.qtd) || 0); NOMES[k] = i.nome || i.name || "Produto"; });
      var semInfo = Object.keys(soma).filter(function (k) { return !(k in MIN) && !pedidos[k]; });
      if (semInfo.length) {
        semInfo.forEach(function (k) { pedidos[k] = 1; });
        fetch(SUPA + "/rest/v1/products?select=id,pedido_minimo&id=in.(" + semInfo.join(",") + ")", { headers: { apikey: KEY, Authorization: "Bearer " + KEY } })
          .then(function (r) { return r.ok ? r.json() : []; })
          .then(function (a) { (a || []).forEach(function (p) { MIN[p.id] = minDe(p); }); semInfo.forEach(function (k) { if (!(k in MIN)) MIN[k] = 1; }); verificar(); })
          .catch(function () { semInfo.forEach(function (k) { delete pedidos[k]; }); });
      }
      Object.keys(soma).forEach(function (k) { if ((MIN[k] || 1) > soma[k]) falta.push("«" + NOMES[k] + "»: pedido mínimo " + pecas(MIN[k]) + " (tem " + soma[k] + ")"); });
      var btn = d.getElementById("btn"), av = d.getElementById("bb-min-av");
      if (!falta.length) { if (av) av.remove(); return; }
      if (btn) btn.disabled = true;
      if (!av) {
        av = d.createElement("div"); av.id = "bb-min-av";
        av.style.cssText = "background:#FFF4EC;color:#9a3412;border:1px solid #fed7aa;border-radius:10px;padding:10px 12px;margin:8px 0;font:600 13.5px system-ui,sans-serif";
        var rod = d.getElementById("rodape"); rod.parentNode.insertBefore(av, rod);
      }
      av.innerHTML = "Aumente a quantidade para finalizar:<br>" + falta.map(esc).join("<br>");
    }
    window.desenhar = function () { var r = desenhar0.apply(this, arguments); try { verificar(); } catch (e) {} return r; };
    verificar();
  }
})();

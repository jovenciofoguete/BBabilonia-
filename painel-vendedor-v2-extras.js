/* painel-vendedor-v2-extras.js — B-Babilônia: novidades do painel do vendedor (como no Alibaba)
   - 🧰 Gestão em massa (#massa): escolher vários produtos e publicar, ocultar, mudar o preço, ajustar o preço em %,
     pôr o mesmo stock em todas as cores e tamanhos, duplicar e exportar a lista (Excel/CSV)
   - ⬇️ Exportar encomendas (Excel/CSV) na página Encomendas
   - Conta: fechar a loja (e reabrir), apagar a conta
   Não altera os outros ficheiros do painel: só acrescenta. */
(function () {
  if (window.__bbPVExtras) return; window.__bbPVExtras = 1;
  var tent = 0;
  function arrancar() { if (!window.PVsec || !window.PVpecas) { if (++tent < 60) setTimeout(arrancar, 150); return; } iniciar(); }
  arrancar();

  function iniciar() {
    var H = window.PVpecas, esc = H.esc, num = H.num, arr = H.arr, k = H.k;
    var X = null, SEL = {};
    var MARCA = '<div class="sec">Produtos</div><div class="grid">';

    var main = document.querySelector("main.conteudo");
    if (main && !document.getElementById("v-massa")) { var sec = document.createElement("section"); sec.id = "v-massa"; sec.className = "hide"; main.appendChild(sec); }
    var css = document.createElement("style");
    css.textContent = ".mx-bar{position:sticky;top:0;z-index:5;background:#fff;border-radius:14px;padding:10px;box-shadow:0 4px 14px #4c1d9522;margin-bottom:10px}" +
      ".mx-bar .lin{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.mx-bar .lin .bt{margin:0}" +
      ".mx-ln{display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--li)}.mx-ln:first-of-type{border-top:0}" +
      ".mx-ln input[type=checkbox]{width:22px;height:22px;flex:none}.mx-ln img,.mx-ln .sf{flex:none;width:46px;height:46px;border-radius:8px;object-fit:cover;background:#f3f3f3}" +
      ".mx-ln .t{flex:1;min-width:0}.mx-ln .t b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mx-ln .t span{font-size:12.5px;color:var(--su)}" +
      ".zona-perigo{border:2px solid #fecaca}.zona-perigo .bt{background:#fee2e2;color:#b91c1c}";
    document.head.appendChild(css);

    var sync0 = PVsec.sync;
    PVsec.sync = function (x) { X = x; sync0(x); };

    /* ---------- cartão no início ---------- */
    var ini = PVsec.V.inicio;
    PVsec.V.inicio = function () {
      var b = !X || !X.aprovada;
      var c = '<a class="c c1' + (b ? " bloq" : "") + '" href="#massa"' + (b ? " data-bloq" : "") + '><span class="i">🧰</span><b>Gestão em massa</b><span>Preço, stock, ocultar e duplicar vários produtos de uma vez</span></a>';
      return ini().replace(MARCA, MARCA + c);
    };

    /* ---------- página Gestão em massa ---------- */
    PVsec.V.massa = function () {
      if (!X || !X.aprovada) return H.bloqueado("Gestão em massa");
      var P = X.D.prods || [], n = Object.keys(SEL).filter(function (id) { return SEL[id]; }).length;
      return '<div class="mx-bar"><b id="mx-n">' + n + (n === 1 ? " produto escolhido" : " produtos escolhidos") + '</b>' +
        '<input class="cp" id="mq" placeholder="🔍 Procurar nos meus produtos" style="margin:8px 0 0">' +
        '<div class="lin"><button class="bt" data-mx="todos">☑️ Escolher todos</button><button class="bt" data-mx="nenhum">Limpar</button></div>' +
        '<div class="lin"><button class="bt p" data-mx="publicar">👁️ Publicar</button><button class="bt" data-mx="ocultar">🙈 Ocultar</button>' +
        '<button class="bt" data-mx="preco">💲 Preço novo</button><button class="bt" data-mx="pct">％ Ajustar preço</button>' +
        '<button class="bt" data-mx="stock">📦 Stock</button><button class="bt" data-mx="duplicar">📄 Duplicar</button>' +
        '<button class="bt" data-mx="csv">⬇️ Exportar lista</button></div><p class="msg" id="mx-msg"></p></div>' +
        '<div class="cx"><h2>🧰 Gestão em massa <span class="sub" style="margin-left:auto">' + P.length + ' produtos</span></h2>' +
        (P.map(function (p) {
          var f = H.fotoDe(p), st = H.stockDe(p);
          return '<label class="mx-ln" data-nome="' + esc(k(p.name)) + '"><input type="checkbox" data-sel="' + esc(p.id) + '"' + (SEL[p.id] ? " checked" : "") + '>' +
            (f ? '<img loading="lazy" alt="" src="' + esc(f) + '">' : '<span class="sf"></span>') +
            '<span class="t"><b>' + esc(p.name || "Produto") + "</b><span>" + num(p.price, p.currency || "MZN") + " · Stock " + st + " · " + (p.active !== false ? "Publicado" : "Oculto") + "</span></span></label>";
        }).join("") || '<p class="vazio">Ainda não publicou produtos.</p>') + "</div>";
    };

    function escolhidos() { return (X.D.prods || []).filter(function (p) { return SEL[p.id]; }); }
    function contar() { var n = escolhidos().length, e = document.getElementById("mx-n"); if (e) e.textContent = n + (n === 1 ? " produto escolhido" : " produtos escolhidos"); }
    function msg(t, ok) { var m = document.getElementById("mx-msg"); if (m) { m.className = "msg" + (ok ? " ok" : ""); m.textContent = t; } }
    async function recarregar(t) { X.aviso(t); SEL = {}; if (window.__painel && window.__painel.recarregar) await window.__painel.recarregar(); else X.desenhar(); }
    function filtroUid() { return "&supplier_id=eq." + encodeURIComponent(X.S.user.id); }

    async function patch(p, corpo) {
      var r = await X.api("products?id=eq." + encodeURIComponent(p.id) + filtroUid(), "PATCH", corpo);
      if (!r || !r.length) throw new Error("Sem permissão para o produto " + (p.name || p.id));
      return r[0];
    }
    function novoStock(p, n) {
      var v = arr(p.variants), corpo = {};
      if (v.length) {
        v = v.map(function (x) {
          var y = Object.assign({}, x), pos = false;
          ["stock", "quantity", "qtd"].forEach(function (c) { if (c in y) { y[c] = n; pos = true; } });
          if (!pos) y.stock = n; return y;
        });
        corpo.variants = typeof p.variants === "string" ? JSON.stringify(v) : v;
        if ("stock_total" in p) corpo.stock_total = n * v.length;
      } else if ("stock" in p) corpo.stock = n;
      else if ("stock_total" in p) corpo.stock_total = n;
      else corpo.variants = [{ stock: n }];
      return corpo;
    }
    async function duplicar(p) {
      var c = Object.assign({}, p);
      ["id", "created_at", "updated_at"].forEach(function (x) { delete c[x]; });
      c.name = (p.name || "Produto") + " (cópia)"; c.active = false; c.supplier_id = X.S.user.id;
      for (var i = 0; i < 8; i++) {
        try { return await X.api("products", "POST", c); }
        catch (e) {
          var m = /column "([^"]+)"|'([^']+)' column/.exec(e.message || "");
          var col = m && (m[1] || m[2]);
          if (col && col in c && col !== "name" && col !== "supplier_id") { delete c[col]; continue; }
          throw e;
        }
      }
      throw new Error("Não foi possível duplicar " + p.name);
    }
    function csv(nome, cab, linhas) {
      var q = function (v) { v = v == null ? "" : String(v); return /[;"\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var t = "﻿" + [cab].concat(linhas).map(function (l) { return l.map(q).join(";"); }).join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv;charset=utf-8" }));
      a.download = nome + "-" + new Date().toISOString().slice(0, 10) + ".csv"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    }
    function exportarProdutos(l) {
      csv("produtos", ["ID", "Nome", "Preço", "Moeda", "Stock", "Estado", "Link"], l.map(function (p) {
        return [p.id, p.name, p.price, p.currency || "MZN", H.stockDe(p), p.active !== false ? "Publicado" : "Oculto", "https://bbabilonia.com/produto-bbabilonia.html?id=" + p.id];
      }));
    }
    function exportarEncomendas() {
      var P = (X && X.D.peds) || [];
      if (!P.length) { X.aviso("Ainda não tem encomendas para exportar."); return; }
      csv("encomendas", ["Pedido", "Data", "Cliente", "País", "Total", "Moeda", "Estado", "Pagamento", "Artigos", "Rastreamento"], P.map(function (p) {
        var it = arr(p.items);
        return [String(p.id).slice(0, 8).toUpperCase(), p.created_at ? new Date(p.created_at).toLocaleString("pt-PT") : "", p.customer_name, p.country, p.total, p.currency || "MZN",
          H.estPed(p)[0], p.payment_status || "", it.map(function (i) { return (i.nome || "Produto") + " " + [i.cor, i.tamanho].filter(Boolean).join("/") + " x" + (i.qtd || 1); }).join(" | "), p.rastreio || ""];
      }));
    }

    async function acao(a) {
      if (a === "todos") { document.querySelectorAll("[data-sel]").forEach(function (c) { if (c.closest(".mx-ln").style.display !== "none") { c.checked = true; SEL[c.getAttribute("data-sel")] = true; } }); contar(); return; }
      if (a === "nenhum") { SEL = {}; document.querySelectorAll("[data-sel]").forEach(function (c) { c.checked = false; }); contar(); return; }
      var L = escolhidos();
      if (a === "csv") { exportarProdutos(L.length ? L : X.D.prods || []); return; }
      if (!L.length) { msg("Escolha primeiro os produtos (toque no quadrado de cada um)."); return; }
      var feitos = 0, erros = [];
      async function cada(fn) {
        for (var i = 0; i < L.length; i++) { msg("A guardar " + (i + 1) + " de " + L.length + "…", true); try { await fn(L[i]); feitos++; } catch (e) { erros.push(e.message); } }
      }
      if (a === "publicar" || a === "ocultar") {
        await cada(function (p) { return patch(p, { active: a === "publicar" }); });
      } else if (a === "preco") {
        var v = prompt("Preço novo para os " + L.length + " produtos escolhidos (cada um fica na moeda que já tem):");
        if (v == null) return; v = Number(String(v).replace(",", "."));
        if (!(v >= 0)) { msg("Escreva um preço válido."); return; }
        await cada(function (p) { return patch(p, { price: v }); });
      } else if (a === "pct") {
        var pc = prompt("Ajustar o preço em percentagem.\nExemplos: 10 = aumentar 10%  ·  -15 = baixar 15%");
        if (pc == null) return; pc = Number(String(pc).replace(",", ".").replace("%", ""));
        if (!isFinite(pc) || pc <= -100 || pc === 0) { msg("Escreva uma percentagem válida (ex.: 10 ou -15)."); return; }
        await cada(function (p) { return patch(p, { price: Math.round(Number(p.price || 0) * (1 + pc / 100) * 100) / 100 }); });
      } else if (a === "stock") {
        var s = prompt("Stock para CADA cor e tamanho dos " + L.length + " produtos escolhidos (0 = esgotado):");
        if (s == null) return; s = parseInt(s, 10);
        if (!(s >= 0)) { msg("Escreva um número (0 ou mais)."); return; }
        await cada(function (p) { return patch(p, novoStock(p, s)); });
      } else if (a === "duplicar") {
        if (!confirm("Duplicar " + L.length + " produto(s)?\nAs cópias ficam ocultas, com \"(cópia)\" no nome, para editar antes de publicar.")) return;
        await cada(duplicar);
      }
      if (erros.length) { msg("Feito em " + feitos + ". Com erro: " + erros[0]); if (feitos) setTimeout(function () { recarregar("Guardado em " + feitos + " produto(s)."); }, 2500); return; }
      await recarregar("✓ Guardado em " + feitos + " produto(s).");
    }

    document.addEventListener("change", function (e) {
      var c = e.target && e.target.getAttribute && e.target.getAttribute("data-sel");
      if (c) { SEL[c] = e.target.checked; contar(); }
    });
    document.addEventListener("input", function (e) {
      if (!e.target || e.target.id !== "mq") return;
      var t = k(e.target.value).trim();
      document.querySelectorAll(".mx-ln").forEach(function (l) { l.style.display = !t || l.getAttribute("data-nome").indexOf(t) > -1 ? "" : "none"; });
    });

    /* ---------- encomendas: exportar ---------- */
    var enc = PVsec.V.encomendas;
    PVsec.V.encomendas = function () {
      var h = enc();
      if (!X || !X.aprovada) return h;
      return h + '<div class="cx"><button class="bt g" data-bbexp="1">⬇️ Exportar encomendas (Excel / CSV)</button><p class="sub" style="margin-top:6px">Abre no Excel, Google Sheets ou WPS.</p></div>';
    };

    /* ---------- conta: fechar a loja e apagar a conta ---------- */
    var conta = PVsec.V.conta;
    PVsec.V.conta = function () {
      var h = conta(), l = X && X.loja, fechada = l && k(l.estado) === "fechada";
      var z = '<div class="cx zona-perigo"><h2>⚠️ Fechar a loja ou apagar a conta</h2>';
      if (l && !fechada) z += '<p class="sub">Ao fechar, a loja e todos os produtos deixam de aparecer aos clientes. Só pode fechar sem encomendas por terminar e sem saldo por levantar.</p><button class="bt g" data-bbfechar="1" style="margin-top:8px">🔒 Fechar a minha loja</button>';
      if (fechada) z += '<p class="sub">A sua loja está <b>fechada</b>. Pode reabrir (a BBabilônia verifica de novo antes de aparecer aos clientes).</p><button class="bt g" data-bbreabrir="1" style="margin-top:8px;background:#d1fae5;color:#047857">🔓 Reabrir a loja</button>';
      if (!l || fechada) z += '<p class="sub" style="margin-top:12px">Apagar a conta é para sempre: deixa de poder entrar. As encomendas antigas ficam guardadas.</p><button class="bt g" data-bbapagar="1" style="margin-top:8px">🗑️ Apagar a minha conta</button>';
      return h + z + '<p class="msg" id="zpMsg"></p></div>';
    };

    async function rpc(nome) { return X.api("rpc/" + nome, "POST", {}); }
    function zp(t) { var m = document.getElementById("zpMsg"); if (m) m.textContent = t; }

    document.addEventListener("click", async function (e) {
      var t = e.target && e.target.closest ? e.target : null; if (!t || !X) return;
      var b = t.closest("[data-mx]"); if (b) { e.preventDefault(); if (b.disabled) return; b.disabled = true; try { await acao(b.getAttribute("data-mx")); } finally { b.disabled = false; } return; }
      if (t.closest("[data-bbexp]")) { e.preventDefault(); exportarEncomendas(); return; }
      if (t.closest("[data-bbfechar]")) {
        e.preventDefault();
        if (!confirm("Fechar a sua loja?\nA loja e os produtos deixam de aparecer aos clientes.")) return;
        try { await rpc("fechar_minha_loja"); await recarregar("Loja fechada."); } catch (er) { zp(er.message); }
        return;
      }
      if (t.closest("[data-bbreabrir]")) {
        e.preventDefault();
        try { await rpc("reabrir_minha_loja"); await recarregar("Pedido de reabertura enviado. A loja fica em análise."); } catch (er) { zp(er.message); }
        return;
      }
      if (t.closest("[data-bbapagar]")) {
        e.preventDefault();
        var c = prompt("Apagar a conta é para sempre.\nPara confirmar, escreva APAGAR:");
        if (c == null || c.trim().toUpperCase() !== "APAGAR") return;
        try {
          await rpc("apagar_minha_conta");
          for (var i = localStorage.length - 1; i >= 0; i--) { var kk = localStorage.key(i); if (/^sb-.*-auth-token$/.test(kk)) localStorage.removeItem(kk); }
          alert("A sua conta foi apagada.");
          location.href = "https://bbabilonia.com/";
        } catch (er) { zp(er.message); }
      }
    });

    /* se o painel já estava desenhado, desenha de novo com as novidades */
    try { window.dispatchEvent(new HashChangeEvent("hashchange")); } catch (e) {}
  }
})();

/* precos-qtd.js — BBabilônia (14/11/2026): preço por quantidade, como nas grandes plataformas (Alibaba).
   O fornecedor define faixas: ex. 1–5 peças 100 MT · 6–10 peças 90 MT · 11+ peças 80 MT.
   O preço de cada peça depende da quantidade total desse produto (soma de todas as cores e tamanhos).
   1) Registar produto e 2) Editar no painel do vendedor: campo "Preço por quantidade".
   3) Página do produto: tabela das faixas e total com o preço certo.
   4) Carrinho: cada peça com o preço da faixa; o total muda sozinho.
   O servidor calcula sempre o preço certo ao criar o pedido (PARTE 18). Coluna: products.precos_qtd
   Carregado pelo pedido-minimo.js (as mesmas páginas). Não altera os outros ficheiros. */
(function () {
  if (window.__bbPrecosQtd) return; window.__bbPrecosQtd = 1;
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var d = document;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function num(v) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }); }
  function faixas(p) {
    var f = p && p.precos_qtd;
    if (typeof f === "string") { try { f = JSON.parse(f); } catch (e) { f = []; } }
    if (!Array.isArray(f)) return [];
    return f.map(function (x) { return { min: Math.floor(Number(x.min)), preco: Number(x.preco) }; })
      .filter(function (x) { return x.min >= 2 && x.preco > 0; }).sort(function (a, b) { return a.min - b.min; });
  }
  function base(p) { return Number(p && (p.price != null ? p.price : p.preco)) || 0; }
  /* preço de cada peça para uma quantidade total */
  function precoPara(p, q) {
    var f = faixas(p), r = base(p);
    f.forEach(function (x) { if (q >= x.min) r = x.preco; });
    return r;
  }
  /* linhas para mostrar: [{de, ate, preco}] (ate null = "ou mais") */
  function linhas(p) {
    var f = faixas(p); if (!f.length) return [];
    var l = [{ de: 1, ate: f[0].min - 1, preco: base(p) }];
    f.forEach(function (x, i) { l.push({ de: x.min, ate: f[i + 1] ? f[i + 1].min - 1 : null, preco: x.preco }); });
    return l;
  }
  function txtLinha(x) { return x.ate == null ? x.de + "+ peças" : (x.de === x.ate ? x.de + (x.de === 1 ? " peça" : " peças") : x.de + "–" + x.ate + " peças"); }
  window.BBPrecosQtd = { faixas: faixas, precoPara: precoPara, linhas: linhas };

  var css = d.createElement("style");
  css.textContent = ".bb-pq{border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:10px;margin:8px 0;font:14px system-ui,sans-serif;color:#1f2937}" +
    ".bb-pq h4{margin:0 0 6px;font-size:14px;color:#9a3412}.bb-pq .r{display:flex;gap:6px;align-items:center;margin:6px 0}" +
    ".bb-pq .r input{width:auto;flex:1;min-width:0;margin:0!important;padding:9px;border:1px solid #e5e7eb;border-radius:8px;font:inherit;font-size:15px}" +
    ".bb-pq .r span{font-size:12.5px;color:#6b7280;white-space:nowrap}.bb-pq .x{border:0;background:#fee2e2;color:#b91c1c;border-radius:8px;width:34px;height:36px;flex:none;font-size:16px}" +
    ".bb-pq .mais{border:1px dashed #fb923c;background:#fff;color:#c2410c;border-radius:8px;padding:8px 10px;font:600 13px system-ui;width:100%;margin-top:4px}" +
    ".bb-pq .pv{font-size:12.5px;color:#374151;margin-top:6px;line-height:1.5}.bb-pq .er{color:#b91c1c;font-size:12.5px;margin-top:4px}" +
    ".bb-pqt{margin:8px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;font:14px system-ui,sans-serif;background:#fff;color:#111}" +
    ".bb-pqt div{display:flex;justify-content:space-between;padding:7px 10px;border-top:1px solid #f1f5f9}.bb-pqt div:first-child{border-top:0;background:#f8fafc;font-weight:700;font-size:13px;color:#475569}" +
    ".bb-pqt div.on{background:#fff7ed;font-weight:800;color:#9a3412}.bb-pqi{font-size:12px;color:#9a3412;margin-top:2px}";
  d.head.appendChild(css);

  /* ---------- editor das faixas (registar e editar) ---------- */
  function editor(f, precoBase) {
    var box = d.createElement("div"); box.className = "bb-pq"; box.id = "bb-pq";
    box.innerHTML = '<h4>💰 Preço por quantidade <small style="font-weight:400;color:#6b7280">(opcional)</small></h4>' +
      '<div style="font-size:12.5px;color:#6b7280">Quem compra mais paga menos por peça. Ex.: a partir de 6 peças → 90 cada; a partir de 11 → 80 cada. Até à primeira faixa vale o preço normal.</div>' +
      '<div class="ls"></div><button type="button" class="mais">＋ Acrescentar faixa</button><div class="pv"></div><div class="er"></div>';
    var ls = box.querySelector(".ls");
    function linha(x) {
      var r = d.createElement("div"); r.className = "r";
      r.innerHTML = '<span>A partir de</span><input type="number" min="2" step="1" inputmode="numeric" data-min placeholder="peças" value="' + esc(x ? x.min : "") + '">' +
        '<span>peças →</span><input type="number" min="0" step="any" inputmode="decimal" data-pr placeholder="preço cada" value="' + esc(x ? x.preco : "") + '"><button type="button" class="x" aria-label="Tirar">×</button>';
      ls.appendChild(r);
    }
    (f || []).forEach(linha);
    box.querySelector(".mais").onclick = function () { if (ls.children.length < 8) linha(null); ver(); };
    ls.addEventListener("click", function (e) { var b = e.target.closest(".x"); if (b) { b.parentNode.remove(); ver(); } });
    box.addEventListener("input", ver);
    function ler() {
      var out = [], er = "";
      ls.querySelectorAll(".r").forEach(function (r) {
        var m = r.querySelector("[data-min]").value.trim(), p = r.querySelector("[data-pr]").value.trim().replace(",", ".");
        if (!m && !p) return;
        var mn = Math.floor(Number(m)), pr = Number(p);
        if (!(mn >= 2)) er = er || "Cada faixa começa em 2 peças ou mais.";
        else if (!(pr > 0)) er = er || "Escreva o preço de cada faixa.";
        out.push({ min: mn, preco: pr });
      });
      out.sort(function (a, b) { return a.min - b.min; });
      var bp = typeof precoBase === "function" ? precoBase() : precoBase, ant = bp, ultM = 1;
      out.forEach(function (x) {
        if (er) return;
        if (x.min <= ultM) er = "As faixas têm de ter quantidades diferentes e a subir.";
        else if (ant > 0 && x.preco > ant) er = "Quem compra mais não pode pagar mais caro por peça (" + x.min + " peças).";
        ultM = x.min; ant = x.preco;
      });
      return { faixas: out, erro: er };
    }
    function ver() {
      var r = ler(), bp = typeof precoBase === "function" ? precoBase() : precoBase;
      box.querySelector(".er").textContent = r.erro;
      box.querySelector(".pv").innerHTML = (!r.erro && r.faixas.length && bp > 0) ? "O cliente vê: " + linhas({ price: bp, precos_qtd: r.faixas }).map(function (x) { return "<b>" + esc(txtLinha(x)) + "</b>: " + num(x.preco); }).join(" · ") : "";
    }
    box.ler = ler; box.ver = ver;
    setTimeout(ver, 0);
    return box;
  }

  /* ================= 1) PAINEL DO VENDEDOR (Editar) ================= */
  if (window.PVsec && typeof PVsec.editar === "function") {
    var X = null, sync0 = PVsec.sync;
    PVsec.sync = function (x) { X = x; return sync0 ? sync0.apply(this, arguments) : undefined; };
    function prodDe(id) { return X && X.D ? X.D.prods.filter(function (p) { return String(p.id) === String(id); })[0] : null; }
    var editar0 = PVsec.editar;
    PVsec.editar = function (id) {
      var r = editar0.apply(this, arguments);
      var p = prodDe(id), g = d.getElementById("eG"); if (!p || !g || d.getElementById("bb-pq")) return r;
      var pin = d.getElementById("ePr") || d.getElementById("ePreco") || null;
      var ed = editor(faixas(p), function () { var v = pin ? Number(String(pin.value).replace(",", ".")) : 0; return v > 0 ? v : base(p); });
      g.parentNode.insertBefore(ed, g);
      var guardar0 = g.onclick;
      g.onclick = async function () {
        var lr = ed.ler(), m = d.getElementById("eM");
        if (lr.erro) { if (m) { m.className = "msg"; m.textContent = "Preço por quantidade: " + lr.erro; } return; }
        if (JSON.stringify(lr.faixas) !== JSON.stringify(faixas(p))) {
          g.disabled = true;
          try {
            var o = await X.api("products?id=eq." + encodeURIComponent(p.id) + "&supplier_id=eq." + X.S.user.id, "PATCH", { precos_qtd: lr.faixas });
            if (!o || !o.length) throw new Error("Não foi guardado: sem permissão para este produto.");
            Object.assign(p, o[0]);
          } catch (e) { if (m) { m.className = "msg"; m.textContent = /precos_qtd/.test(e.message) ? "Falta correr no Supabase o SQL do preço por quantidade (PARTE 18)." : e.message; } g.disabled = false; return; }
          g.disabled = false;
        }
        return guardar0 ? guardar0.apply(this, arguments) : undefined;
      };
      return r;
    };
    return;
  }

  /* ================= 2) REGISTAR PRODUTO ================= */
  var precoIn = d.getElementById("preco");
  if (precoIn && precoIn.tagName === "INPUT" && d.getElementById("sv") && typeof sb !== "undefined") {
    var ed2 = d.getElementById("bb-pq");
    if (!ed2) {
      ed2 = editor([], function () { return Number(String(precoIn.value).replace(",", ".")) || 0; });
      var ds = d.getElementById("desc"), antes = ds && ds.previousElementSibling && ds.previousElementSibling.tagName === "LABEL" ? ds.previousElementSibling : ds;
      if (antes) antes.parentNode.insertBefore(ed2, antes); else precoIn.parentNode.insertBefore(ed2, precoIn.nextSibling);
      precoIn.addEventListener("input", function () { ed2.ver(); });
    }
    var sv = d.getElementById("sv"), sv0 = sv.onclick;
    sv.onclick = function (e) {
      var lr = ed2.ler();
      if (lr.erro) { var m = d.getElementById("m"); if (m) m.textContent = "Preço por quantidade: " + lr.erro; ed2.scrollIntoView({ block: "center" }); return; }
      return sv0 ? sv0.call(this, e) : undefined;
    };
    var from0 = sb.from.bind(sb);
    sb.from = function (t) {
      var q = from0(t);
      if (t === "products" && q && q.insert) {
        var ins0 = q.insert.bind(q);
        q.insert = function (row, o) {
          try { var lr = ed2.ler(); if (!lr.erro && lr.faixas.length && row && !Array.isArray(row)) row.precos_qtd = lr.faixas; } catch (e) {}
          return ins0(row, o);
        };
      }
      return q;
    };
    return;
  }

  /* ================= 3) PÁGINA DE PRODUTO ================= */
  if (d.getElementById("add") && d.getElementById("cores") && typeof window.totais === "function" && typeof window.escolhidos === "function") {
    function noCarrinho() {
      var n = 0; try { JSON.parse(localStorage.getItem("carrinho") || "[]").forEach(function (i) { if (window.P && String(i.id) === String(P.id)) n += Number(i.qtd) || 0; }); } catch (e) {}
      return n;
    }
    function tabela(qTotal) {
      if (!window.P) return;
      var l = linhas(P), el = d.getElementById("bb-pqt");
      if (!l.length) { if (el) el.remove(); return; }
      if (!el) {
        el = d.createElement("div"); el.id = "bb-pqt"; el.className = "bb-pqt";
        var pr = d.getElementById("preco"); if (!pr || !pr.parentNode) return;
        pr.parentNode.insertBefore(el, pr.nextSibling);
      }
      var m = P.currency || "MZN";
      el.innerHTML = "<div><span>Quantidade</span><span>Preço por peça</span></div>" + l.map(function (x) {
        var on = qTotal >= x.de && (x.ate == null || qTotal <= x.ate);
        return '<div class="' + (on && qTotal > 0 ? "on" : "") + '"><span>' + esc(txtLinha(x)) + "</span><span>" + num(x.preco) + " " + esc(m) + "</span></div>";
      }).join("");
    }
    function atualizar() {
      try {
        if (!window.P) return;
        var n = 0; escolhidos().forEach(function (x) { n += x.q; });
        var tot = n + noCarrinho();
        tabela(tot);
        if (!faixas(P).length) return;
        var u = precoPara(P, tot || 1), m = P.currency || "MZN";
        var t = d.getElementById("total"); if (t) t.textContent = (n * u).toLocaleString("pt-PT") + " " + m;
        var rs = d.getElementById("resumo");
        if (rs && n && u !== base(P) && !/Pedido mínimo/.test(rs.textContent)) rs.textContent = n + " peça(s) · " + num(u) + " " + m + " cada (preço por quantidade)";
      } catch (e) {}
    }
    var totais0 = window.totais;
    window.totais = function () { var r = totais0.apply(this, arguments); atualizar(); return r; };
    ["input", "change", "click"].forEach(function (ev) { d.addEventListener(ev, function () { setTimeout(atualizar, 0); }); });
    /* ao adicionar ao carrinho: todas as linhas deste produto ficam com o preço da faixa */
    d.getElementById("add").addEventListener("click", function () {
      setTimeout(function () {
        try {
          if (!window.P || !faixas(P).length) return;
          var c = JSON.parse(localStorage.getItem("carrinho") || "[]"), q = 0;
          c.forEach(function (i) { if (String(i.id) === String(P.id)) q += Number(i.qtd) || 0; });
          var u = precoPara(P, q), mudou = false;
          c.forEach(function (i) { if (String(i.id) === String(P.id) && Number(i.preco) !== u) { i.preco = u; mudou = true; } });
          if (mudou) localStorage.setItem("carrinho", JSON.stringify(c));
        } catch (e) {}
      }, 0);
    });
    var esperar = setInterval(function () { if (window.P) { clearInterval(esperar); atualizar(); } }, 300);
    setTimeout(function () { clearInterval(esperar); }, 30000);
    return;
  }

  /* ================= 4) CARRINHO ================= */
  if (d.getElementById("rodape") && d.getElementById("lista") && typeof window.desenhar === "function") {
    var PRODS = {}, pedidos = {};
    function lista() { try { return itens; } catch (e) { return null; } }
    function idI(i) { return i.id || i.produto_id || i.product_id || ""; }
    function aplicar() {
      var it = lista(); if (!it || !it.length) return false;
      var soma = {}, falta = [];
      it.forEach(function (i) { var k = idI(i); if (!k) return; soma[k] = (soma[k] || 0) + (Number(i.qtd) || 0); if (!(k in PRODS) && !pedidos[k]) falta.push(k); });
      if (falta.length) {
        falta.forEach(function (k) { pedidos[k] = 1; });
        fetch(SUPA + "/rest/v1/products?select=id,price,currency,precos_qtd&id=in.(" + falta.join(",") + ")", { headers: { apikey: KEY, Authorization: "Bearer " + KEY } })
          .then(function (r) { return r.ok ? r.json() : []; })
          .then(function (a) { (a || []).forEach(function (p) { PRODS[p.id] = p; }); falta.forEach(function (k) { if (!(k in PRODS)) PRODS[k] = null; }); window.desenhar(); })
          .catch(function () { falta.forEach(function (k) { delete pedidos[k]; }); });
      }
      var mudou = false;
      it.forEach(function (i) {
        var p = PRODS[idI(i)]; if (!p || !faixas(p).length) return;
        var u = precoPara(p, soma[idI(i)]);
        if (Number(i.preco) !== u) { i.preco = u; mudou = true; }
      });
      if (mudou) { try { gravar(); } catch (e) { try { localStorage.setItem("carrinho", JSON.stringify(it)); } catch (x) {} } }
      return true;
    }
    function notas() {
      var it = lista(); if (!it) return;
      var soma = {}; it.forEach(function (i) { var k = idI(i); soma[k] = (soma[k] || 0) + (Number(i.qtd) || 0); });
      var caixas = d.querySelectorAll("#lista .item"), vistos = {};
      it.forEach(function (i, idx) {
        var p = PRODS[idI(i)], cx = caixas[idx]; if (!cx || !p || !faixas(p).length || vistos[idI(i)]) return;
        vistos[idI(i)] = 1;
        var prox = faixas(p).filter(function (x) { return x.min > soma[idI(i)]; })[0];
        var el = d.createElement("div"); el.className = "bb-pqi";
        el.textContent = "Preço por quantidade: " + soma[idI(i)] + " peça(s) deste produto → " + num(precoPara(p, soma[idI(i)])) + " cada" +
          (prox ? " · com " + prox.min + " peças fica " + num(prox.preco) + " cada" : "");
        var pr = cx.querySelector(".preco"); if (pr) pr.parentNode.insertBefore(el, pr.nextSibling);
      });
    }
    var desenhar0 = window.desenhar;
    window.desenhar = function () { try { aplicar(); } catch (e) {} var r = desenhar0.apply(this, arguments); try { notas(); } catch (e) {} return r; };
    window.desenhar();
  }
})();

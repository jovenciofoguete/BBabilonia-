/* atendimento-extras.js — B-Babilônia: novidades do painel do atendimento
   🔎 Procurar cliente, pedido ou loja · 🚩 Denúncias (produtos e lojas) · 📝 Notas internas em cada caso
   📊 Números de cada agente (só supervisor). Não altera atendimento.html: só acrescenta. */
(function () {
  if (window.__bbAtdExtras) return; window.__bbAtdExtras = 1;
  var tent = 0;
  function arrancar() {
    if (typeof window.sb === "undefined" || typeof window.desenhar !== "function" || typeof window.abas !== "function" || typeof window.filtra !== "function") { if (++tent < 80) setTimeout(arrancar, 150); return; }
    iniciar();
  }
  arrancar();

  function iniciar() {
    var DEN = [], DENerro = "";
    var fq = new URLSearchParams(location.search).get("f"); if (fq === "denuncias" || fq === "numeros") window.aba = fq;
    function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
    function dt(d) { try { return d ? new Date(d).toLocaleString("pt-PT") : "—"; } catch (e) { return "—"; } }
    function eu() { return window.EU || {}; }

    var css = document.createElement("style");
    css.textContent = "#bbx-proc{margin-bottom:12px}#bbx-proc h3{font-size:16px;margin-bottom:4px}#bbx-proc p{font-size:13.5px;color:var(--suave)}" +
      "#bbx-proc .lin{display:flex;gap:8px}#bbx-proc .lin input{flex:1;min-width:0}#bbx-proc .lin button{width:auto;flex:none;margin:5px 0;padding:13px 16px}" +
      ".bbx-res{margin-top:10px;font-size:14px}.bbx-res h4{font-size:13px;color:var(--suave);margin:10px 0 4px;text-transform:uppercase}" +
      ".bbx-it{border:2px solid var(--linha);border-radius:12px;padding:10px;margin-bottom:6px;line-height:1.5}.bbx-it a{color:var(--az);font-weight:700}" +
      ".bbx-nb{background:#f1f5f9;color:#0f172a;border:0;border-radius:12px;padding:11px 8px;font:inherit;font-size:14px;font-weight:800;flex:1}" +
      ".bbx-fundo{position:fixed;inset:0;z-index:50;background:#0008;display:flex;align-items:flex-end;justify-content:center}" +
      ".bbx-jan{background:var(--papel);color:var(--texto);width:100%;max-width:560px;border-radius:18px 18px 0 0;padding:16px;max-height:88vh;overflow:auto}" +
      ".bbx-jan h3{font-size:17px;margin-bottom:8px}.bbx-nota{background:var(--fundo);border-radius:12px;padding:10px;margin-bottom:8px;font-size:14px;white-space:pre-line}.bbx-nota small{display:block;color:var(--suave);font-size:12px;margin-bottom:3px}" +
      ".bbx-jan textarea{width:100%;padding:11px;border:2px solid var(--linha);border-radius:12px;font:inherit;font-size:15px;background:var(--fundo);color:var(--texto)}" +
      ".bbx-tb{width:100%;border-collapse:collapse;font-size:14px}.bbx-tb th,.bbx-tb td{padding:8px 6px;border-bottom:1px solid var(--linha);text-align:left}.bbx-tb th{font-size:12.5px;color:var(--suave)}";
    document.head.appendChild(css);

    /* ---------- procurar ---------- */
    function montarProcura() {
      var painel = document.getElementById("painel"), lista = document.getElementById("lista");
      if (!painel || !lista || painel.classList.contains("hide") || document.getElementById("bbx-proc")) return;
      var d = document.createElement("div"); d.id = "bbx-proc"; d.className = "box";
      d.innerHTML = "<h3>🔎 Procurar cliente, pedido ou loja</h3><p>Número do pedido (8 primeiros caracteres), email, telefone, nome do cliente ou nome da loja.</p>" +
        '<div class="lin"><input id="bbx-pq" placeholder="Ex.: 1A2B3C4D ou ana@gmail.com" autocomplete="off"><button class="bt" id="bbx-pb" type="button">Procurar</button></div><div class="bbx-res" id="bbx-pr"></div>';
      painel.insertBefore(d, lista);
      d.querySelector("#bbx-pb").onclick = procurar;
      d.querySelector("#bbx-pq").onkeydown = function (e) { if (e.key === "Enter") procurar(); };
    }
    async function procurar() {
      var out = document.getElementById("bbx-pr"), t = document.getElementById("bbx-pq").value.trim();
      if (t.length < 3) { out.innerHTML = '<div class="err">Escreva pelo menos 3 letras ou números.</div>'; return; }
      out.innerHTML = '<div class="inf">A procurar…</div>';
      var r = await sb.rpc("atd_procurar", { p_texto: t });
      if (r.error) { out.innerHTML = '<div class="err">' + esc(/function|find/i.test(r.error.message) ? "Falta correr o SQL novo no Supabase." : r.error.message) + "</div>"; return; }
      var d = r.data || {}, P = d.pedidos || [], L = d.lojas || [], C = d.contas || [];
      if (!P.length && !L.length && !C.length) { out.innerHTML = '<div class="inf">Nada encontrado.</div>'; return; }
      out.innerHTML = (P.length ? "<h4>Pedidos (" + P.length + ")</h4>" + P.map(function (p) {
        return '<div class="bbx-it"><b>Pedido ' + esc(String(p.id).slice(0, 8).toUpperCase()) + "</b> · " + esc(din(p.total, p.currency)) + " · " + dt(p.created_at) +
          "<br>" + esc(p.customer_name || "—") + " · " + esc(p.customer_email || "") + (p.customer_phone ? " · " + esc(p.customer_phone) : "") + (p.country ? " · " + esc(p.country) : "") +
          "<br>Estado: " + esc(p.status || "—") + " · Pagamento: " + esc(p.payment_status || "—") + (p.escrow_status ? " · Saldo: " + esc(p.escrow_status) : "") + (p.disputa_estado ? ' · <b style="color:#dc2626">Disputa: ' + esc(p.disputa_estado) + "</b>" : "") + "</div>";
      }).join("") : "") +
        (L.length ? "<h4>Lojas (" + L.length + ")</h4>" + L.map(function (l) {
          return '<div class="bbx-it"><b>' + esc(l.nome || "Loja") + "</b> · " + esc(l.estado || "") + (l.pais ? " · " + esc(l.pais) : "") + '<br><a href="https://bbabilonia.com/loja.html?f=' + encodeURIComponent(l.dono_id) + '" target="_blank" rel="noopener">Ver a loja ›</a></div>';
        }).join("") : "") +
        (C.length ? "<h4>Contas (" + C.length + ")</h4>" + C.map(function (c) {
          return '<div class="bbx-it"><b>' + esc(c.email) + "</b>" + (c.bloqueada ? ' · <b style="color:#dc2626">Bloqueada</b>' : "") + "<br>Criada: " + dt(c.created_at) + " · Última entrada: " + dt(c.last_sign_in_at) + "</div>";
        }).join("") : "");
    }

    /* ---------- denúncias ---------- */
    var MOT = { ocultar_produto: "Produto ocultado", resolvida: "Resolvida", sem_motivo: "Sem motivo" };
    async function carregarDen() {
      var r = await sb.rpc("atd_denuncias", { p_estado: window.aba === "denuncias_fechadas" ? "fechada" : "aberta" });
      if (r.error) { DEN = []; DENerro = /function|find/i.test(r.error.message) ? "Falta correr o SQL novo no Supabase." : r.error.message; }
      else { DEN = r.data || []; DENerro = ""; }
    }
    function desenharDen() {
      var l = document.getElementById("lista");
      if (DENerro) { l.innerHTML = '<div class="box vz">' + esc(DENerro) + "</div>"; return; }
      var vistos = {}, L = DEN.filter(function (d) { var c = d.tipo + d.alvo_id; if (vistos[c]) return false; vistos[c] = 1; return true; });
      if (!L.length) { l.innerHTML = '<div class="box vz">Não há denúncias por tratar. 👍</div>'; return; }
      l.innerHTML = L.map(function (d) {
        var link = d.tipo === "produto" ? "https://bbabilonia.com/produto-bbabilonia.html?id=" + encodeURIComponent(d.alvo_id) : "https://bbabilonia.com/loja.html?f=" + encodeURIComponent(d.alvo_id);
        return '<div class="box caso"><div class="l1"><span>' + (d.tipo === "produto" ? "📦 Produto" : "🏪 Loja") + "</span><span>" + dt(d.created_at) + "</span></div>" +
          "<h3>" + esc(d.alvo_nome || d.alvo_id) + "</h3>" + '<span class="est r">🚩 ' + esc(d.motivo) + "</span>" + (d.vezes > 1 ? '<span class="est a">' + d.vezes + " denúncias</span>" : "") +
          (d.detalhe ? '<div class="t" style="margin-top:6px">' + esc(d.detalhe) + "</div>" : "") +
          '<div class="bts"><a class="abrir" href="' + link + '" target="_blank" rel="noopener">Ver ›</a>' +
          (d.tipo === "produto" ? '<button class="pegar" style="background:#dc2626" data-den="' + esc(d.id) + '" data-ac="ocultar_produto">🙈 Ocultar produto</button>' : "") + "</div>" +
          '<div class="bts"><button class="pegar" data-den="' + esc(d.id) + '" data-ac="resolvida">✅ Resolvida</button><button class="bbx-nb" data-den="' + esc(d.id) + '" data-ac="sem_motivo">Sem motivo</button></div>' +
          (d.tipo === "loja" ? '<div class="inf">Para suspender a loja, passe ao supervisor / dono (Aprovar lojas › Suspender).</div>' : "") + "</div>";
      }).join("");
    }

    /* ---------- números dos agentes ---------- */
    function desenharNum() {
      var C = window.casos || [], A = (window.agentes || []).slice(), ab = ["aberta", "negociacao", "em_analise"], porEmail = {};
      C.forEach(function (d) { if (d.atendente_email && !A.some(function (a) { return a.email === d.atendente_email; })) A.push({ email: d.atendente_email, nome: d.atendente_email }); });
      A.forEach(function (a) { porEmail[a.email] = { nome: a.nome || a.email, abertos: 0, fechados: 0, horas: [], em24: 0 }; });
      C.forEach(function (d) {
        var x = porEmail[d.atendente_email]; if (!x) return;
        if (ab.indexOf(d.estado) > -1) x.abertos++; else x.fechados++;
        if (d.atribuida_em && d.primeira_resposta_em) { var h = (new Date(d.primeira_resposta_em) - new Date(d.atribuida_em)) / 36e5; if (h >= 0) { x.horas.push(h); if (h <= 24) x.em24++; } }
      });
      var linhas = Object.keys(porEmail).map(function (e) { return porEmail[e]; }).sort(function (a, b) { return b.fechados - a.fechados; });
      var fila = C.filter(function (d) { return d.estado === "em_analise" && !d.atendente_email; }).length;
      document.getElementById("lista").innerHTML = '<div class="box" style="grid-column:1/-1"><h3 style="font-size:16px;margin-bottom:8px">📊 Números de cada agente</h3>' +
        '<p class="inf" style="margin-bottom:8px">Casos na fila sem agente: <b>' + fila + "</b> · contas feitas com os casos carregados (até 500).</p>" +
        '<table class="bbx-tb"><tr><th>Agente</th><th>Em aberto</th><th>Fechados</th><th>1.ª resposta (média)</th><th>Respondidos em 24 h</th></tr>' +
        (linhas.map(function (x) {
          var m = x.horas.length ? x.horas.reduce(function (s, h) { return s + h; }, 0) / x.horas.length : null;
          return "<tr><td><b>" + esc(x.nome) + "</b></td><td>" + x.abertos + "</td><td>" + x.fechados + "</td><td>" + (m == null ? "—" : m < 1 ? "menos de 1 h" : Math.round(m) + " h") + "</td><td>" + (x.horas.length ? Math.round(x.em24 * 100 / x.horas.length) + "%" : "—") + "</td></tr>";
        }).join("") || '<tr><td colspan="5">Ainda não há agentes.</td></tr>') + "</table></div>";
    }

    /* ---------- notas internas ---------- */
    function botoesNotas() {
      document.querySelectorAll("#lista .box.caso").forEach(function (c) {
        if (c.querySelector("[data-notas]")) return;
        var a = c.querySelector('a.abrir[href*="disputa.html?id="]'); if (!a) return;
        var id = decodeURIComponent((a.getAttribute("href").split("id=")[1] || "").split("&")[0]); if (!id) return;
        var b = document.createElement("button"); b.className = "bbx-nb"; b.setAttribute("data-notas", id); b.textContent = "📝 Notas";
        a.parentNode.insertBefore(b, a);
      });
    }
    async function abrirNotas(id) {
      var f = document.createElement("div"); f.className = "bbx-fundo";
      f.innerHTML = '<div class="bbx-jan"><h3>📝 Notas internas do caso</h3><p class="inf" style="margin:-4px 0 10px">Só a equipa de atendimento vê estas notas. O cliente e o vendedor não veem.</p><div id="bbx-nl">A carregar…</div>' +
        '<textarea id="bbx-nt" rows="3" maxlength="2000" placeholder="Escreva uma nota (ex.: cliente enviou fotos por email, aguardar resposta do vendedor…)"></textarea>' +
        '<button class="bt" id="bbx-ng">Guardar nota</button><button class="bt l" id="bbx-nf">Fechar</button><div class="err" id="bbx-nm"></div></div>';
      document.body.appendChild(f);
      f.addEventListener("click", function (e) { if (e.target === f) f.remove(); });
      document.getElementById("bbx-nf").onclick = function () { f.remove(); };
      async function lista() {
        var r = await sb.rpc("atd_notas", { p_disputa: id }), el = document.getElementById("bbx-nl");
        if (r.error) { el.innerHTML = '<div class="err">' + esc(r.error.message) + "</div>"; return; }
        var L = r.data || [];
        el.innerHTML = L.length ? L.map(function (n) { return '<div class="bbx-nota"><small>' + esc(n.autor_email) + " · " + dt(n.created_at) + "</small>" + esc(n.texto) + "</div>"; }).join("") : '<div class="inf" style="margin-bottom:8px">Ainda não há notas.</div>';
      }
      lista();
      document.getElementById("bbx-ng").onclick = async function () {
        var t = document.getElementById("bbx-nt").value.trim(), m = document.getElementById("bbx-nm");
        if (t.length < 2) { m.textContent = "Escreva a nota."; return; }
        this.disabled = true; var r = await sb.rpc("atd_nota_nova", { p_disputa: id, p_texto: t }); this.disabled = false;
        if (r.error) { m.textContent = r.error.message; return; }
        document.getElementById("bbx-nt").value = ""; m.textContent = ""; lista();
      };
    }

    /* ---------- ligação ao painel ---------- */
    var abas0 = window.abas, filtra0 = window.filtra, desenhar0 = window.desenhar, carregar0 = window.carregar;
    window.abas = function () {
      var L = abas0.apply(this, arguments);
      L.push(["denuncias", "🚩 Denúncias"]);
      if (eu().chefe) L.push(["numeros", "📊 Números"]);
      return L;
    };
    window.filtra = function (t) {
      if (t === "denuncias") { var v = {}; return DEN.filter(function (d) { var c = d.tipo + d.alvo_id; if (v[c]) return false; v[c] = 1; return true; }); }
      if (t === "numeros") return [];
      return filtra0.apply(this, arguments);
    };
    window.desenhar = function () {
      var r = desenhar0.apply(this, arguments);
      montarProcura();
      if (window.aba === "denuncias") desenharDen();
      else if (window.aba === "numeros") desenharNum();
      else botoesNotas();
      return r;
    };
    window.carregar = async function () {
      var r = await carregar0.apply(this, arguments);
      await carregarDen();
      window.desenhar();
      return r;
    };

    document.addEventListener("click", async function (e) {
      var t = e.target && e.target.closest ? e.target : null; if (!t) return;
      var n = t.closest("[data-notas]"); if (n) { e.preventDefault(); abrirNotas(n.getAttribute("data-notas")); return; }
      var d = t.closest("[data-den]");
      if (d) {
        e.preventDefault();
        var ac = d.getAttribute("data-ac"), txt = { ocultar_produto: "Ocultar este produto aos clientes?", resolvida: "Marcar a denúncia como resolvida?", sem_motivo: "Fechar a denúncia sem motivo?" }[ac];
        var nota = prompt(txt + "\nNota (opcional):", ""); if (nota === null) return;
        d.disabled = true;
        var r = await sb.rpc("atd_tratar_denuncia", { p_id: d.getAttribute("data-den"), p_acao: ac, p_nota: nota });
        if (r.error) { alert(r.error.message); d.disabled = false; return; }
        await carregarDen(); window.desenhar();
      }
    });

    /* se o painel já estava aberto, carrega as denúncias e desenha */
    var painel = document.getElementById("painel");
    if (painel && !painel.classList.contains("hide") && window.EU) { carregarDen().then(function () { window.desenhar(); }); }
    else if (painel) new MutationObserver(function () { montarProcura(); }).observe(painel, { attributes: true, attributeFilter: ["class"] });
  }
})();

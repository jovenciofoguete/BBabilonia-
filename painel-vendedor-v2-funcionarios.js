/* painel-vendedor-v2-funcionarios.js — B-Babilônia: sub-contas de funcionários (como no Alibaba)
   Patrão: cartão "👥 Funcionários" para adicionar, mudar função, desativar e remover.
   Funcionário: entra com o seu email e vê só o que o patrão permitiu (Produtos, Encomendas, Mensagens). */
(function () {
  if (!window.PVsec || !window.PVpecas) return;
  var H = window.PVpecas, esc = H.esc, arr = H.arr, data = H.data, num = H.num;
  var X = null, uid = null, A = false, CAR = {}, EQ = [], CH = null, MEUS = [];
  var PAP = { gerente: ["Gerente", ["produtos", "encomendas", "mensagens"]], vendedor: ["Vendedor", ["mensagens", "encomendas"]], assistente: ["Assistente de vendas", ["produtos"]] };
  var PERM = { produtos: "📦 Produtos", encomendas: "🧾 Encomendas", mensagens: "💬 Mensagens" };
  var main = document.querySelector("main.conteudo");
  ["funcionarios", "fprod", "fenc", "fmsg"].forEach(function (v) { if (main && !document.getElementById("v-" + v)) { var s = document.createElement("section"); s.id = "v-" + v; s.className = "hide"; main.appendChild(s); } });
  var css = document.createElement("style");
  css.textContent = ".fchk{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px}.fchk label{border:1.5px solid #ddd;border-radius:999px;padding:7px 12px;font-size:13.5px}.fchk input{margin-right:5px}" +
    ".fms{max-height:55vh;overflow:auto;background:#f6f5fb;border-radius:12px;padding:8px;margin:8px 0}.fms div{max-width:82%;margin:5px 0;padding:8px 10px;border-radius:12px;font-size:14px;white-space:pre-line;background:#fff}.fms .eu{margin-left:auto;background:#ede9fe}.fms small{display:block;font-size:11px;color:#6b7280}.fms img{max-width:180px;border-radius:8px;display:block}" +
    "textarea.cp{width:100%;border:1.5px solid #ddd;border-radius:10px;padding:11px;font:inherit;font-size:15px;margin:6px 0}";
  document.head.appendChild(css);
  ["filtro-contactos.js", "filtro-contactos-v2.js"].forEach(function (f) { if (document.querySelector('script[src^="' + f + '"]')) return; var s = document.createElement("script"); s.src = f; document.body.appendChild(s); });

  function modal(h) { document.getElementById("modalCx").innerHTML = h; document.getElementById("modal").classList.add("on"); }
  function fechar() { document.getElementById("modal").classList.remove("on"); }
  function eq() { return EQ.filter(function (e) { return e.dono_id === CH; })[0]; }
  function pode(p) { var e = eq(); return !!e && (e.permissoes || []).indexOf(p) > -1; }
  function visivel() { var v = document.querySelector("main > section:not(.hide)"); return v ? v.id.slice(2) : ""; }
  function bloq() { return '<div class="cx bloq"><div class="i">🔒</div><b>Sem permissão</b><p>Peça ao dono da loja para lhe dar esta permissão.</p></div>'; }

  async function carregar() {
    if (A || !X || !X.S) return; A = true; uid = X.S.user.id; var em = String(X.S.user.email || "").toLowerCase();
    try {
      if (X.loja) { MEUS = await X.api("funcionarios?select=*&dono_id=eq." + uid + "&order=created_at.asc") || []; EQ = []; }
      else {
        var r = await X.api("funcionarios?select=*&ativo=eq.true&email=eq." + encodeURIComponent(em)) || [];
        if (r.length) {
          var lj = await X.api("lojas?select=id,nome,dono_id,estado&dono_id=in.(" + r.map(function (x) { return x.dono_id; }).join(",") + ")") || [];
          r.forEach(function (x) { x._loja = lj.filter(function (l) { return l.dono_id === x.dono_id; })[0] || {}; });
        }
        EQ = r; if (EQ.length && !eq()) CH = EQ[0].dono_id;
      }
    } catch (e) { EQ = []; MEUS = []; }
    A = false; var v = visivel(); if (v === "inicio" || v === "funcionarios" || /^f/.test(v)) X.desenhar();
  }
  var sync0 = PVsec.sync;
  PVsec.sync = function (x) { X = x; sync0(x); if (x.S && x.S.user && uid !== x.S.user.id) { EQ = []; MEUS = []; CH = null; if (window.PVF && window.PVF.limpar) window.PVF.limpar(); carregar(); } };

  /* ---------- início ---------- */
  var ini = PVsec.V.inicio, MARCA = '<div class="sec">A minha loja</div><div class="grid">';
  PVsec.V.inicio = function () {
    if (!X.loja && EQ.length) return window.PVF.inicioFunc ? window.PVF.inicioFunc() : '<div class="cx"><p class="vazio">A carregar…</p></div>';
    var c = X.loja ? '<a class="c" style="background:linear-gradient(135deg,#0ea5e9,#4f46e5)" href="#funcionarios"><span class="i">👥</span><b>Funcionários</b><span>Sub-contas da equipa e permissões</span>' + (MEUS.length ? '<i class="nb" style="background:#4f46e5">' + MEUS.length + "</i>" : "") + "</a>" : "";
    return ini().replace(MARCA, MARCA + c);
  };
  /* ---------- patrão: gerir funcionários ---------- */
  PVsec.V.funcionarios = function () {
    if (!X.loja) return bloq();
    return '<div class="cx"><h2>👥 Funcionários (sub-contas)</h2><p class="sub">Cada funcionário entra com o seu próprio email e só vê o que permitir. Saldo, levantamentos e conta bancária ficam só consigo.</p><button class="bt p g" data-fadd style="margin-top:10px">+ Adicionar funcionário</button></div>' +
      '<div class="cx">' + (MEUS.map(function (f) {
        return '<div class="ln"><div class="av2" style="background:' + (f.ativo ? "#4f46e5" : "#9ca3af") + '">' + esc((f.nome || f.email).charAt(0).toUpperCase()) + '</div><div class="t"><b>' + esc(f.nome || f.email) + ' <span class="bdg ' + (f.ativo ? "b-ok" : "b-cz") + '">' + (f.ativo ? "Ativo" : "Desativado") + "</span></b><span>" + esc(f.email) + " · " + esc((PAP[f.papel] || PAP.vendedor)[0]) + "</span><span>" + (f.permissoes || []).map(function (p) { return PERM[p] || p; }).join(" · ") + '</span></div><div class="ac"><button class="bt" data-fed="' + f.id + '">Editar</button></div></div>';
      }).join("") || '<p class="vazio">Ainda não adicionou funcionários.</p>') + "</div>" +
      '<div class="cx"><h2>❓ Como o funcionário entra</h2><p class="sub">1. Adicione o email dele aqui.<br>2. Ele abre suppliers.bbabilonia.com, toca em <b>Criar conta de vendedor</b> com esse email e confirma o email.<br>3. Depois entra e vê a sua loja com as permissões que escolheu.</p></div>';
  };
  function formFunc(f) {
    var n = !f; f = f || { papel: "vendedor", permissoes: PAP.vendedor[1], ativo: true };
    modal("<h2>" + (n ? "Adicionar funcionário" : "Editar funcionário") + '</h2><label class="lb">Nome</label><input class="cp" id="fN" value="' + esc(f.nome || "") + '">' +
      '<label class="lb">Email do funcionário</label><input class="cp" id="fE" type="email" value="' + esc(f.email || "") + '"' + (n ? "" : " readonly") + ">" +
      '<label class="lb">Função</label><select class="cp" id="fP">' + Object.keys(PAP).map(function (k) { return '<option value="' + k + '"' + (f.papel === k ? " selected" : "") + ">" + PAP[k][0] + "</option>"; }).join("") + "</select>" +
      '<label class="lb">Permissões</label><div class="fchk">' + Object.keys(PERM).map(function (p) { return '<label><input type="checkbox" value="' + p + '"' + ((f.permissoes || []).indexOf(p) > -1 ? " checked" : "") + ">" + PERM[p] + "</label>"; }).join("") + "</div>" +
      (n ? "" : '<label class="lb">Estado</label><select class="cp" id="fA"><option value="1"' + (f.ativo ? " selected" : "") + '>Ativo</option><option value="0"' + (f.ativo ? "" : " selected") + ">Desativado (perde o acesso)</option></select>") +
      '<button class="bt p g" id="fG">Guardar</button>' + (n ? "" : '<button class="bt g" id="fR" style="margin-top:8px;color:#b91c1c">Remover funcionário</button>') + '<button class="bt g" id="fF" style="margin-top:8px">Fechar</button><p class="msg" id="fM"></p>');
    var $ = function (i) { return document.getElementById(i); };
    $("fP").onchange = function () { var p = PAP[this.value][1]; document.querySelectorAll(".fchk input").forEach(function (c) { c.checked = p.indexOf(c.value) > -1; }); };
    $("fF").onclick = fechar;
    $("fG").onclick = async function () {
      var em = $("fE").value.trim().toLowerCase(), ps = [].map.call(document.querySelectorAll(".fchk input:checked"), function (c) { return c.value; }), m = $("fM");
      if (!/^\S+@\S+\.\S+$/.test(em)) { m.textContent = "Escreva um email válido."; return; }
      if (em === String(X.S.user.email).toLowerCase()) { m.textContent = "Esse é o seu email. Use o email do funcionário."; return; }
      if (!ps.length) { m.textContent = "Escolha pelo menos 1 permissão."; return; }
      var c = { nome: $("fN").value.trim() || null, papel: $("fP").value, permissoes: ps }; this.disabled = true;
      try {
        if (n) { c.dono_id = uid; c.email = em; await X.api("funcionarios", "POST", c); }
        else { c.ativo = $("fA").value === "1"; await X.api("funcionarios?id=eq." + f.id, "PATCH", c); }
        fechar(); X.aviso("Guardado."); A = false; uid = null; X.desenhar();
      } catch (e) { m.textContent = /duplicate|unique/i.test(e.message) ? "Este email já está na sua equipa." : /funcionarios/.test(e.message) ? "Falta correr o SQL dos funcionários no Supabase." : e.message; this.disabled = false; }
    };
    if (!n) $("fR").onclick = async function () { if (!confirm("Remover este funcionário? Ele perde o acesso.")) return; try { await X.api("funcionarios?id=eq." + f.id, "DELETE"); fechar(); X.aviso("Removido."); uid = null; X.desenhar(); } catch (e) { $("fM").textContent = e.message; } };
  }

  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    var b = t.closest("[data-fadd],[data-fed]"); if (!b) return; e.preventDefault();
    if (b.hasAttribute("data-fadd")) formFunc(null); else formFunc(MEUS.filter(function (f) { return f.id === b.getAttribute("data-fed"); })[0]);
  });
  window.PVF = { H: H, PAP: PAP, eq: eq, pode: pode, modal: modal, fechar: fechar, bloq: bloq,
    get X() { return X; }, get EQ() { return EQ; }, get CH() { return CH; }, set CH(v) { CH = v; } };
  if (!document.querySelector('script[src^="painel-vendedor-v2-equipa.js"]')) { var s2 = document.createElement("script"); s2.src = "painel-vendedor-v2-equipa.js?v=1"; s2.onload = function () { if (X && EQ.length && !X.loja) X.desenhar(); }; document.body.appendChild(s2); }
})();

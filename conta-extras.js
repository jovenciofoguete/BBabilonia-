/* conta-extras.js — B-Babilônia: novidades em Meu Babilônia (conta.html), como no AliExpress
   ❤️ Favoritos · 🏪 Lojas que sigo · 🕘 Vistos recentemente · 👤 O meu perfil (nome, telefone, palavra-passe) · 🗑️ Apagar a conta
   Não altera conta.html: só acrescenta caixas por baixo de "Os meus pedidos". */
(function () {
  if (window.__bbContaExtras) return; window.__bbContaExtras = 1;
  if ((location.pathname.split("/").pop() || "") !== "conta.html") return;
  var tent = 0;
  function arrancar() { if (!window.sb || !document.getElementById("painel")) { if (++tent < 60) setTimeout(arrancar, 150); return; } iniciar(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();

  function iniciar() {
    var sb = window.sb, painel = document.getElementById("painel"), feito = null;
    function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function arr(x) { if (typeof x === "string") { try { x = JSON.parse(x); } catch (e) { x = []; } } return Array.isArray(x) ? x : []; }
    function foto(p) { if (p.image_url) return p.image_url; var a = arr(p.images)[0]; return typeof a === "string" ? a : (a && (a.url || a.foto || a.src)) || ""; }
    function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || "MZN"); }

    var css = document.createElement("style");
    css.textContent = ".bbx-g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}" +
      ".bbx-g a{display:block;background:var(--fundo);border-radius:12px;overflow:hidden;font-size:12px;color:inherit;text-decoration:none;position:relative}" +
      ".bbx-g img,.bbx-g .sf{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:var(--linha)}" +
      ".bbx-g span{display:block;padding:5px 6px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bbx-g b{display:block;padding:0 6px 6px;font-size:12.5px}" +
      ".bbx-g button{position:absolute;top:4px;right:4px;border:0;background:#fff;border-radius:50%;width:28px;height:28px;font-size:14px;box-shadow:0 2px 6px #0003}" +
      ".bbx-l{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--linha)}.bbx-l:first-child{border-top:0}" +
      ".bbx-l .ic{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#10b981,#0ea5e9);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;flex:none}" +
      ".bbx-l a{flex:1;font-weight:700;color:inherit;text-decoration:none}.bbx-l button{border:0;border-radius:20px;padding:7px 12px;font:inherit;font-size:13px;font-weight:700;background:var(--fundo);color:var(--suave)}" +
      ".bbx-ok{color:#047857;font-size:14px;margin-top:8px}.bbx-er{color:#e11d48;font-size:14px;margin-top:8px}" +
      ".bbx-perigo{border:2px solid #fecdd3}.bbx-perigo .btn{background:#ffe4e6;color:#be123c;box-shadow:none}";
    document.head.appendChild(css);

    function caixa(id, html) {
      var d = document.getElementById(id);
      if (!d) { d = document.createElement("div"); d.id = id; d.className = "sec"; var g = painel.querySelector(".grid"); painel.insertBefore(d, g); }
      d.innerHTML = html; return d;
    }
    async function produtos(ids) {
      if (!ids.length) return [];
      var r = await sb.from("products").select("*").in("id", ids.slice(0, 60));
      var l = r.data || [], por = {}; l.forEach(function (p) { por[String(p.id)] = p; });
      return ids.map(function (i) { return por[String(i)]; }).filter(Boolean);
    }
    function grade(l, tirar) {
      return '<div class="bbx-g">' + l.map(function (p) {
        var f = foto(p);
        return '<a href="produto-bbabilonia.html?id=' + encodeURIComponent(p.id) + '">' + (f ? '<img loading="lazy" alt="" src="' + esc(f) + '">' : '<div class="sf"></div>') +
          "<span>" + esc(p.name || "Produto") + "</span><b>" + din(p.price, p.currency) + "</b>" + (tirar ? '<button data-tfav="' + esc(p.id) + '" aria-label="Tirar dos favoritos">❤️</button>' : "") + "</a>";
      }).join("") + "</div>";
    }

    async function favoritos() {
      var r = await sb.from("favoritos").select("produto_id,created_at").order("created_at", { ascending: false }).limit(60);
      if (r.error) { caixa("bbx-fav", '<h2>❤️ Favoritos</h2><div class="vazio">' + (/relation|exist/i.test(r.error.message) ? "Falta correr o SQL dos favoritos." : esc(r.error.message)) + "</div>"); return; }
      var l = await produtos((r.data || []).map(function (x) { return x.produto_id; }));
      caixa("bbx-fav", "<h2>❤️ Favoritos <span style=\"font-size:13px;color:var(--suave);font-weight:600\">" + l.length + "</span></h2>" +
        (l.length ? grade(l, true) : '<div class="vazio">Ainda não tem favoritos. Toque no ❤️ na página de um produto para o guardar aqui.</div>'));
    }
    async function lojas() {
      var r = await sb.from("lojas_seguidas").select("dono_id,created_at").order("created_at", { ascending: false }).limit(100);
      var ids = (r.data || []).map(function (x) { return x.dono_id; }), nomes = {};
      if (ids.length) { var l = await sb.from("lojas").select("dono_id,nome").in("dono_id", ids); (l.data || []).forEach(function (x) { nomes[String(x.dono_id)] = x.nome; }); }
      caixa("bbx-seg", "<h2>🏪 Lojas que sigo</h2>" + (ids.length ? ids.map(function (i) {
        var n = nomes[String(i)] || "Loja";
        return '<div class="bbx-l"><span class="ic">' + esc(n.charAt(0).toUpperCase()) + '</span><a href="loja.html?f=' + encodeURIComponent(i) + '">' + esc(n) + '</a><button data-tseg="' + esc(i) + '">Deixar de seguir</button></div>';
      }).join("") : '<div class="vazio">Ainda não segue nenhuma loja. Toque em "Seguir" na página de uma loja.</div>'));
    }
    async function vistos() {
      var ids = []; try { ids = JSON.parse(localStorage.getItem("bb_vistos") || "[]"); } catch (e) {}
      var l = await produtos(ids.slice(0, 30));
      caixa("bbx-vis", '<h2>🕘 Vistos recentemente' + (l.length ? ' <a href="#" id="bbx-limpa">Limpar</a>' : "") + "</h2>" +
        (l.length ? grade(l.slice(0, 12), false) : '<div class="vazio">Os produtos que abrir aparecem aqui.</div>'));
      var lp = document.getElementById("bbx-limpa"); if (lp) lp.onclick = function (e) { e.preventDefault(); localStorage.removeItem("bb_vistos"); vistos(); };
    }
    function perfil(u) {
      var m = u.user_metadata || {};
      caixa("bbx-per", '<h2>👤 O meu perfil</h2><label>Nome</label><input id="bbx-nome" value="' + esc(m.nome || m.full_name || "") + '" autocomplete="name">' +
        '<label>Telemóvel</label><input id="bbx-tel" type="tel" value="' + esc(m.telefone || m.phone || "") + '" autocomplete="tel">' +
        '<button class="btn" id="bbx-gp">Guardar</button><div id="bbx-pm"></div>' +
        '<label style="margin-top:18px">Palavra-passe nova (mínimo 6)</label><input id="bbx-np" type="password" autocomplete="new-password">' +
        '<button class="btn s2" id="bbx-gn">Mudar a palavra-passe</button><div id="bbx-nm"></div>');
      document.getElementById("bbx-gp").onclick = async function () {
        var b = this, out = document.getElementById("bbx-pm"); b.disabled = true;
        var r = await sb.auth.updateUser({ data: { nome: document.getElementById("bbx-nome").value.trim(), telefone: document.getElementById("bbx-tel").value.trim() } });
        b.disabled = false; out.className = r.error ? "bbx-er" : "bbx-ok"; out.textContent = r.error ? r.error.message : "✓ Perfil guardado.";
      };
      document.getElementById("bbx-gn").onclick = async function () {
        var b = this, out = document.getElementById("bbx-nm"), p = document.getElementById("bbx-np").value;
        if (p.length < 6) { out.className = "bbx-er"; out.textContent = "Escreva pelo menos 6 letras ou números."; return; }
        b.disabled = true; var r = await sb.auth.updateUser({ password: p }); b.disabled = false;
        out.className = r.error ? "bbx-er" : "bbx-ok";
        out.textContent = r.error ? (/different|same/i.test(r.error.message) ? "A palavra-passe nova tem de ser diferente da antiga." : r.error.message) : "✓ Palavra-passe mudada.";
        if (!r.error) document.getElementById("bbx-np").value = "";
      };
    }
    function apagar() {
      var d = caixa("bbx-apa", '<h2>🗑️ Apagar a conta</h2><div style="font-size:14px;color:var(--suave)">É para sempre: deixa de poder entrar e os favoritos e endereços são apagados. Os pedidos antigos ficam guardados para a garantia e as disputas.</div>' +
        '<button class="btn" id="bbx-ap">Apagar a minha conta</button><div id="bbx-am"></div>');
      d.classList.add("bbx-perigo");
      document.getElementById("bbx-ap").onclick = async function () {
        var c = prompt("Apagar a conta é para sempre.\nPara confirmar, escreva APAGAR:");
        if (c == null || c.trim().toUpperCase() !== "APAGAR") return;
        var b = this, out = document.getElementById("bbx-am"); b.disabled = true;
        var r = await sb.rpc("apagar_minha_conta");
        if (r.error) { b.disabled = false; out.className = "bbx-er"; out.textContent = r.error.message; return; }
        try { await sb.auth.signOut({ scope: "local" }); } catch (e) {}
        alert("A sua conta foi apagada."); location.href = "index.html";
      };
    }

    painel.addEventListener("click", async function (e) {
      var t = e.target.closest && e.target.closest("[data-tfav],[data-tseg]"); if (!t) return;
      e.preventDefault(); e.stopPropagation(); t.disabled = true;
      if (t.hasAttribute("data-tfav")) { await sb.from("favoritos").delete().eq("produto_id", t.getAttribute("data-tfav")); favoritos(); }
      else { await sb.from("lojas_seguidas").delete().eq("dono_id", t.getAttribute("data-tseg")); lojas(); }
    }, true);

    async function ver() {
      if (painel.classList.contains("hide")) { feito = null; return; }
      var s = (await sb.auth.getSession()).data.session; if (!s || feito === s.user.id) return;
      feito = s.user.id;
      caixa("bbx-fav", '<h2>❤️ Favoritos</h2><div class="vazio">A carregar…</div>');
      caixa("bbx-seg", '<h2>🏪 Lojas que sigo</h2><div class="vazio">A carregar…</div>');
      caixa("bbx-vis", '<h2>🕘 Vistos recentemente</h2><div class="vazio">A carregar…</div>');
      perfil(s.user); apagar();
      favoritos().catch(function () {}); lojas().catch(function () {}); vistos().catch(function () {});
    }
    new MutationObserver(ver).observe(painel, { attributes: true, attributeFilter: ["class"] });
    ver();
  }
})();

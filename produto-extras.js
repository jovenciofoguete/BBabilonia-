/* produto-extras.js — B-Babilônia: na página do produto (produto-bbabilonia.html)
   ❤️ guardar nos Favoritos · 🚩 denunciar o produto · guarda o produto em "Vistos recentemente" (neste telemóvel).
   Não altera a página: só acrescenta dois botões redondos no canto. */
(function () {
  if (window.__bbProdExtras || window.__bbVend) return; window.__bbProdExtras = 1;
  if (/^(suppliers|admin|administrator|service|atendimento)\./i.test(location.hostname)) return;
  var id = new URLSearchParams(location.search).get("id"); if (!id) return;
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0", CH = "sb-dsfoqoeawvjafypycldz-auth-token";

  /* vistos recentemente */
  try { var v = JSON.parse(localStorage.getItem("bb_vistos") || "[]").filter(function (x) { return x !== id; }); v.unshift(id); localStorage.setItem("bb_vistos", JSON.stringify(v.slice(0, 30))); } catch (e) {}

  function sessao() { try { var s = JSON.parse(localStorage.getItem(CH) || "null"); return s && s.access_token ? s : null; } catch (e) { return null; } }
  async function token() {
    var s = sessao(); if (!s) return null;
    if (s.expires_at && s.expires_at * 1000 < Date.now() + 30000 && s.refresh_token) {
      try {
        var r = await fetch(SUPA + "/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: s.refresh_token }) });
        if (!r.ok) return null; var n = await r.json(); if (!n.expires_at) n.expires_at = Math.floor(Date.now() / 1000) + (n.expires_in || 3600);
        localStorage.setItem(CH, JSON.stringify(n)); s = n;
      } catch (e) { return null; }
    }
    return s;
  }
  async function api(c, metodo, corpo) {
    var s = await token(); if (!s) throw new Error("sessao");
    var r = await fetch(SUPA + "/rest/v1/" + c, { method: metodo || "GET", headers: { apikey: KEY, Authorization: "Bearer " + s.access_token, "Content-Type": "application/json", Prefer: "return=minimal" }, body: corpo ? JSON.stringify(corpo) : undefined });
    var t = await r.text(), j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
    if (!r.ok) { var er = new Error((j && j.message) || "Erro " + r.status); er.code = j && j.code; throw er; }
    return j;
  }

  var css = document.createElement("style");
  css.textContent = ".bbp-bts{position:fixed;right:10px;top:calc(64px + env(safe-area-inset-top,0px));z-index:50;display:flex;flex-direction:column;gap:8px}" +
    ".bbp-bts button{width:42px;height:42px;border-radius:50%;border:0;background:#ffffffee;box-shadow:0 3px 10px #0003;font-size:19px;cursor:pointer;display:flex;align-items:center;justify-content:center}" +
    ".bbp-toast{position:fixed;left:12px;right:12px;bottom:90px;z-index:60;background:#0f172a;color:#fff;border-radius:12px;padding:12px 14px;font:14px system-ui,sans-serif;text-align:center;display:none}" +
    ".bbp-toast a{color:#7dd3fc;font-weight:800}" +
    ".bbp-fundo{position:fixed;inset:0;z-index:70;background:#0008;display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,sans-serif}" +
    ".bbp-jan{background:#fff;color:#0f172a;width:100%;max-width:520px;border-radius:18px 18px 0 0;padding:18px;max-height:88vh;overflow:auto}" +
    ".bbp-jan h3{margin:0 0 10px;font-size:18px}.bbp-jan label{display:flex;gap:10px;align-items:center;padding:10px 4px;border-bottom:1px solid #eef2f7;font-size:15px}" +
    ".bbp-jan input[type=radio]{width:20px;height:20px}.bbp-jan textarea{width:100%;box-sizing:border-box;margin-top:10px;padding:11px;border:2px solid #e2e8f0;border-radius:12px;font:inherit;font-size:15px}" +
    ".bbp-jan .b{display:block;width:100%;margin-top:10px;padding:14px;border:0;border-radius:14px;font:inherit;font-size:16px;font-weight:800;color:#fff;background:#e11d48}" +
    ".bbp-jan .b.l{background:#f1f5f9;color:#0f172a}.bbp-jan .m{color:#e11d48;font-size:14px;margin-top:8px}";
  document.head.appendChild(css);

  var box = document.createElement("div"); box.className = "bbp-bts";
  box.innerHTML = '<button id="bbp-fav" aria-label="Guardar nos favoritos" title="Favoritos">🤍</button><button id="bbp-den" aria-label="Denunciar este produto" title="Denunciar">🚩</button>';
  var toastEl = document.createElement("div"); toastEl.className = "bbp-toast";
  document.body.appendChild(box); document.body.appendChild(toastEl);
  function toast(h) { toastEl.innerHTML = h; toastEl.style.display = "block"; clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.style.display = "none"; }, 3500); }
  function precisaEntrar(o) { toast("Entre na sua conta para " + o + '. <a href="conta.html">Entrar ›</a>'); }

  var fav = false, bf = document.getElementById("bbp-fav");
  function pinta() { bf.textContent = fav ? "❤️" : "🤍"; bf.setAttribute("aria-label", fav ? "Tirar dos favoritos" : "Guardar nos favoritos"); }
  (async function () {
    if (!sessao()) return;
    try { var r = await api("favoritos?select=produto_id&produto_id=eq." + encodeURIComponent(id)); fav = !!(r && r.length); pinta(); } catch (e) {}
  })();
  bf.onclick = async function () {
    if (!sessao()) { precisaEntrar("guardar favoritos"); return; }
    bf.disabled = true;
    try {
      if (fav) { await api("favoritos?produto_id=eq." + encodeURIComponent(id), "DELETE"); fav = false; toast("Tirado dos favoritos."); }
      else { await api("favoritos", "POST", { produto_id: id }); fav = true; toast('❤️ Guardado nos favoritos. Veja em <a href="conta.html">Meu Babilônia</a>.'); }
      pinta();
    } catch (e) { if (e.code === "23505") { fav = true; pinta(); } else if (e.message === "sessao") precisaEntrar("guardar favoritos"); else toast("Não foi possível: " + e.message); }
    bf.disabled = false;
  };

  var MOT = ["Produto falso ou imitação", "Produto proibido ou perigoso", "Preço, fotos ou descrição enganosos", "Fotos ou texto com contactos, redes sociais ou links", "Conteúdo ofensivo", "Outro motivo"];
  document.getElementById("bbp-den").onclick = function () {
    if (!sessao()) { precisaEntrar("denunciar"); return; }
    var f = document.createElement("div"); f.className = "bbp-fundo";
    f.innerHTML = '<div class="bbp-jan"><h3>🚩 Denunciar este produto</h3>' + MOT.map(function (m, i) { return '<label><input type="radio" name="bbm" value="' + i + '">' + m + "</label>"; }).join("") +
      '<textarea id="bbp-det" rows="3" maxlength="800" placeholder="Explique (opcional)"></textarea><button class="b" id="bbp-env">Enviar denúncia</button><button class="b l" id="bbp-fec">Cancelar</button><div class="m" id="bbp-m"></div></div>';
    document.body.appendChild(f);
    f.addEventListener("click", function (e) { if (e.target === f) f.remove(); });
    document.getElementById("bbp-fec").onclick = function () { f.remove(); };
    document.getElementById("bbp-env").onclick = async function () {
      var r = f.querySelector('input[name="bbm"]:checked'), m = document.getElementById("bbp-m");
      if (!r) { m.textContent = "Escolha o motivo."; return; }
      this.disabled = true;
      var nome = "";
      try { var p = await (await fetch(SUPA + "/rest/v1/products?select=name&id=eq." + encodeURIComponent(id), { headers: { apikey: KEY } })).json(); nome = p && p[0] && p[0].name || ""; } catch (e) {}
      try {
        await api("denuncias", "POST", { tipo: "produto", alvo_id: id, alvo_nome: nome, motivo: MOT[+r.value], detalhe: document.getElementById("bbp-det").value.trim() || null });
        f.remove(); toast("Obrigado. A equipa da BBabilônia vai verificar este produto.");
      } catch (e) { this.disabled = false; m.textContent = e.message === "sessao" ? "Entre primeiro na sua conta." : e.message; }
    };
  };
})();

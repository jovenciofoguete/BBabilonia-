/* loja-extras.js — B-Babilônia: na página da loja (loja.html?f=...)
   ➕ Seguir a loja (com o número de seguidores) · 🚩 Denunciar a loja.
   Só na loja dos clientes (bbabilonia.com); nos painéis do vendedor/dono/atendimento não aparece.
   Não altera loja.html: só acrescenta os botões por baixo do nome da loja. */
(function () {
  if (window.__bbLojaExtras) return; window.__bbLojaExtras = 1;
  if ((location.pathname.split("/").pop() || "") !== "loja.html") return;
  if (/^(suppliers|admin|administrator|service|atendimento)\./i.test(location.hostname)) return;
  var dono = new URLSearchParams(location.search).get("f"); if (!dono) return;
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0", CH = "sb-dsfoqoeawvjafypycldz-auth-token";
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
  async function api(c, metodo, corpo, anon) {
    var s = anon ? null : await token(); if (!anon && !s) throw new Error("sessao");
    var r = await fetch(SUPA + "/rest/v1/" + c, { method: metodo || "GET", headers: { apikey: KEY, Authorization: "Bearer " + (s ? s.access_token : KEY), "Content-Type": "application/json", Prefer: "return=minimal" }, body: corpo ? JSON.stringify(corpo) : undefined });
    var t = await r.text(), j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
    if (!r.ok) { var er = new Error((j && j.message) || "Erro " + r.status); er.code = j && j.code; throw er; }
    return j;
  }
  var s0 = sessao(); if (s0 && s0.user && String(s0.user.id) === String(dono)) return; /* é a própria loja */

  var css = document.createElement("style");
  css.textContent = "#bbl-bx{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}" +
    "#bbl-seg{border:0;border-radius:999px;padding:8px 16px;font:inherit;font-size:14px;font-weight:800;color:#fff;background:linear-gradient(90deg,#10b981,#0ea5e9);cursor:pointer}" +
    "#bbl-seg.on{background:#e5e7eb;color:#374151}#bbl-n{font-size:13px;opacity:.85}" +
    "#bbl-den{border:0;background:transparent;font:inherit;font-size:13px;font-weight:700;color:#e11d48;cursor:pointer;padding:6px}" +
    ".bbl-toast{position:fixed;left:12px;right:12px;bottom:90px;z-index:60;background:#0f172a;color:#fff;border-radius:12px;padding:12px 14px;font:14px system-ui,sans-serif;text-align:center;display:none}.bbl-toast a{color:#7dd3fc;font-weight:800}" +
    ".bbl-fundo{position:fixed;inset:0;z-index:70;background:#0008;display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,sans-serif}" +
    ".bbl-jan{background:#fff;color:#0f172a;width:100%;max-width:520px;border-radius:18px 18px 0 0;padding:18px;max-height:88vh;overflow:auto}" +
    ".bbl-jan h3{margin:0 0 10px;font-size:18px}.bbl-jan label{display:flex;gap:10px;align-items:center;padding:10px 4px;border-bottom:1px solid #eef2f7;font-size:15px}" +
    ".bbl-jan input[type=radio]{width:20px;height:20px}.bbl-jan textarea{width:100%;box-sizing:border-box;margin-top:10px;padding:11px;border:2px solid #e2e8f0;border-radius:12px;font:inherit;font-size:15px}" +
    ".bbl-jan .b{display:block;width:100%;margin-top:10px;padding:14px;border:0;border-radius:14px;font:inherit;font-size:16px;font-weight:800;color:#fff;background:#e11d48}.bbl-jan .b.l{background:#f1f5f9;color:#0f172a}.bbl-jan .m{color:#e11d48;font-size:14px;margin-top:8px}";
  document.head.appendChild(css);
  var toastEl = document.createElement("div"); toastEl.className = "bbl-toast"; document.body.appendChild(toastEl);
  function toast(h) { toastEl.innerHTML = h; toastEl.style.display = "block"; clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.style.display = "none"; }, 3500); }

  var seg = false, n = 0;
  function montar() {
    if (document.getElementById("bbl-bx")) return true;
    var alvo = document.getElementById("bb-pro-loja") || document.getElementById("meta") || document.querySelector("h1");
    if (!alvo) return false;
    var bx = document.createElement("div"); bx.id = "bbl-bx";
    bx.innerHTML = '<button id="bbl-seg">➕ Seguir</button><span id="bbl-n"></span><button id="bbl-den">🚩 Denunciar a loja</button>';
    alvo.insertAdjacentElement("afterend", bx);
    document.getElementById("bbl-seg").onclick = seguir;
    document.getElementById("bbl-den").onclick = denunciar;
    pinta(); return true;
  }
  function pinta() {
    var b = document.getElementById("bbl-seg"), c = document.getElementById("bbl-n"); if (!b) return;
    b.textContent = seg ? "✓ A seguir" : "➕ Seguir"; b.classList.toggle("on", seg);
    c.textContent = n ? n + (n === 1 ? " seguidor" : " seguidores") : "";
  }
  async function seguir() {
    if (!sessao()) { toast('Entre na sua conta para seguir lojas. <a href="conta.html">Entrar ›</a>'); return; }
    var b = document.getElementById("bbl-seg"); b.disabled = true;
    try {
      if (seg) { await api("lojas_seguidas?dono_id=eq." + encodeURIComponent(dono), "DELETE"); seg = false; n = Math.max(0, n - 1); }
      else { await api("lojas_seguidas", "POST", { dono_id: dono }); seg = true; n++; toast('Está a seguir esta loja. Veja em <a href="conta.html">Meu Babilônia</a>.'); }
    } catch (e) { if (e.code === "23505") seg = true; else toast(e.message === "sessao" ? "Entre primeiro na sua conta." : "Não foi possível: " + e.message); }
    b.disabled = false; pinta();
  }
  var MOT = ["Vende produtos falsos ou proibidos", "Pediu para falar ou pagar fora da BBabilônia", "Não enviou a encomenda", "Informação da loja falsa", "Comportamento ofensivo", "Outro motivo"];
  function denunciar() {
    if (!sessao()) { toast('Entre na sua conta para denunciar. <a href="conta.html">Entrar ›</a>'); return; }
    var f = document.createElement("div"); f.className = "bbl-fundo";
    f.innerHTML = '<div class="bbl-jan"><h3>🚩 Denunciar esta loja</h3>' + MOT.map(function (m, i) { return '<label><input type="radio" name="bblm" value="' + i + '">' + m + "</label>"; }).join("") +
      '<textarea id="bbl-det" rows="3" maxlength="800" placeholder="Explique (opcional)"></textarea><button class="b" id="bbl-env">Enviar denúncia</button><button class="b l" id="bbl-fec">Cancelar</button><div class="m" id="bbl-m"></div></div>';
    document.body.appendChild(f);
    f.addEventListener("click", function (e) { if (e.target === f) f.remove(); });
    document.getElementById("bbl-fec").onclick = function () { f.remove(); };
    document.getElementById("bbl-env").onclick = async function () {
      var r = f.querySelector('input[name="bblm"]:checked'), m = document.getElementById("bbl-m");
      if (!r) { m.textContent = "Escolha o motivo."; return; }
      this.disabled = true;
      var nome = ((document.querySelector("h1") || {}).textContent || "").trim().slice(0, 120);
      try {
        await api("denuncias", "POST", { tipo: "loja", alvo_id: dono, alvo_nome: nome || null, motivo: MOT[+r.value], detalhe: document.getElementById("bbl-det").value.trim() || null });
        f.remove(); toast("Obrigado. A equipa da BBabilônia vai verificar esta loja.");
      } catch (e) { this.disabled = false; m.textContent = e.message === "sessao" ? "Entre primeiro na sua conta." : e.message; }
    };
  }

  (async function () {
    try { var c = await (await fetch(SUPA + "/rest/v1/rpc/seguidores_loja", { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_dono: dono }) })).json(); n = Number(c) || 0; } catch (e) {}
    if (sessao()) { try { var r = await api("lojas_seguidas?select=dono_id&dono_id=eq." + encodeURIComponent(dono)); seg = !!(r && r.length); } catch (e) {} }
    pinta();
  })();
  var tent = 0;
  (function esperar() { if (!montar() && ++tent < 80) setTimeout(esperar, 150); })();
  new MutationObserver(function () { if (!document.getElementById("bbl-bx")) montar(); }).observe(document.body, { childList: true, subtree: true });
})();

/* loja-nivel.js — B-Babilônia: selo do nível do fornecedor na página da loja (loja.html).
   Mostra por baixo do nome da loja: selo (Bronze, Prata, Ouro, Diamante), nota e tempo de resposta.
   Não altera loja.html. Os números vêm da função nivel_fornecedor no Supabase. */
(function () {
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var dono = new URLSearchParams(location.search).get("f") || "";
  if (!/^[0-9a-f-]{36}$/i.test(dono)) return;
  var NIV = [null, ["🥉", "Fornecedor Bronze", "#b45309", "#fef3c7"], ["🥈", "Fornecedor Prata", "#334155", "#e2e8f0"], ["🥇", "Fornecedor Ouro", "#854d0e", "#fef9c3"], ["💎", "Fornecedor Diamante", "#0e7490", "#cffafe"]];
  var html = "";
  var css = document.createElement("style");
  css.textContent = "#bb-nivel{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}#bb-nivel span{display:inline-block;border-radius:999px;padding:3px 10px;font-size:12.5px;font-weight:700;background:#f1f5f9;color:#334155}";
  document.head.appendChild(css);
  function n1(x) { return Number(x).toLocaleString("pt-PT", { maximumFractionDigits: 1 }); }
  function tempo(h) { if (h < 1) return "Responde em menos de 1 h"; if (h < 24) return "Responde em ~" + Math.round(h) + " h"; return "Responde em ~" + Math.round(h / 24) + " dia(s)"; }
  function por() {
    if (!html) return;
    var meta = document.getElementById("meta"), bts = document.getElementById("bts"), b = document.getElementById("bb-nivel");
    if (!meta || !meta.parentNode || !bts || bts.hidden) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("div"); b.id = "bb-nivel"; meta.insertAdjacentElement("afterend", b); }
    if (b.innerHTML !== html) b.innerHTML = html;
  }
  fetch(SUPA + "/rest/v1/rpc/nivel_fornecedor", { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_vendedor: dono }) })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (s) {
      if (!s) return;
      var p = [], L = NIV[Number(s.nivel) || 0];
      if (L) p.push('<span style="background:' + L[3] + ";color:" + L[2] + '">' + L[0] + " " + L[1] + "</span>");
      if (s.nota != null && s.avaliacoes > 0) p.push("<span>⭐ " + n1(s.nota) + " (" + s.avaliacoes + ")</span>");
      if (s.tempo_resposta_h != null) p.push("<span>⏱️ " + tempo(s.tempo_resposta_h) + "</span>");
      if (s.vendas > 0) p.push("<span>✅ " + s.vendas + (s.vendas === 1 ? " venda" : " vendas") + "</span>");
      html = p.join(""); por();
    }).catch(function () {});
  new MutationObserver(por).observe(document.body, { childList: true, subtree: true });
})();

/* confirmacao-produto.js — BBabilônia (12/11/2026)
   Bloco "Verificação BBabilônia" na página do produto: loja (bandeira, província, distrito, bairro),
   % de avaliações positivas e as verificações físicas feitas pelos agentes (fotos, vídeos, confirmado/recusado).
   Visível para todos: clientes (produto-loja.html), dono/admin e o próprio vendedor (produto-vendedor.html). */
(function () {
  if (window.__bbConfProd) return; window.__bbConfProd = 1;
  var SB = "https://dsfoqoeawvjafypycldz.supabase.co", K = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var H = { apikey: K, Authorization: "Bearer " + K };
  var id = new URLSearchParams(location.search).get("id") || "";
  if (!id) return;
  var d = document;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function arr(x) { if (typeof x === "string") { try { x = JSON.parse(x); } catch (e) { x = []; } } return Array.isArray(x) ? x : []; }
  function bandeira(c) { return /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(127397 + c.charCodeAt(0), 127397 + c.charCodeAt(1)) : ""; }
  function data(t) { try { return new Date(t).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch (e) { return ""; } }
  function json(u, o) { return fetch(u, o || { headers: H }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }); }

  var css = d.createElement("style");
  css.textContent =
    "#bb-conf{margin:14px 16px;padding:12px;border:1px solid rgba(127,127,127,.3);border-radius:12px;background:var(--card,#fff);color:inherit}" +
    "#bb-conf h3{margin:0 0 8px;font-size:1rem}" +
    "#bb-conf .lc{font-size:.92rem;margin:2px 0}" +
    "#bb-conf .pa{font-size:.9rem;font-weight:700;color:#0f9d58;margin:2px 0 8px}#bb-conf .pa.z{color:inherit;opacity:.7;font-weight:400}" +
    "#bb-conf .est{padding:10px;border-radius:10px;font-size:.92rem;font-weight:700;margin:6px 0}" +
    "#bb-conf .est.ok{background:#d1fae5;color:#065f46}#bb-conf .est.no{background:#fee2e2;color:#991b1b}#bb-conf .est.nd{background:rgba(127,127,127,.15);font-weight:400}" +
    "#bb-conf .est small{display:block;font-weight:400;margin-top:3px}" +
    "#bb-conf .it{border-top:1px solid rgba(127,127,127,.25);padding:10px 0 4px}" +
    "#bb-conf .it .l1{display:flex;justify-content:space-between;gap:8px;font-size:.82rem;opacity:.85}" +
    "#bb-conf .it .r{font-weight:800}#bb-conf .it .r.ok{color:#059669}#bb-conf .it .r.no{color:#dc2626}" +
    "#bb-conf .it p{margin:4px 0;font-size:.9rem;white-space:pre-line}" +
    "#bb-conf .md{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}" +
    "#bb-conf .md img{width:84px;height:84px;object-fit:cover;border-radius:8px;display:block}" +
    "#bb-conf .md video{width:100%;max-height:320px;border-radius:8px;background:#000}" +
    "#bb-conf .mais{width:100%;margin-top:6px;padding:9px;border:1px solid rgba(127,127,127,.35);border-radius:10px;background:none;color:inherit;font-weight:700}";
  d.head.appendChild(css);

  function lugar() {
    var det = d.getElementById("detalhes");
    if (det && det.parentNode) return function (el) { det.parentNode.insertBefore(el, det); };
    var bts = d.querySelector("main .bts");
    if (bts && bts.parentNode) return function (el) { bts.parentNode.insertBefore(el, bts); };
    return null;
  }

  var n = 0;
  var t = setInterval(function () {
    if (++n > 100) { clearInterval(t); return; }
    if (d.getElementById("bb-conf")) { clearInterval(t); return; }
    var pos = lugar(); if (!pos) return;
    clearInterval(t);
    var box = d.createElement("div"); box.id = "bb-conf";
    box.innerHTML = "<h3>🛡️ Verificação BBabilônia</h3><div class='lc'>A carregar…</div>";
    pos(box);
    carregar(box);
  }, 300);

  function carregar(box) {
    Promise.all([
      json(SB + "/rest/v1/products?select=supplier_id&id=eq." + encodeURIComponent(id)),
      json(SB + "/rest/v1/rpc/paises_fornecedores", { method: "POST", headers: { apikey: K, Authorization: "Bearer " + K, "Content-Type": "application/json" }, body: "{}" }),
      json(SB + "/rest/v1/confirmacoes_produto?select=*&product_id=eq." + encodeURIComponent(id) + "&order=created_at.desc&limit=50")
    ]).then(function (r) {
      var dono = r[0] && r[0][0] && r[0][0].supplier_id, loja = null;
      (r[1] || []).forEach(function (x) { if (dono && String(x.dono) === String(dono)) loja = x; });
      desenhar(box, loja, r[2] || []);
    });
  }

  function desenhar(box, loja, cs) {
    var h = "<h3>🛡️ Verificação BBabilônia</h3>";
    if (loja) {
      var c = String(loja.pais || "").toUpperCase();
      var partes = [loja.provincia, loja.distrito, loja.bairro].filter(function (x) { return x && String(x).trim(); });
      if (partes.length) h += "<div class='lc'>📍 " + esc(bandeira(c)) + " " + esc(partes.join(" · ")) + "</div>";
      var tot = Number(loja.avaliacoes) || 0, boas = Number(loja.positivas) || 0;
      h += tot ? "<div class='pa'>👍 " + Math.round(boas * 100 / tot) + "% avaliações positivas (" + tot + ")</div>"
               : "<div class='pa z'>👍 Loja ainda sem avaliações</div>";
    }
    if (!cs.length) {
      h += "<div class='est nd'>⏳ Este produto ainda não foi verificado fisicamente por um agente da BBabilônia.</div>";
    } else {
      var u = cs[0];
      h += u.resultado === "confirmado"
        ? "<div class='est ok'>✅ Confirmado por agente da BBabilônia: produto real, exato e sem defeito<small>" + esc(data(u.created_at)) + (u.agente_nome ? " · " + esc(u.agente_nome) : "") + "</small></div>"
        : "<div class='est no'>❌ Recusado pelo agente da BBabilônia<small>Motivo: " + esc(u.motivo || "—") + " · " + esc(data(u.created_at)) + "</small></div>";
    }
    var mostrar = 3;
    function lista() {
      return cs.slice(0, mostrar).map(function (x) {
        var fs = arr(x.fotos), vs = arr(x.videos), ok = x.resultado === "confirmado";
        return "<div class='it'><div class='l1'><span class='r " + (ok ? "ok" : "no") + "'>" + (ok ? "✅ Confirmado" : "❌ Recusado") + "</span><span>" + esc(data(x.created_at)) + (x.agente_nome ? " · " + esc(x.agente_nome) : "") + "</span></div>" +
          (x.motivo ? "<p>" + (ok ? "" : "<b>Motivo:</b> ") + esc(x.motivo) + "</p>" : "") +
          (fs.length ? "<div class='md'>" + fs.map(function (f) { return "<a href='" + esc(f) + "' target='_blank' rel='noopener'><img loading='lazy' src='" + esc(f) + "' alt='Foto da verificação'></a>"; }).join("") + "</div>" : "") +
          (vs.length ? "<div class='md'>" + vs.map(function (v) { return "<video controls playsinline preload='metadata' src='" + esc(v) + "'></video>"; }).join("") + "</div>" : "") +
          "</div>";
      }).join("") + (cs.length > mostrar ? "<button type='button' class='mais'>Ver mais verificações (" + (cs.length - mostrar) + ")</button>" : "");
    }
    function pintar() {
      box.innerHTML = h + (cs.length ? "<div style='margin-top:6px;font-size:.85rem;opacity:.8'>Fotos e vídeos da verificação na loja:</div>" + lista() : "");
      var b = box.querySelector(".mais"); if (b) b.onclick = function () { mostrar += 5; pintar(); };
    }
    pintar();
  }
})();

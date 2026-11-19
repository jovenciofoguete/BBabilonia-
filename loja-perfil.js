/* loja-perfil.js — BBabilônia (19/11/2026)
   Painel do vendedor: o responsável da loja TEM de completar o perfil da loja (foto de perfil + nome) antes de usar o painel.
   O cartão da loja mostra só a foto, o nome, "Verificado" e o país. O resto (ID, tipo, documentos, BI, NUIT, telemóvel, endereço) só a BBabilônia vê.
   Também na página da loja (loja.html, lado do cliente): foto da loja, número de seguidores e botão "Seguir" para qualquer cliente.
   Funcionários (sem loja própria) não são afetados. Só acrescenta: não altera os outros ficheiros. */
(function () {
  if (window.__bbPerfilLoja) return; window.__bbPerfilLoja = 1;
  var SB = "https://dsfoqoeawvjafypycldz.supabase.co", K = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var KEY = "sb-dsfoqoeawvjafypycldz-auth-token", DONO = "jovenciofoguete1904@gmail.com", BUCKET = "loja-fotos";
  var L = null, uid = null, tent = 0, SEG = null;
  var PAINEL = !!document.getElementById("v-inicio"), LOJA = !!document.getElementById("bts") || /loja\.html/i.test(location.pathname);

  function sessao() { try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && s.currentSession) s = s.currentSession; return s && s.access_token && s.user ? s : null; } catch (e) { return null; } }
  function H(s, x) { var h = { apikey: K, Authorization: "Bearer " + s.access_token }; for (var k in (x || {})) h[k] = x[k]; return h; }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  var css = document.createElement("style");
  css.textContent = "#bb-lp{position:fixed;inset:0;z-index:10000;background:#0f172af2;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,sans-serif}" +
    "#bb-lp .cx{background:#fff;color:#0f172a;width:100%;max-width:440px;max-height:94vh;overflow:auto;border-radius:18px;padding:18px}" +
    "#bb-lp h2{font-size:18px;margin:0 0 4px}#bb-lp p{font-size:13.5px;color:#64748b;margin:0 0 8px}" +
    "#bb-lp label{display:block;font-size:13px;font-weight:700;color:#475569;margin-top:12px}" +
    "#bb-lp input[type=text]{width:100%;box-sizing:border-box;padding:12px;border:2px solid #e2e8f0;border-radius:10px;font-size:16px;margin-top:4px}" +
    "#bb-lp .foto{display:flex;gap:14px;align-items:center;margin-top:6px}" +
    "#bb-lp .pv{flex:none;width:84px;height:84px;border-radius:18px;background:#1e1b4b;color:#fff;display:grid;place-items:center;font-size:34px;font-weight:800;overflow:hidden}" +
    "#bb-lp .pv img{width:100%;height:100%;object-fit:cover}" +
    "#bb-lp .esc{flex:1;border:2px dashed #c4b5fd;border-radius:12px;padding:12px;text-align:center;font-weight:800;font-size:14px;color:#5b21b6;background:#f5f3ff}" +
    "#bb-lp .bt{width:100%;border:0;border-radius:12px;padding:14px;font-weight:800;font-size:15px;color:#fff;background:#7c3aed;margin-top:16px}" +
    "#bb-lp .bt:disabled{opacity:.5}#bb-lp .er{color:#dc2626;font-size:14px;margin-top:8px}";
  document.head.appendChild(css);

  function buscar(s) {
    return fetch(SB + "/rest/v1/lojas?select=*&dono_id=eq." + encodeURIComponent(s.user.id) + "&limit=1", { headers: H(s) })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (l) { return l && l[0] ? l[0] : null; });
  }
  function enviar(s, file) {
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    var caminho = s.user.id + "/perfil-" + Date.now() + "." + ext;
    return fetch(SB + "/storage/v1/object/" + BUCKET + "/" + caminho, { method: "POST", headers: H(s, { "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" }), body: file })
      .then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error("Foto não enviada: " + t.slice(0, 120)); }); return SB + "/storage/v1/object/public/" + BUCKET + "/" + caminho; });
  }
  function rpc(s, nome, corpo) {
    return fetch(SB + "/rest/v1/rpc/" + nome, { method: "POST", headers: H(s, { "Content-Type": "application/json" }), body: JSON.stringify(corpo) })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} if (!r.ok) throw new Error((j && j.message) || "Erro " + r.status); return j; }); });
  }

  /* janela obrigatória: não se fecha sem foto e nome */
  function janela(s, l, opcional) {
    if (document.getElementById("bb-lp")) return;
    var m = document.createElement("div"); m.id = "bb-lp";
    var ini = esc(((l.nome || "?").charAt(0) || "?").toUpperCase());
    m.innerHTML = "<div class='cx'><h2>🏪 Complete a sua loja</h2><p>Obrigatório antes de usar o painel. Os clientes veem só a foto e o nome da loja. Os seus outros dados só a BBabilônia vê.</p>" +
      "<label>Foto de perfil da loja</label><div class='foto'><div class='pv' id='lp-pv'>" + ini + "</div><label class='esc'>📷 Escolher foto<input id='lp-f' type='file' accept='image/*' hidden></label></div>" +
      "<label for='lp-n'>Nome da loja</label><input id='lp-n' type='text' maxlength='80' autocomplete='off' value='" + esc(l.nome || "") + "'>" +
      "<button class='bt' id='lp-g' type='button'>Guardar e continuar</button>" + (opcional ? "<button class='bt' id='lp-x' type='button' style='background:#e2e8f0;color:#334155;margin-top:8px'>Cancelar</button>" : "") + "<div class='er' id='lp-e'></div></div>";
    document.body.appendChild(m);
    var f = document.getElementById("lp-f");
    if (opcional) document.getElementById("lp-x").onclick = function () { m.remove(); };
    f.onchange = function () {
      var a = f.files && f.files[0]; if (!a) return;
      var u = URL.createObjectURL(a); document.getElementById("lp-pv").innerHTML = "<img alt='' src='" + u + "'>";
    };
    document.getElementById("lp-g").onclick = function () {
      var b = this, e = document.getElementById("lp-e"), n = document.getElementById("lp-n").value.trim(), a = f.files && f.files[0];
      e.textContent = "";
      if (n.length < 2) return (e.textContent = "Escreva o nome da loja.");
      if (!l.foto_url && !a) return (e.textContent = "Escolha a foto de perfil da loja.");
      if (a && a.size > 8 * 1024 * 1024) return (e.textContent = "A foto é grande demais (máximo 8 MB).");
      b.disabled = true; b.textContent = "A guardar…";
      var p = a ? enviar(s, a) : Promise.resolve(l.foto_url);
      p.then(function (url) { return rpc(s, "loja_guardar_perfil", { p_nome: n, p_foto_url: url }); })
        .then(function () { location.reload(); })
        .catch(function (x) { e.textContent = /function|schema cache|404/i.test(x.message) ? "Falta correr o SQL do perfil da loja no Supabase." : x.message; b.disabled = false; b.textContent = "Guardar e continuar"; });
    };
  }

  /* cartão da loja no painel: só foto, nome, selo e país */
  function cartao() {
    var c = document.querySelector(".loja1"); if (!c || !L) return;
    var ic = c.querySelector(".ic");
    if (ic && L.foto_url && !ic.querySelector("img")) {
      ic.style.padding = "0"; ic.style.overflow = "hidden";
      ic.innerHTML = "<img alt='' src='" + esc(L.foto_url) + "' style='width:100%;height:100%;object-fit:cover'>";
    }
    var mm = c.querySelector(".m");
    if (mm && /ID da loja/.test(mm.textContent)) {
      mm.textContent = mm.textContent.split(" · ").filter(function (x) { return !/^\s*(ID da loja|Tipo):/.test(x); }).join(" · ");
    }
    if (SEG != null && !c.querySelector("#lp-seg")) {
      var q = document.createElement("div"); q.id = "lp-seg"; q.className = "m"; q.textContent = "👥 " + SEG + (SEG === 1 ? " seguidor" : " seguidores");
      var mm2 = c.querySelector(".m"); if (mm2) mm2.insertAdjacentElement("afterend", q);
    }
    var lk = c.querySelector("a.lk");
    if (lk && !c.querySelector("#lp-mudar")) {
      var b = document.createElement("a"); b.id = "lp-mudar"; b.className = "lk"; b.href = "#"; b.textContent = "📷 Mudar a foto";
      b.onclick = function (ev) { ev.preventDefault(); var s = sessao(); if (s && L) janela(s, L, true); };
      lk.parentNode.appendChild(b);
    }
  }
  var t = null;
  function agendar() { clearTimeout(t); t = setTimeout(cartao, 30); }

  function arrancar() {
    if (LOJA && !PAINEL) return loja();
    if (!PAINEL) return;
    var s = sessao();
    if (!s) { if (++tent < 40) setTimeout(arrancar, 750); return; }
    if (String(s.user.email || "").toLowerCase() === DONO) return;
    uid = s.user.id;
    buscar(s).then(function (l) {
      if (!l) return;                       /* funcionário ou ainda sem loja: nada a fazer aqui */
      L = l;
      rpc(s, "loja_meus_seguidores", {}).then(function (n) { SEG = Number(n) || 0; cartao(); }).catch(function () {});
      cartao();
      new MutationObserver(agendar).observe(document.body, { childList: true, subtree: true });
      if (!l.foto_url || !String(l.nome || "").trim()) janela(s, l);
    }).catch(function () {});
  }

  /* ---------- página da loja (cliente): foto, seguidores e botão Seguir ---------- */
  function loja() {
    var dono = new URLSearchParams(location.search).get("f") || "";
    if (!/^[0-9a-f-]{36}$/i.test(dono)) return;
    var info = null, ocupado = false;
    var st = document.createElement("style");
    st.textContent = "#lp-sg{display:flex;gap:8px;align-items:center;margin-top:8px;font-size:13px}#lp-sg b{font-weight:800}" +
      "#lp-bs{flex:none;border:2px solid #fff;background:transparent;color:#fff;border-radius:999px;padding:7px 14px;font:800 13.5px system-ui,sans-serif;cursor:pointer}" +
      "#lp-bs.on{background:#fff;color:#1B2F6B}#lp-bs:disabled{opacity:.5}";
    document.head.appendChild(st);
    function pr(nome, corpo, tok) {
      return fetch(SB + "/rest/v1/rpc/" + nome, { method: "POST", headers: { apikey: K, Authorization: "Bearer " + (tok || K), "Content-Type": "application/json" }, body: JSON.stringify(corpo) })
        .then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} if (!r.ok) throw new Error((j && j.message) || "Erro " + r.status); return j; }); });
    }
    function desenhar() {
      var capa = document.getElementById("capa"); if (!capa || !info) return;
      var ini = document.getElementById("ini");
      if (info.foto && ini && !ini.querySelector("img")) { ini.style.overflow = "hidden"; ini.textContent = ""; ini.innerHTML = "<img alt='' src='" + esc(info.foto) + "' style='width:100%;height:100%;object-fit:cover'>"; }
      var bts = document.getElementById("bts");
      if (!bts || bts.hidden) return;                    /* o fornecedor a ver a própria loja não segue */
      var bx = document.getElementById("lp-sg");
      if (!bx) { bx = document.createElement("div"); bx.id = "lp-sg"; (document.getElementById("meta") || capa).insertAdjacentElement("afterend", bx); }
      var n = Number(info.total) || 0;
      bx.innerHTML = "<button type='button' id='lp-bs' class='" + (info.seguindo ? "on" : "") + "'>" + (info.seguindo ? "✓ A seguir" : "➕ Seguir") + "</button><span><b>" + n + "</b> " + (n === 1 ? "seguidor" : "seguidores") + "</span>";
      document.getElementById("lp-bs").onclick = alternar;
    }
    function alternar() {
      if (ocupado) return;
      var s = sessao();
      if (!s) { alert("Entre na sua conta para seguir esta loja."); location.href = "conta.html"; return; }
      ocupado = true; document.getElementById("lp-bs").disabled = true;
      pr(info.seguindo ? "loja_deixar_seguir" : "loja_seguir", { p_dono: dono }, s.access_token)
        .then(function () { return pr("loja_seguir_info", { p_dono: dono }, s.access_token); })
        .then(function (j) { info = j; })
        .catch(function (e) { alert(/function|schema cache|404/i.test(e.message) ? "Falta correr o SQL de seguir lojas no Supabase." : e.message); })
        .then(function () { ocupado = false; desenhar(); });
    }
    var s0 = sessao();
    pr("loja_seguir_info", { p_dono: dono }, s0 && s0.access_token).then(function (j) {
      info = j; desenhar();
      var t2 = null; new MutationObserver(function () { clearTimeout(t2); t2 = setTimeout(desenhar, 40); }).observe(document.body, { childList: true, subtree: true });
    }).catch(function () {});
  }
  if (document.body) arrancar(); else document.addEventListener("DOMContentLoaded", arrancar);
})();

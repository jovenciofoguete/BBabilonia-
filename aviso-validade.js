/* aviso-validade.js — BBabilônia (12/11/2026)
   de=atd  (atendimento e busca/verificação): pede os dados do agente (foto de meio corpo, morada, NUIT, BI) se faltarem,
           e avisa quando o BI está a expirar.
   de=forn (painel do vendedor): pede a validade do BI do responsável da loja e avisa quando está a expirar.
   BI expirado há mais de 7 dias: a conta é bloqueada (rever_validades, quando o dono abre o painel). */
(function () {
  if (window.__bbValidade) return; window.__bbValidade = 1;
  var SB = "https://dsfoqoeawvjafypycldz.supabase.co", K = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var DONO = "jovenciofoguete1904@gmail.com";
  var me = document.currentScript || document.querySelector('script[src*="aviso-validade.js"]');
  var DE = /de=forn/.test((me && me.src) || "") ? "forn" : "atd";

  function sessao() {
    try {
      if (DE === "atd") { var a = JSON.parse(sessionStorage.getItem("bb-atd") || "null"); if (a && a.access_token) return a; }
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) { var s = JSON.parse(localStorage.getItem(k) || "null"); if (s && s.access_token) return s; }
      }
    } catch (e) {}
    return null;
  }
  function H(s, extra) { var h = { apikey: K, Authorization: "Bearer " + s.access_token }; for (var x in extra) h[x] = extra[x]; return h; }
  function rpc(s, nome, corpo) {
    return fetch(SB + "/rest/v1/rpc/" + nome, { method: "POST", headers: H(s, { "Content-Type": "application/json" }), body: JSON.stringify(corpo || {}) })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} if (!r.ok) throw new Error((j && j.message) || "Erro " + r.status); return j; }); });
  }
  function enviar(s, file, nome) {
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    var caminho = s.user.id + "/" + nome + "-" + Date.now() + "." + ext;
    return fetch(SB + "/storage/v1/object/documentos-validade/" + caminho, { method: "POST", headers: H(s, { "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" }), body: file })
      .then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error("Foto não enviada: " + t.slice(0, 120)); }); return caminho; });
  }
  function dt(d) { try { return new Date(d + "T00:00:00").toLocaleDateString("pt-PT"); } catch (e) { return d; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  var css = document.createElement("style");
  css.textContent = "#bb-val{position:sticky;top:0;z-index:9997;display:flex;gap:10px;align-items:center;padding:11px 14px;font:700 14px/1.35 system-ui,sans-serif}" +
    "#bb-val span{flex:1}#bb-val button{border:0;border-radius:999px;padding:7px 12px;font:800 13px system-ui,sans-serif;background:#fff;color:#0f172a}" +
    "#bb-val.am{background:#f59e0b;color:#111}#bb-val.vm{background:#dc2626;color:#fff}" +
    "#bb-vm{position:fixed;inset:0;z-index:9999;background:#0f172acc;display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,sans-serif}" +
    "#bb-vm .cx{background:#fff;color:#0f172a;width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:18px 18px 0 0;padding:16px}" +
    "#bb-vm h2{font-size:17px;margin:0 0 4px}#bb-vm p{font-size:13px;color:#64748b;margin:0 0 6px}" +
    "#bb-vm label{display:block;font-size:13px;font-weight:700;color:#475569;margin-top:10px}" +
    "#bb-vm input{width:100%;box-sizing:border-box;padding:11px;border:2px solid #e2e8f0;border-radius:10px;font-size:16px;margin-top:4px}" +
    "#bb-vm .bt{width:100%;border:0;border-radius:12px;padding:13px;font-weight:800;font-size:15px;color:#fff;background:#2563eb;margin-top:14px}" +
    "#bb-vm .bt.g{background:#e2e8f0;color:#334155;margin-top:8px}#bb-vm .bt:disabled{opacity:.5}" +
    "#bb-vm .er{color:#dc2626;font-size:14px;margin-top:8px;white-space:pre-line}";
  document.head.appendChild(css);

  function faixa(cls, txt, acao) {
    var a = document.getElementById("bb-val"); if (a) a.remove();
    a = document.createElement("div"); a.id = "bb-val"; a.className = cls;
    a.innerHTML = "<span></span><button type='button'>Atualizar ›</button>";
    a.querySelector("span").textContent = txt; a.querySelector("button").onclick = acao;
    document.body.insertBefore(a, document.body.firstChild);
  }

  /* janela: atualizar só a validade e a foto do BI */
  function janelaBI(s) {
    var m = document.createElement("div"); m.id = "bb-vm";
    m.innerHTML = "<div class='cx'><h2>🪪 Bilhete de identidade</h2><p>Registe a data de validade e uma foto nítida do BI (frente). Com o BI expirado há mais de 7 dias a conta é bloqueada.</p>" +
      "<label>Válido até</label><input id='bb-vd' type='date'><label>Foto do BI</label><input id='bb-vf' type='file' accept='image/*'>" +
      "<button class='bt' id='bb-vg' type='button'>Guardar</button><button class='bt g' id='bb-vx' type='button'>Agora não</button><div class='er' id='bb-ve'></div></div>";
    document.body.appendChild(m);
    document.getElementById("bb-vx").onclick = function () { m.remove(); };
    document.getElementById("bb-vg").onclick = function () {
      var b = this, e = document.getElementById("bb-ve"), d = document.getElementById("bb-vd").value, f = document.getElementById("bb-vf").files[0];
      e.textContent = "";
      if (!d) return e.textContent = "Escolha a data de validade.";
      if (!f) return e.textContent = "Tire ou escolha a foto do BI.";
      b.disabled = true; b.textContent = "A enviar…";
      enviar(s, f, "bi").then(function (c) { return rpc(s, "guardar_validade_bi", { p_validade: d, p_foto_url: c }); })
        .then(function () { m.remove(); var a = document.getElementById("bb-val"); if (a) a.remove(); })
        .catch(function (x) { e.textContent = x.message; b.disabled = false; b.textContent = "Guardar"; });
    };
  }

  /* janela: dados completos do agente (não dá para fechar sem preencher) */
  function janelaAgente(s, eq) {
    var m = document.createElement("div"); m.id = "bb-vm";
    m.innerHTML = "<div class='cx'><h2>" + (eq === "verificacao" ? "🛡️" : "🎧") + " Os seus dados de agente</h2><p>Obrigatório antes de começar. Só a administração vê estes dados.</p>" +
      "<label>Nome completo (como no BI)</label><input id='ag-n' maxlength='80'>" +
      "<label>Telemóvel</label><input id='ag-t' type='tel' maxlength='18'>" +
      "<label>Morada (bairro, rua, nº)</label><input id='ag-m' maxlength='160'>" +
      "<label>NUIT pessoal</label><input id='ag-u' inputmode='numeric' maxlength='12'>" +
      "<label>Número do BI</label><input id='ag-b' maxlength='20'>" +
      "<label>BI válido até</label><input id='ag-v' type='date'>" +
      "<label>Foto de meio corpo (cara visível, igual à do BI)</label><input id='ag-f' type='file' accept='image/*' capture='user'>" +
      "<label>Foto do BI (frente)</label><input id='ag-i' type='file' accept='image/*'>" +
      "<button class='bt' id='ag-g' type='button'>Guardar os meus dados</button><div class='er' id='ag-e'></div></div>";
    document.body.appendChild(m);
    document.getElementById("ag-g").onclick = function () {
      var b = this, e = document.getElementById("ag-e"), v = function (i) { return document.getElementById(i).value.trim(); };
      var f = document.getElementById("ag-f").files[0], bi = document.getElementById("ag-i").files[0];
      e.textContent = "";
      if (v("ag-n").length < 3 || v("ag-t").replace(/\D/g, "").length < 9 || v("ag-m").length < 3 || v("ag-u").replace(/\D/g, "").length < 9 || v("ag-b").length < 5 || !v("ag-v"))
        return e.textContent = "Preencha todos os campos (NUIT com 9 algarismos).";
      if (!f || !bi) return e.textContent = "Envie a foto de meio corpo e a foto do BI.";
      b.disabled = true; b.textContent = "A enviar…";
      var foto;
      enviar(s, f, "meio-corpo").then(function (c) { foto = c; return enviar(s, bi, "bi"); })
        .then(function (c) { return rpc(s, "agente_guardar_dados", { p_nome: v("ag-n"), p_telefone: v("ag-t"), p_morada: v("ag-m"), p_nuit: v("ag-u"), p_bi_numero: v("ag-b"), p_bi_validade: v("ag-v"), p_foto_url: foto, p_bi_url: c }); })
        .then(function () { m.remove(); })
        .catch(function (x) { e.textContent = x.message; b.disabled = false; b.textContent = "Guardar os meus dados"; });
    };
  }

  function rever() {
    var s = sessao(); if (!s || !s.user) return;
    if (String(s.user.email || "").toLowerCase() === DONO) return;
    rpc(s, "minha_validade_bi").then(function (d) {
      d = d || {};
      if (DE === "atd" && d.agente && !d.dados_agente_completos) { if (!document.getElementById("bb-vm")) janelaAgente(s, d.agente); return; }
      var abrir = function () { if (!document.getElementById("bb-vm")) janelaBI(s); };
      if (!d.validade) {
        if (DE !== "forn") return;
        /* só o responsável da loja (não os funcionários) */
        fetch(SB + "/rest/v1/lojas?select=id&dono_id=eq." + s.user.id, { headers: H(s, {}) }).then(function (r) { return r.ok ? r.json() : []; })
          .then(function (l) { if (l && l.length) faixa("am", "🪪 Registe a validade do seu bilhete de identidade (BI).", abrir); }).catch(function () {});
        return;
      }
      var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      var dias = Math.round((new Date(d.validade + "T00:00:00") - hoje) / 864e5);
      if (dias < 0) faixa("vm", "⛔ O seu BI expirou a " + dt(d.validade) + ". Atualize-o em " + Math.max(0, 7 + dias) + " dia(s) ou a conta será bloqueada.", abrir);
      else if (dias <= 30) faixa("am", "🪪 O seu BI expira a " + dt(d.validade) + " (" + dias + " dia" + (dias === 1 ? "" : "s") + "). Atualize-o a tempo.", abrir);
    }).catch(function () {});
  }
  function arrancar() { rever(); var n = 0, t = setInterval(function () { if (document.getElementById("bb-val") || document.getElementById("bb-vm") || ++n > 6) { clearInterval(t); return; } rever(); }, 5000); }
  if (document.body) arrancar(); else document.addEventListener("DOMContentLoaded", arrancar);
})();

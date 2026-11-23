/* pin-acao.js — BBabilônia (23/11/2026): PIN DE PAGAMENTOS antes das mudanças sensíveis (diferente do PIN de entrada).
   - Painel do dono (admin-taxas.html): guardar taxas e planos.
   - Fornecedor (meios-receber.html): acrescentar, mudar ou apagar meios para receber — só o dono da loja (os funcionários não).
   Na primeira vez a pessoa cria o PIN de pagamentos (pede o PIN de entrada para confirmar). Não tem recuperação: se esquecer,
   só o dono da BBabilônia o repõe (🔢 Repor PIN no painel do dono). PIN certo = 5 minutos para fazer as mudanças.
   Tem de ser carregado ANTES do supabase-js (para apanhar os pedidos). */
(function () {
  if (window.__bbPinAcao) return; window.__bbPinAcao = 1;
  var SK = "sb-dsfoqoeawvjafypycldz-auth-token", ATE = 0, f0 = window.fetch.bind(window);
  var SENS = [/\/rest\/v1\/rpc\/bb_taxas_definir/, /\/rest\/v1\/rpc\/bb_planos_definir/];
  function sensivel(u, m) {
    u = String(u || ""); m = String(m || "GET").toUpperCase();
    if (SENS.some(function (r) { return r.test(u); })) return true;
    return /\/rest\/v1\/meios_recebimento/.test(u) && m !== "GET" && m !== "HEAD";
  }
  function token() { try { var s = JSON.parse(localStorage.getItem(SK) || "null"); if (s && s.currentSession) s = s.currentSession; return s && s.access_token; } catch (e) { return null; } }

  var css = document.createElement("style");
  css.textContent = "#bb-pin{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.65);display:flex;align-items:center;justify-content:center;padding:18px;font-family:system-ui,Arial,sans-serif}" +
    "#bb-pin .cx{background:#fff;color:#0f172a;border-radius:16px;padding:18px;width:100%;max-width:360px;box-shadow:0 10px 40px #0006}" +
    "#bb-pin h3{margin:0 0 6px;font-size:18px}#bb-pin p{margin:0 0 12px;font-size:13.5px;color:#475569;line-height:1.45}" +
    "#bb-pin input{width:100%;box-sizing:border-box;font-size:26px;letter-spacing:10px;text-align:center;padding:12px;border:2px solid #cbd5e1;border-radius:12px}" +
    "#bb-pin .er{color:#b91c1c;font-size:13.5px;font-weight:700;min-height:18px;margin-top:8px}" +
    "#bb-pin .bs{display:flex;gap:8px;margin-top:10px}#bb-pin button{flex:1;border:0;border-radius:12px;padding:13px;font-size:15px;font-weight:800}" +
    "#bb-pin .ok{background:#1e3a8a;color:#fff}#bb-pin .no{background:#e2e8f0;color:#0f172a}#bb-pin button:disabled{opacity:.5}";
  (document.head || document.documentElement).appendChild(css);

  var aberta = null;
  async function chamar(corpo) {
    var r = await f0("/api/pin-2fa", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (token() || "") }, body: JSON.stringify(corpo) });
    var j = await r.json().catch(function () { return {}; });
    return { ok: r.ok && j.ok, j: j, r: r };
  }
  function pedir() {
    if (aberta) return aberta;
    aberta = new Promise(function (ok, nao) {
      async function montar() {
        var est = await chamar({ acao: "pag-estado" }), criar = est.r.ok && est.j && est.j.tem === false;
        if (!est.r.ok && est.j && est.j.erro) { aberta = null; nao(new Error(est.j.erro)); return; }
        var w = document.createElement("div"); w.id = "bb-pin";
        w.innerHTML = '<div class="cx" role="dialog" aria-modal="true">' + (criar
          ? "<h3>🔐 Criar PIN de pagamentos</h3><p>Para mudar pagamentos precisa de um PIN de pagamentos, <b>diferente do PIN de entrada</b>. Só o dono da conta o deve saber. Não tem recuperação: se o esquecer, só a BBabilônia o repõe.</p>" +
            '<input data-k="ent" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="PIN de entrada" style="font-size:18px;letter-spacing:4px;margin-bottom:8px">' +
            '<input data-k="n1" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="Novo PIN de pagamentos" style="font-size:18px;letter-spacing:4px;margin-bottom:8px">' +
            '<input data-k="n2" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="Repita o PIN de pagamentos" style="font-size:18px;letter-spacing:4px">'
          : "<h3>🔐 PIN de pagamentos</h3><p>Para guardar esta mudança, escreva o seu PIN de pagamentos (6 números). Não é o PIN de entrada.</p>" +
            '<input data-k="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="off" aria-label="PIN de pagamentos">') +
          '<div class="er"></div><div class="bs"><button type="button" class="no">Cancelar</button><button type="button" class="ok">Confirmar</button></div></div>';
        document.body.appendChild(w);
        var ins = w.querySelectorAll("input"), er = w.querySelector(".er"), bok = w.querySelector(".ok");
        function v(k) { return w.querySelector('[data-k="' + k + '"]').value; }
        ins.forEach(function (i) {
          i.addEventListener("input", function () { i.value = i.value.replace(/\D/g, "").slice(0, 6); });
          i.addEventListener("keydown", function (e) { if (e.key === "Enter") bok.click(); });
        });
        setTimeout(function () { ins[0].focus(); }, 50);
        function fim(r) { w.remove(); aberta = null; r ? ok() : nao(new Error("Cancelado: a mudança não foi guardada.")); }
        w.querySelector(".no").onclick = function () { fim(false); };
        bok.onclick = async function () {
          var corpo;
          if (criar) {
            if (!/^\d{6}$/.test(v("ent"))) { er.textContent = "Escreva o PIN de entrada (6 números)."; return; }
            if (!/^\d{6}$/.test(v("n1"))) { er.textContent = "O PIN de pagamentos tem 6 números."; return; }
            if (v("n1") !== v("n2")) { er.textContent = "Os dois PINs de pagamentos não são iguais."; return; }
            if (v("n1") === v("ent")) { er.textContent = "O PIN de pagamentos tem de ser diferente do PIN de entrada."; return; }
            corpo = { acao: "pag-criar", pin_entrada: v("ent"), novo: v("n1") };
          } else {
            if (!/^\d{6}$/.test(v("pin"))) { er.textContent = "O PIN tem 6 números."; return; }
            corpo = { acao: "reconfirmar", pin: v("pin") };
          }
          bok.disabled = true; er.textContent = "";
          try {
            var x = await chamar(corpo);
            if (x.ok) { ATE = Date.now() + 4.5 * 60000; fim(true); return; }
            er.textContent = (x.j && x.j.erro) || "PIN errado.";
            if (!criar) w.querySelector('[data-k="pin"]').value = "";
          } catch (e) { er.textContent = "Sem ligação. Tente outra vez."; }
          bok.disabled = false;
        };
      }
      function arrancar() { montar().catch(function (e) { aberta = null; nao(e); }); }
      if (document.body) arrancar(); else document.addEventListener("DOMContentLoaded", arrancar);
    });
    return aberta;
  }
  function erro(t) { return new Response(JSON.stringify({ message: t, code: "PIN" }), { status: 401, headers: { "Content-Type": "application/json" } }); }

  window.fetch = async function (url, op) {
    var u = typeof url === "string" ? url : (url && url.url) || "", m = (op && op.method) || (url && url.method) || "GET";
    if (!sensivel(u, m)) return f0(url, op);
    if (Date.now() > ATE) { try { await pedir(); } catch (e) { return erro(e.message); } }
    var r = await f0(url, op);
    if (r.status >= 400) {
      var t = await r.clone().text().catch(function () { return ""; });
      if (/PIN_PESSOAL/.test(t)) {                      /* o servidor diz que passou o tempo: pede outra vez e repete */
        ATE = 0; try { await pedir(); } catch (e) { return erro(e.message); }
        return f0(url, op);
      }
    }
    return r;
  };
  window.BBPinAcao = { pedir: pedir };
})();

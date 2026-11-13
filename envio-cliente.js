/* envio-cliente.js — B-Babilônia (13/11/2026)
   Página "Os meus pedidos" (pedidos.html), no detalhe do pedido pago:
   - depois de o agente recolher a mercadoria: "Mercadoria em processo de envio. Aguarde a cotação…";
   - quando o agente manda a cotação: valor do envio + taxa de serviço, número M-Pesa / e-Mola e nome do recetor;
   - o cliente transfere FORA da plataforma (só o envio) e toca em "Carregar provas de pagamento":
     foto do comprovativo e, por baixo, o texto da transferência;
   - depois mostra "A confirmar", "Pagamento confirmado" ou o motivo da recusa.
   Não altera o resto da página: só acrescenta esta caixa. */
(function () {
  if (window.__bbEnvioCli || !window.sb) return; window.__bbEnvioCli = 1;
  var sb = window.sb, d = document;
  function $(i) { return d.getElementById(i); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
  function quando(t) { try { return new Date(t).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }

  var css = d.createElement("style");
  css.textContent =
    "#bb-envio h3{margin:0 0 8px}#bb-envio .av{padding:12px;border-radius:12px;font-size:14.5px;line-height:1.5}" +
    "#bb-envio .av.a{background:#fffbeb;border:1px solid #fde68a;color:#92400e}#bb-envio .av.z{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a}" +
    "#bb-envio .av.v{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}#bb-envio .av.r{background:#fff1f2;border:1px solid #fecdd3;color:#9f1239}" +
    "#bb-envio .tt{display:flex;justify-content:space-between;font-size:14.5px;padding:4px 0}#bb-envio .tt.g{font-weight:800;font-size:16px;border-top:1px solid #e2e8f0;margin-top:4px;padding-top:8px}" +
    "#bb-envio .nr{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;margin-top:8px;font-size:15px}" +
    "#bb-envio .nr b{font-size:17px;letter-spacing:.5px}#bb-envio .nr button{border:0;border-radius:10px;padding:8px 10px;font:inherit;font-weight:800;font-size:13px;background:#e0f2fe;color:#0369a1}" +
    "#bb-envio .meios{display:flex;gap:8px;margin:10px 0 4px}#bb-envio .meios label{flex:1;text-align:center;padding:10px 4px;border:2px solid #e2e8f0;border-radius:12px;font-weight:800;font-size:14px}" +
    "#bb-envio .meios input{display:none}#bb-envio .meios label.on{border-color:#16a34a;background:#f0fdf4;color:#065f46}" +
    "#bb-envio .up{display:block;text-align:center;border:2px dashed #16a34a;border-radius:12px;padding:14px 6px;font-weight:800;font-size:15px;color:#065f46;background:#f0fdf4;margin-top:10px}" +
    "#bb-envio .up input{display:none}#bb-envio .fts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#bb-envio .fts img{width:78px;height:78px;object-fit:cover;border-radius:10px}" +
    "#bb-envio textarea{width:100%;box-sizing:border-box;min-height:86px;margin-top:8px;padding:10px;border:2px solid #e2e8f0;border-radius:12px;font:inherit;font-size:14.5px}" +
    "#bb-envio .bt{display:block;width:100%;border:0;border-radius:12px;padding:14px;margin-top:10px;font:inherit;font-size:16px;font-weight:800;color:#fff;background:linear-gradient(90deg,#16a34a,#0ea5e9)}" +
    "#bb-envio .bt:disabled{opacity:.5}#bb-envio .m{color:#e11d48;font-size:14px;margin-top:8px;white-space:pre-line}#bb-envio .pq{font-size:13px;color:#64748b;margin-top:6px}";
  d.head.appendChild(css);

  var aCarregar = null;
  function pedidoAberto() {
    try { var id = window.aberto; return (window.pedidos || []).filter(function (x) { return String(x.id) === String(id); })[0] || null; } catch (e) { return null; }
  }
  async function urls(lista) {
    var out = [];
    for (var i = 0; i < lista.length; i++) {
      try { var r = await sb.storage.from("provas-envio").createSignedUrl(lista[i], 3600); if (r.data && r.data.signedUrl) out.push(r.data.signedUrl); } catch (e) {}
    }
    return out;
  }

  async function desenhar() {
    var det = $("det"); if (!det || det.classList.contains("hide") || $("bb-envio")) return;
    var p = pedidoAberto(); if (!p) return;
    if (aCarregar === String(p.id)) return; aCarregar = String(p.id);
    var r; try { r = await sb.rpc("envio_cliente_ver", { p_order: String(p.id) }); } catch (e) { aCarregar = null; return; }
    aCarregar = null;
    if (!r || r.error || !r.data) return;
    var e = r.data, c = e.cotacao;
    if ($("bb-envio") || String(window.aberto) !== String(p.id)) return;
    if (e.entregue || (!c && !e.recolhido) || (c && c.estado === "enviado")) return;

    var h = '<h3>🚚 Envio da encomenda</h3>';
    if (!c) {
      h += '<div class="av a">📦 <b>Mercadoria no processo de envio.</b><br>Aguarde a cotação do valor de envio e taxa de serviço. Recebe um aviso assim que estiver pronta.</div>';
    } else {
      h += '<div class="tt"><span>Envio (' + esc(c.transportadora || "transportadora") + ')</span><span>' + din(c.valor_envio, c.moeda) + '</span></div>' +
        '<div class="tt"><span>Taxa de serviço</span><span>' + din(c.taxa_servico, c.moeda) + '</span></div>' +
        '<div class="tt g"><span>Total a transferir</span><span>' + din(c.total, c.moeda) + '</span></div>';
      if (c.estado === "aguarda_pagamento") {
        if (c.recusa_motivo) h += '<div class="av r" style="margin-top:8px">⚠️ <b>Pagamento não confirmado:</b> ' + esc(c.recusa_motivo) + '<br>Carregue as provas de novo.</div>';
        h += '<div class="pq" style="margin-top:10px">Transfira o total para um destes números (fora da plataforma) e depois carregue as provas:</div>' +
          (c.mpesa_numero ? '<div class="nr"><span>M-Pesa<br><b>' + esc(c.mpesa_numero) + '</b></span><button type="button" data-cp="' + esc(c.mpesa_numero) + '">Copiar</button></div>' : '') +
          (c.emola_numero ? '<div class="nr"><span>e-Mola<br><b>' + esc(c.emola_numero) + '</b></span><button type="button" data-cp="' + esc(c.emola_numero) + '">Copiar</button></div>' : '') +
          '<div class="nr"><span>Nome do recetor<br><b>' + esc(c.nome_recetor || "") + '</b></span></div>' +
          '<div class="pq" style="margin-top:14px;font-weight:800;color:#0f172a">Carregar provas de pagamento</div>' +
          '<div class="meios">' + (c.mpesa_numero ? '<label data-m="mpesa"><input type="radio" name="bbm" value="mpesa">Paguei por M-Pesa</label>' : '') +
          (c.emola_numero ? '<label data-m="emola"><input type="radio" name="bbm" value="emola">Paguei por e-Mola</label>' : '') + '</div>' +
          '<label class="up">📷 Foto do comprovativo da transferência<input type="file" accept="image/*" multiple id="bb-env-f"></label><div class="fts" id="bb-env-pv"></div>' +
          '<textarea id="bb-env-t" placeholder="Texto da transferência: cole aqui a mensagem (SMS) da transferência"></textarea>' +
          '<button class="bt" type="button" id="bb-env-ok">📤 Carregar provas de pagamento</button><div class="m" id="bb-env-m"></div>';
      } else if (c.estado === "pago_cliente") {
        h += '<div class="av z" style="margin-top:8px">⏳ <b>Provas enviadas</b> ' + esc(quando(c.cliente_pagou_em)) + '. A BBabilônia está a confirmar se a transferência entrou.</div>' +
          '<div class="fts" id="bb-env-vs"></div>' + (c.cliente_ref ? '<div class="pq">' + esc(c.cliente_ref) + '</div>' : '');
      } else if (c.estado === "pago_confirmado") {
        h += '<div class="av v" style="margin-top:8px">✅ <b>Pagamento do envio confirmado.</b> O agente vai entregar a mercadoria na transportadora. Recebe o número de rastreamento assim que for enviada.</div>';
      }
    }
    var box = d.createElement("div"); box.className = "box"; box.id = "bb-envio"; box.innerHTML = h;
    var primeiro = det.querySelector(".box");
    if (primeiro) primeiro.insertAdjacentElement("afterend", box); else det.insertBefore(box, det.firstChild);

    box.querySelectorAll("[data-cp]").forEach(function (b) {
      b.onclick = function () {
        var t = b.getAttribute("data-cp");
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = "Copiado ✓"; }).catch(function () { prompt("Copie o número:", t); });
      };
    });
    if (c && c.estado === "pago_cliente") {
      var vs = $("bb-env-vs"), us = await urls(c.cliente_fotos || []);
      if (vs) vs.innerHTML = us.map(function (u) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" alt="Comprovativo"></a>'; }).join("");
    }
    if (!c || c.estado !== "aguarda_pagamento") return;

    var FOT = [], meio = "";
    var labs = box.querySelectorAll(".meios label");
    if (labs.length === 1) { meio = labs[0].getAttribute("data-m"); labs[0].classList.add("on"); }
    labs.forEach(function (l) { l.onclick = function () { meio = l.getAttribute("data-m"); labs.forEach(function (x) { x.classList.toggle("on", x === l); }); }; });
    $("bb-env-f").onchange = function () {
      FOT = FOT.concat(Array.prototype.slice.call(this.files)).slice(0, 4); this.value = "";
      $("bb-env-pv").innerHTML = FOT.map(function (f) { return '<img src="' + URL.createObjectURL(f) + '" alt="">'; }).join("");
    };
    $("bb-env-ok").onclick = async function () {
      var b = this, m = $("bb-env-m"), t = $("bb-env-t").value.trim(); m.textContent = "";
      if (!meio) { m.textContent = "Escolha se pagou por M-Pesa ou por e-Mola."; return; }
      if (!FOT.length) { m.textContent = "Carregue a foto do comprovativo da transferência."; return; }
      if (t.length < 10) { m.textContent = "Cole ou escreva o texto da transferência (a mensagem que recebeu por SMS)."; return; }
      b.disabled = true; b.textContent = "A carregar fotos…";
      try {
        var s = (await sb.auth.getSession()).data.session; if (!s) throw new Error("Entre de novo na sua conta.");
        var caminhos = [];
        for (var i = 0; i < FOT.length; i++) {
          var f = FOT[i], ext = ((f.name || "").split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
          var cam = s.user.id + "/" + p.id + "/" + Date.now() + "-" + i + "." + ext;
          var up = await sb.storage.from("provas-envio").upload(cam, f, { contentType: f.type || undefined, upsert: false });
          if (up.error) throw new Error('Foto "' + (f.name || i + 1) + '": ' + up.error.message);
          caminhos.push(cam);
        }
        b.textContent = "A enviar…";
        var x = await sb.rpc("envio_cliente_pagou", { p_order: String(p.id), p_meio: meio, p_texto: t, p_fotos: caminhos });
        if (x.error) throw new Error(x.error.message);
        box.remove(); desenhar();
      } catch (er) { b.disabled = false; b.textContent = "📤 Carregar provas de pagamento"; m.textContent = er.message; }
    };
  }

  new MutationObserver(function () { if (!$("bb-envio")) desenhar(); }).observe($("det") || d.body, { childList: true, attributes: true, attributeFilter: ["class"] });
  desenhar();
})();

/* descricao-produto.js — B-Babilônia: mostra a descrição que o fornecedor escreveu ao registar o produto,
   na página do produto do cliente (produto-loja.html, aberta por produto-bbabilonia.html).
   Fica por baixo do nome e por cima do preço (como no Alibaba). Textos longos ficam encolhidos com "Ver mais". Não altera os outros ficheiros. */
(function () {
  if (window.__bbDescricao) return; window.__bbDescricao = 1;
  var d = document;
  var css = d.createElement("style");
  css.textContent =
    "#bb-desc{margin:4px 0 6px;font-family:system-ui,sans-serif;color:#222}" +
    "#bb-desc .tx{white-space:pre-wrap;word-break:break-word;font-size:14.5px;line-height:1.5;color:#333}" +
    "#bb-desc .tx.curto{max-height:4.5em;overflow:hidden;-webkit-mask-image:linear-gradient(#000 70%,transparent);mask-image:linear-gradient(#000 70%,transparent)}" +
    "#bb-desc button{margin-top:8px;border:0;background:#f3f4f6;color:#111;border-radius:999px;padding:7px 14px;font:600 13.5px system-ui,sans-serif;cursor:pointer}";
  d.head.appendChild(css);

  function texto(p) { return String((p && (p.description || p.descricao)) || "").trim(); }

  function mostrar() {
    var p = window.P; if (!p) return false;
    var t = texto(p), box = d.getElementById("bb-desc");
    if (!t) { if (box) box.remove(); return true; }
    if (!box) {
      box = d.createElement("div"); box.id = "bb-desc";
      box.innerHTML = '<div class="tx"></div>';
      var pr = d.getElementById("preco");
      if (pr && pr.parentNode) pr.parentNode.insertBefore(box, pr);
      else { var det = d.getElementById("detalhes"); if (det && det.parentNode) det.parentNode.insertBefore(box, det.nextSibling); else d.body.appendChild(box); }
    }
    var tx = box.querySelector(".tx");
    if (tx.textContent !== t) {
      tx.textContent = t;
      var bt = box.querySelector("button"); if (bt) bt.remove();
      if (t.length > 160 || t.split("\n").length > 3) {
        tx.classList.add("curto");
        bt = d.createElement("button"); bt.type = "button"; bt.textContent = "Ver mais";
        bt.onclick = function () { var c = tx.classList.toggle("curto"); bt.textContent = c ? "Ver mais" : "Ver menos"; };
        box.appendChild(bt);
      }
    }
    return true;
  }

  var n = 0;
  (function esperar() { if (mostrar()) return; if (++n < 100) setTimeout(esperar, 300); })();
})();

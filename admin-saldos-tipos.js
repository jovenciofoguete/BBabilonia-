/* admin-saldos-tipos.js — BBabilônia (19/11/2026): na vista do dono (admin-saldos.html) os levantamentos
   de fornecedores de Moçambique pagos por M-Pesa ou cripto (USDT) mostram os nomes certos
   (Número M-Pesa / Carteira) em vez de "Nº conta", sem o selo "Aceita USD" e sem a palavra SWIFT ao marcar como pago.
   Não altera fornecedor-saldo.js. */
(function () {
  var pr = window.prompt;
  window.prompt = function (m, d) {
    if (/SWIFT/.test(String(m))) m = "Referência do pagamento (número da transação M-Pesa, hash da transferência ou referência SWIFT; o fornecedor vai ver):";
    return pr.call(window, m, d);
  };
  function valor(dl, nome) {
    var b = dl.querySelectorAll("b");
    for (var i = 0; i < b.length; i++) if (b[i].textContent === nome) return b[i].nextElementSibling ? b[i].nextElementSibling.textContent : "";
    return null;
  }
  function nome(dl, de, para) {
    var b = dl.querySelectorAll("b");
    for (var i = 0; i < b.length; i++) if (b[i].textContent === de) b[i].textContent = para;
  }
  function ajustar() {
    var L = document.getElementById("admLista"); if (!L) return;
    L.querySelectorAll(".cx").forEach(function (c) {
      if (c.getAttribute("data-bbt")) return;
      var dl = c.querySelector(".dl"); if (!dl) return;
      var banco = valor(dl, "Banco") || "", mp = /^M-Pesa/i.test(banco), cr = /^Cripto/i.test(banco);
      c.setAttribute("data-bbt", "1");
      if (!mp && !cr) return;
      nome(dl, "Nº conta", mp ? "Número M-Pesa" : "Carteira (endereço)");
      nome(dl, "Banco", mp ? "Receber em" : "Rede");
      var ds = c.querySelectorAll("h2 .bdg");
      ds.forEach(function (x) { if (/USD/.test(x.textContent)) { x.textContent = mp ? "M-Pesa" : "Cripto"; x.className = "bdg b-az"; } });
      if (cr) { var m = dl.querySelectorAll("b"); for (var i = 0; i < m.length; i++) if (m[i].textContent === "Rede" && m[i].nextElementSibling) m[i].nextElementSibling.textContent = banco.replace(/^Cripto\s*/i, "USDT "); }
    });
  }
  var t = null, L0 = document.getElementById("admLista");
  if (L0) new MutationObserver(function () { clearTimeout(t); t = setTimeout(ajustar, 20); }).observe(L0, { childList: true });
  ajustar();
})();

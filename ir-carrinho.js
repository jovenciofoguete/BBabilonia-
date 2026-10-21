
// BBabilônia: depois de "Adicionar ao carrinho", leva o cliente ao carrinho.
(function () {
  var ultimoClique = 0;
  document.addEventListener("click", function () { ultimoClique = Date.now(); }, true);

  var original = Storage.prototype.setItem;
  Storage.prototype.setItem = function (chave, valor) {
    var antes = this.getItem(chave);
    original.apply(this, arguments);
    if (chave === "carrinho" && valor !== antes && Date.now() - ultimoClique < 3000) {
      setTimeout(function () { location.href = "carrinho.html"; }, 600);
    }
  };
})();


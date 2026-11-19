/* checkout-levantamento.js — BBabilônia (19/11/2026)
   DESLIGADO: já não existe pagamento por levantamento. Todo o pagamento ao fornecedor é automático:
   M-Pesa com PIN no telemóvel (só fornecedores de Moçambique, ver checkout-mpesa.js), cartão Visa/Mastercard ou cripto (USDT).
   Este ficheiro fica vazio de propósito (o pais-cliente.js ainda o carrega). */
(function () {
  window.__bbLev = 1;
  window.BBLevantamento = { ativo: function () { return false; }, estado: function () { return { cartMZ: false, clienteMZ: false }; } };
})();

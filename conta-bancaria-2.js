/* BBabilônia — conta-bancaria-2.js (parte 2 de 4 da página conta-bancaria.html) */
/* ---------- IBAN: comprimento por país (registo oficial) ---------- */
var IBAN_LEN = { AD:24,AE:23,AL:28,AT:20,AZ:28,BA:20,BE:16,BG:22,BH:22,BI:27,BR:29,BY:28,CH:21,CR:22,CY:28,CZ:24,DE:22,DJ:27,DK:18,DO:28,EE:20,EG:29,ES:24,FI:18,FK:18,FO:18,FR:27,GB:22,GE:22,GI:23,GL:18,GR:27,GT:28,HN:28,HR:21,HU:28,IE:22,IL:23,IQ:23,IS:26,IT:27,JO:30,KW:30,KZ:20,LB:28,LC:32,LI:21,LT:20,LU:20,LV:21,LY:25,MC:27,MD:24,ME:22,MK:19,MN:20,MR:27,MT:31,MU:30,NI:28,NL:18,NO:15,OM:23,PK:24,PL:28,PS:29,PT:25,QA:29,RO:24,RS:22,RU:33,SA:24,SC:31,SD:18,SE:24,SI:19,SK:24,SM:27,SO:23,ST:25,SV:28,TL:23,TN:24,TR:26,UA:29,VA:22,VG:24,XK:20,YE:30,
  /* territórios franceses usam IBAN FR */ GP:27,MQ:27,GF:27,RE:27,YT:27,PF:27,NC:27 };
/* países onde o IBAN é obrigatório (Europa SEPA + Médio Oriente onde é exigido) */
var IBAN_OBRIG = "AD AT BE BG CH CY CZ DE DK EE ES FI FR GB GI GR HR HU IE IS IT LI LT LU LV MC MT NL NO PL PT RO SE SI SK SM VA AE SA QA KW BH JO IL PS TR EG TN MR GP MQ GF RE YT".split(" ");
/* países com IBAN local (não oficial) — aceite se o banco der */
var IBAN_LOCAL = { AO:25,BJ:28,BF:28,CM:27,CV:25,CF:27,TD:27,KM:27,CG:27,CI:28,GA:27,GQ:27,GW:25,MG:27,ML:28,MZ:25,NE:28,SN:28,TG:28,DZ:26,MA:28,IR:26 };

/* campos próprios de cada país (códigos locais) */
var CAMPOS = {
  US: { conta: "Número de conta (Account number)", x: [["aba", "Routing number (ABA) — 9 dígitos", /^\d{9}$/, 1], ["tipo_conta", "Tipo de conta", ["Checking (corrente)", "Savings (poupança)"], 1]] },
  PR: { conta: "Número de conta", x: [["aba", "Routing number (ABA) — 9 dígitos", /^\d{9}$/, 1]] },
  CA: { conta: "Número de conta", x: [["transit", "Transit number (agência) — 5 dígitos", /^\d{5}$/, 1], ["instituicao", "Institution number — 3 dígitos", /^\d{3}$/, 1]] },
  GB: { conta: "Account number (8 dígitos)", x: [["sort_code", "Sort code — 6 dígitos", /^\d{6}$/, 1]] },
  AU: { conta: "Account number", x: [["bsb", "BSB — 6 dígitos", /^\d{6}$/, 1]] },
  NZ: { conta: "Número de conta (15–16 dígitos, com banco e agência)", x: [] },
  IN: { conta: "Account number", x: [["ifsc", "IFSC — 11 caracteres (ex.: SBIN0001234)", /^[A-Z]{4}0[A-Z0-9]{6}$/, 1]] },
  CN: { conta: "Número de conta (银行账号)", x: [["cnaps", "Código CNAPS — 12 dígitos (opcional)", /^\d{12}$/, 0], ["nome_local", "Nome do titular em chinês (como no banco)", null, 0], ["banco_local", "Nome da agência em chinês (opcional)", null, 0]] },
  HK: { conta: "Número de conta", x: [["codigo_banco", "Código do banco — 3 dígitos", /^\d{3}$/, 1], ["agencia", "Código da agência — 3 dígitos", /^\d{3}$/, 0]] },
  JP: { conta: "Número de conta (7 dígitos)", x: [["codigo_banco", "Código do banco — 4 dígitos", /^\d{4}$/, 1], ["agencia", "Código da agência — 3 dígitos", /^\d{3}$/, 1], ["tipo_conta", "Tipo de conta", ["Futsu (ordinária)", "Toza (corrente)"], 1], ["nome_local", "Nome do titular em katakana (opcional)", null, 0]] },
  KR: { conta: "Número de conta", x: [["codigo_banco", "Código do banco — 3 dígitos (opcional)", /^\d{3}$/, 0]] },
  SG: { conta: "Número de conta", x: [["codigo_banco", "Código do banco — 4 dígitos", /^\d{4}$/, 0], ["agencia", "Código da agência — 3 dígitos", /^\d{3}$/, 0]] },
  MX: { conta: "Número de conta (opcional se tiver CLABE)", sem: 1, x: [["clabe", "CLABE — 18 dígitos", /^\d{18}$/, 1]] },
  BR: { conta: "Número da conta (com dígito)", x: [["agencia", "Agência (4 dígitos)", /^\d{4}(-?\d)?$/, 1], ["documento", "CPF ou CNPJ do titular", /^(\d{11}|\d{14})$/, 1], ["tipo_conta", "Tipo de conta", ["Corrente", "Poupança"], 1]] },
  ZA: { conta: "Número de conta", x: [["branch", "Branch code — 6 dígitos", /^\d{6}$/, 1], ["tipo_conta", "Tipo de conta", ["Current / Cheque", "Savings"], 1]] },
  MZ: { conta: "Número de conta", x: [["nib", "NIB — 21 dígitos", /^\d{21}$/, 1]] },
  AO: { conta: "Número de conta", x: [] },
  NG: { conta: "Número de conta NUBAN (10 dígitos)", x: [["codigo_banco", "Sort code do banco (opcional)", null, 0]] },
  KE: { conta: "Número de conta", x: [["agencia", "Código da agência / banco (opcional)", null, 0]] },
  GH: { conta: "Número de conta", x: [["agencia", "Sort code da agência (opcional)", null, 0]] },
  AR: { conta: "Número de conta", x: [["cbu", "CBU — 22 dígitos", /^\d{22}$/, 1], ["documento", "CUIT/CUIL do titular", /^\d{11}$/, 1]] },
  CL: { conta: "Número de conta", x: [["documento", "RUT do titular", null, 1], ["tipo_conta", "Tipo de conta", ["Corriente", "Vista", "Ahorro"], 1]] },
  CO: { conta: "Número de conta", x: [["documento", "NIT / Cédula do titular", null, 1], ["tipo_conta", "Tipo de conta", ["Corriente", "Ahorros"], 1]] },
  PE: { conta: "Número de conta", x: [["cci", "CCI — 20 dígitos", /^\d{20}$/, 1]] },
  RU: { conta: "Número de conta (20 dígitos)", x: [["bik", "BIK — 9 dígitos", /^\d{9}$/, 1], ["inn", "INN do titular", /^(\d{10}|\d{12})$/, 1]] },
  UA: { conta: "Número de conta", x: [["documento", "EDRPOU / RNOKPP do titular", null, 0]] }
};
var GERAL = { conta: "Número de conta", x: [["codigo_banco", "Código do banco / agência (se o banco tiver)", null, 0]] };

function k(x) { return String(x || "").toLowerCase(); }
function limpa(x) { return String(x || "").toUpperCase().replace(/[\s\-.]/g, ""); }
function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function ibanOk(i) {
  i = limpa(i); if (!/^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(i)) return false;
  var r = 0, s = i.slice(4) + i.slice(0, 4);
  for (var n = 0; n < s.length; n++) { var c = s.charCodeAt(n), v = c >= 65 ? String(c - 55) : s[n]; for (var j = 0; j < v.length; j++) r = (r * 10 + (+v[j])) % 97; }
  return r === 1;
}
function ibanTipo(p) { return IBAN_OBRIG.indexOf(p) >= 0 ? "obrig" : (IBAN_LEN[p] ? "opc" : (IBAN_LOCAL[p] ? "local" : "nao")); }
function swiftOk(s) { return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(limpa(s)); }
function swiftPais(s) { return limpa(s).slice(4, 6); }
window.__bbTeste = { ibanOk: ibanOk, swiftOk: swiftOk, ibanTipo: ibanTipo, IBAN_LEN: IBAN_LEN, IBAN_LOCAL: IBAN_LOCAL };
                                       

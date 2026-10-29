/* BBabilônia — conta-bancaria-1.js (parte 1 de 4 da página conta-bancaria.html) */
var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
var CHAVE = "sb-dsfoqoeawvjafypycldz-auth-token", ADMIN = "jovenciofoguete1904@gmail.com";
var $ = function (i) { return document.getElementById(i); };
var S = null, loja = null, conta = null, temComp = false, escolha = { pt: "", pb: "", moeda: "" }, adm = { lista: [], aba: "verificacao" };

/* ---------- países e moedas (todo o mundo) ---------- */
var CODES = "AF AL DZ AD AO AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BR BN BG BF BI CV KH CM CA KY CF TD CL CN CO KM CG CD CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MA MZ MM NA NR NP NL NC NZ NI NE NG MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RE RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TC TV UG UA AE GB US UY UZ VU VA VE VN VG VI YE ZM ZW".split(" ");
var nomeP = (function () { try { var d = new Intl.DisplayNames(["pt"], { type: "region" }); return function (c) { try { return d.of(c) || c; } catch (e) { return c; } }; } catch (e) { return function (c) { return c; }; } })();
var PAISES = CODES.map(function (c) { return { c: c, n: nomeP(c) }; }).sort(function (a, b) { return a.n.localeCompare(b.n, "pt"); });
var MOEDAS = (function () {
  var l = []; try { l = Intl.supportedValuesOf("currency"); } catch (e) {}
  if (!l.length) l = "USD EUR GBP CNY JPY ZAR MZN AOA BRL INR AED TRY NGN KES TZS ZMW MWK BWP NAD SZL LSL XOF XAF EGP MAD CAD AUD CHF HKD SGD".split(" ");
  var d = null; try { d = new Intl.DisplayNames(["pt"], { type: "currency" }); } catch (e) {}
  return l.map(function (c) { var n = c; try { n = d ? d.of(c) : c; } catch (e) {} return { c: c, n: c + " — " + n }; });
})();
var MOEDA_PAIS = { US:"USD",PR:"USD",EC:"USD",SV:"USD",PA:"USD",TL:"USD",GU:"USD",VI:"USD",VG:"USD",TC:"USD",FM:"USD",MH:"USD",PW:"USD",ZW:"USD",
  DE:"EUR",AT:"EUR",BE:"EUR",CY:"EUR",EE:"EUR",ES:"EUR",FI:"EUR",FR:"EUR",GR:"EUR",HR:"EUR",IE:"EUR",IT:"EUR",LT:"EUR",LU:"EUR",LV:"EUR",MT:"EUR",NL:"EUR",PT:"EUR",SI:"EUR",SK:"EUR",AD:"EUR",MC:"EUR",SM:"EUR",VA:"EUR",ME:"EUR",XK:"EUR",GP:"EUR",MQ:"EUR",GF:"EUR",RE:"EUR",YT:"EUR",
  BJ:"XOF",BF:"XOF",CI:"XOF",GW:"XOF",ML:"XOF",NE:"XOF",SN:"XOF",TG:"XOF",CM:"XAF",CF:"XAF",TD:"XAF",CG:"XAF",GQ:"XAF",GA:"XAF",
  GB:"GBP",GG:"GBP",JE:"GBP",IM:"GBP",CN:"CNY",HK:"HKD",MO:"MOP",TW:"TWD",JP:"JPY",KR:"KRW",IN:"INR",PK:"PKR",BD:"BDT",LK:"LKR",NP:"NPR",ID:"IDR",MY:"MYR",SG:"SGD",TH:"THB",VN:"VND",PH:"PHP",KH:"KHR",LA:"LAK",MM:"MMK",
  AE:"AED",SA:"SAR",QA:"QAR",KW:"KWD",BH:"BHD",OM:"OMR",JO:"JOD",IL:"ILS",PS:"ILS",LB:"LBP",IQ:"IQD",IR:"IRR",TR:"TRY",AF:"AFN",YE:"YER",SY:"SYP",
  MZ:"MZN",ZA:"ZAR",AO:"AOA",NA:"NAD",BW:"BWP",ZM:"ZMW",MW:"MWK",TZ:"TZS",KE:"KES",UG:"UGX",RW:"RWF",BI:"BIF",CD:"CDF",ET:"ETB",SO:"SOS",DJ:"DJF",ER:"ERN",SD:"SDG",SS:"SSP",EG:"EGP",LY:"LYD",TN:"TND",DZ:"DZD",MA:"MAD",MR:"MRU",
  NG:"NGN",GH:"GHS",SL:"SLE",LR:"LRD",GM:"GMD",GN:"GNF",CV:"CVE",ST:"STN",MG:"MGA",MU:"MUR",SC:"SCR",KM:"KMF",LS:"LSL",SZ:"SZL",
  BR:"BRL",AR:"ARS",CL:"CLP",CO:"COP",PE:"PEN",UY:"UYU",PY:"PYG",BO:"BOB",VE:"VES",MX:"MXN",GT:"GTQ",HN:"HNL",NI:"NIO",CR:"CRC",DO:"DOP",HT:"HTG",JM:"JMD",TT:"TTD",BS:"BSD",BB:"BBD",BZ:"BZD",GY:"GYD",SR:"SRD",CU:"CUP",
  CA:"CAD",AU:"AUD",NZ:"NZD",CH:"CHF",LI:"CHF",NO:"NOK",SE:"SEK",DK:"DKK",FO:"DKK",GL:"DKK",IS:"ISK",PL:"PLN",CZ:"CZK",HU:"HUF",RO:"RON",BG:"BGN",RS:"RSD",BA:"BAM",MK:"MKD",AL:"ALL",MD:"MDL",UA:"UAH",BY:"BYN",RU:"RUB",GE:"GEL",AM:"AMD",AZ:"AZN",KZ:"KZT",KG:"KGS",UZ:"UZS",TJ:"TJS",TM:"TMT",MN:"MNT" };
    

/* Detalhes por tipo de produto. Nome* = obrigatório. "Nome|a,b,c" = lista de sugestões. */
var MEDIDAS=["Altura","Ombros","Peito","Cintura","Barriga","Ombro-pés","Ombro-cintura","Cintura-pés","Comprimento das mangas","Largura das mangas","Boca das mangas"];
var TENS="110V,220V,380V,415V,440V";
var PERFIS=[
{id:"casamento",re:/noiv|casament|terno|fato/,medidas:1,
 opc:["Modo|Tamanho padrão,Medidas personalizadas"],spec:["Material*","Estilo*","Comprimento","Cor do forro"]},
{id:"calcado",re:/calcad|sapat|tenis|sandal|chinel|bota/,opc:[],spec:["Material*","Solado*","Género*|Homem,Mulher,Criança,Unissexo","Estilo"]},
{id:"cabelo",re:/cabelo|peruca|extens|tranca|lace/,
 opc:["Comprimento (polegadas)|8,10,12,14,16,18,20,22,24,26,28,30,32","Densidade|130%,150%,180%,200%,250%","Formato|Liso,Ondulado,Cacheado,Crespo"],
 spec:["Tipo*|Humano,Sintético","Origem*","Tipo de renda"]},
{id:"anel",re:/alianc|\banel|\baneis/,opc:["Material|Prata 925,Banhado a ouro,Ouro 18k,Aço inoxidável","Tamanho do anel|5,6,7,8,9,10,11,12,13"],spec:["Material*","Pedra","Peso (g)","Garantia"]},
{id:"joia",re:/joia|brinco|colar|pulseira|corrente/,opc:["Material|Prata 925,Banhado a ouro,Ouro 18k,Aço inoxidável"],spec:["Material*","Pedra","Peso (g)","Comprimento (cm)"]},
{id:"pneu",re:/pneu/,opc:[],spec:["Marca*","Largura (mm)*|135,155,165,175,185,195,205,215,225,235,245,255,265,275,285,295,305,315","Perfil*|30,35,40,45,50,55,60,65,70,75,80","Aro*|R13,R14,R15,R16,R17,R18,R19,R20,R21,R22","Tipo*|Verão,Inverno,Todas as estações","Índice de carga","Índice de velocidade","Ano de fabrico"]},
{id:"peca",re:/peca|trava|suspens|amortec|bateria de carro|filtro|embraia|radiador|farol/,opc:[],spec:["Marca compatível*","Modelo compatível*","Ano compatível*","Nº da peça (OEM)","Condição*|Nova,Usada,Recondicionada","Garantia"]},
{id:"camiao",re:/camio|truck|basculante|trator|cisterna|reboque|autocarro|pickup/,opc:[],spec:["Marca*","Capacidade (toneladas)*","Eixos*","Combustível*|Diesel,Gasolina,Elétrico,Gás","Potência (cv)*","Ano*","Condição*|Novo,Usado","Transmissão|Manual,Automática","Quilometragem"]},
{id:"carro",re:/carro|automov|veiculo|\bmota|\bmoto\b/,opc:[],spec:["Marca*","Modelo*","Ano*","Combustível*|Gasolina,Diesel,Elétrico,Híbrido","Transmissão*|Manual,Automática","Quilometragem","Cilindrada","Condição*|Novo,Usado"]},
{id:"telemovel",re:/telem|telefon|celular|smartphone|iphone|tablet/,
 opc:["RAM|2GB,3GB,4GB,6GB,8GB,12GB,16GB","Memória|32GB,64GB,128GB,256GB,512GB,1TB","Rede|4G,5G","Versão|Global,China,Outra"],
 spec:["Marca*","Sistema*|Android,iOS","Ecrã (polegadas)","Bateria (mAh)","Câmara (MP)","Garantia"]},
{id:"computador",re:/computad|portatil|laptop|notebook|desktop|\bpc\b/,
 opc:["RAM|4GB,8GB,16GB,32GB,64GB","SSD|128GB,256GB,512GB,1TB,2TB","Processador|Intel Core i3,Intel Core i5,Intel Core i7,Intel Core i9,AMD Ryzen 5,AMD Ryzen 7","Geração|8.ª,10.ª,11.ª,12.ª,13.ª,14.ª"],
 spec:["Marca*","Ecrã (polegadas)","Placa gráfica","Sistema operativo","Garantia"]},
{id:"solar",re:/solar|inversor|fotovolt/,opc:["Potência (W)|100,200,300,400,450,550,600,700"],spec:["Tipo*|Monocristalino,Policristalino","Voltagem*","Eficiência (%)","Garantia (anos)*","Dimensões (mm)","Peso (kg)"]},
{id:"industria",re:/industr|maquina|motor|dynamo|dinamo|moagem|moinho|gerador|bomba|compressor|solda|serra|prensa|torno|caldeira/,
 opc:["Voltagem|"+TENS,"Fase|Monofásico,Trifásico","Tipo de ficha|Tipo A,Tipo C,Tipo D,Tipo G,Sem ficha"],
 spec:["Potência (kW)*","Capacidade*","Material*","Peso (kg)*","Dimensões (mm)*","Garantia*","Marca"]},
{id:"eletronico",re:/eletr|televis|audio|camara|auscult|coluna|carregador/,opc:["Voltagem|110V,220V,110-240V","Tipo de ficha|Tipo A,Tipo C,Tipo D,Tipo G"],spec:["Marca*","Modelo","Garantia*","Potência (W)"]},
{id:"cinto",re:/cinto/,opc:[],spec:["Material*","Largura (cm)","Género*|Homem,Mulher,Criança,Unissexo"]},
{id:"roupa",re:/roupa|vestid|blusa|t-shirt|shirt|saia|calcas|calcoes|conjunto|casaco|jacket|camis|homens|mulher|crianca|acess/,opc:[],spec:["Material*","Género*|Homem,Mulher,Criança,Unissexo","Estilo","Estação|Verão,Inverno,Meia-estação,Todas","Origem"]},
{id:"geral",re:/./,opc:[],spec:["Marca","Material*","Origem","Peso (kg)","Dimensões (cm)","Garantia"]}
];
function semAcento(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function lerSpec(t){var p=t.split("|"),n=p[0],o=/\*$/.test(n);return{nome:n.replace(/\*$/,""),obrig:o,sug:p[1]?p[1].split(","):[]}}
function lerOpc(t){var p=t.split("|");return{nome:p[0],sug:p[1]?p[1].split(","):[]}}
function perfilDe(caminho){
  var c=semAcento(caminho);
  for(var i=0;i<PERFIS.length;i++){
    if(PERFIS[i].re.test(c)){
      var P=PERFIS[i];
      return{id:P.id,medidas:!!P.medidas,spec:P.spec.map(lerSpec),opc:P.opc.map(lerOpc)};
    }
  }
}
function caminhoDe(cats,id){
  var m={};cats.forEach(function(c){m[c.id]=c});
  var out=[],n=0,c=m[id];
  while(c&&n++<6){out.unshift(c.name||c.nome||c.title||"");c=m[c.parent_id||c.parent]}
  return out.join(" > ");
  }
/* Estado em todas as categorias */
var perfilDeBase=perfilDe;
perfilDe=function(caminho){
  var p=perfilDeBase(caminho);
  p.spec=p.spec.filter(function(s){return s.nome!=="Condição"});
  p.spec.unshift({nome:"Condição",obrig:true,sug:["Novo","Usado","Usado e recondicionado"]});
  return p;
};

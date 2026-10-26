/* categorias-detalhes.js v2 - BBabilonia */
var MEDIDAS=["Altura","Ombros","Peito","Cintura","Barriga","Ombro-pés","Ombro-cintura","Cintura-pés","Comprimento das mangas","Largura das mangas","Boca das mangas"];
function bbR(a,b,p,f){var o=[];for(var i=a;i<=b;i+=p)o.push(f?f(i):String(i));return o}
var BB_ID=["0-3 meses","3-6 meses","6-9 meses","9-12 meses","12-18 meses","18-24 meses","2 anos","3 anos","4 anos","5 anos","6 anos","7 anos","8 anos","9 anos","10 anos","11 anos","12 anos","13 anos","14 anos"];
var BB_TAMANHOS={
letras:{nome:"Letras (XS–5XL)",l:["XS","S","M","L","XL","2XL","3XL","4XL","5XL"]},
numeros:{nome:"Números (26–60)",l:bbR(26,44,1).concat(bbR(46,60,2))},
idade:{nome:"Criança (altura e idade)",l:BB_ID.map(function(t,i){return(i<6?56+i*6:92+(i-6)*6)+" cm ("+t+")"})},
calcado:{nome:"Números de calçado (16–48)",l:bbR(16,48,1)},
cabelo:{nome:"Comprimento (polegadas)",l:bbR(8,32,2)},
anel:{nome:"Tamanho do anel",l:bbR(4,14,1)},
cinto:{nome:"Tamanho do cinto (cm)",l:bbR(65,130,5).concat(["140"])},
unico:{nome:"Sem tamanho",l:[""]}
};
var G="Garantia",MA="Marca*",MR="Marca",TP="Tipo*",V3="Voltagem*|110V,220V,380V",MO="Montagem|Montado,Desmontado";
var R_VOLT="110V,220V,110-240V,380V,415V";
var R_FICHA="Tipo A,Tipo C,Tipo D,Tipo G,Sem ficha";
var R_MAT_ROUPA="Algodão,Poliéster,Seda,Linho,Lã,Jeans,Couro,Malha,Nylon,Veludo,Renda,Cetim,Misto,Outro";
var R_ROUPA=/^(roupa|homens|mulheres|criancas|conjuntos|calcas|camisas|casacos e jaquetas|saias|vestidos|fatos|roupa interior e pijamas|moda e acessorios|bebe|praia|produtos para criancas e bebes > roupas)/;
var R_SERV=["Tipo de serviço*","Preço por*|Hora,Dia,Projeto,Mês,Evento","Localização*","Disponibilidade"];
var R_MAQ=["Marca","Potência (kW)*","Voltagem*|"+R_VOLT,"Fase|Monofásico,Trifásico","Tipo de ficha|"+R_FICHA,"Capacidade*","Peso (kg)","Dimensões (mm)",G];
var R_PECA=["Marca compatível*","Modelo compatível*","Ano compatível*","Nº da peça (OEM)",G];
var L=["letras","numeros"],CAL=["calcado"];
var BB_REG=[
{id:"emprego",re:/^emprego e servicos > empregos/,x:1,s:["Cargo*","Tipo de contrato*|Tempo inteiro,Part-time,Temporário,Estágio","Salário","Localização*"]},
{id:"servico",re:/^(emprego e servicos|servicos para empresas|casamentos e eventos$|casamentos e eventos > (catering|decoracao|fotografia|som))/,x:1,s:R_SERV},
{id:"turismo",re:/^turismo e alojamento/,x:1,s:["Tipo*|Hotel,Quarto,Apartamento,Casa,Excursão","Capacidade (pessoas)*","Preço por*|Noite,Pessoa,Dia","Localização*"]},
{id:"terreno",re:/^imoveis > (terrenos|quintas)/,x:1,s:["Tipo de negócio*|Venda,Aluguer","Área (m²)*","Localização*","Documentação*|DUAT,Título,Outra"]},
{id:"imovel",re:/^imoveis/,x:1,s:["Tipo de negócio*|Venda,Aluguer","Estado*|Novo,Usado,Em construção","Área (m²)*","Quartos*|0,1,2,3,4,5,6+","Casas de banho|1,2,3,4+","Localização*","Documentação|DUAT,Título,Outra"]},
{id:"camera_foto",re:/cameras? (profissiona|mirrorless|compacta|de acao|dslr)|filmadora/,m:0,s:["Marca*|Canon,Nikon,Sony,Fujifilm,Panasonic,Olympus,Leica,GoPro,DJI,Blackmagic,Outra","Modelo*","Tipo*|DSLR,Mirrorless,Compacta,Filmadora,Câmera de ação,Câmera de cinema","Resolução (MP)*","Vídeo*|Full HD,4K,6K,8K","Sensor|Full frame,APS-C,Micro 4/3,1 polegada,Médio formato","Encaixe da lente|Canon EF,Canon RF,Nikon F,Nikon Z,Sony E,Fujifilm X,Micro 4/3,L-Mount,Lente fixa","Lente incluída*|Sim (kit),Não (só corpo)","Disparos (contador)",G]},
{id:"lente",re:/lentes|objetivas/,m:0,s:["Marca*|Canon,Nikon,Sony,Fujifilm,Sigma,Tamron,Samyang,Viltrox,Outra","Encaixe*|Canon EF,Canon RF,Nikon F,Nikon Z,Sony E,Fujifilm X,Micro 4/3,L-Mount","Distância focal (mm)*","Abertura máxima|f/1.2,f/1.4,f/1.8,f/2,f/2.8,f/4,f/5.6","Estabilização|Sim,Não",G]},
{id:"drone",re:/drones/,m:0,s:["Marca*|DJI,Autel,Potensic,Outra","Modelo*","Vídeo*|2.7K,4K,5.4K,6K,8K","Autonomia (min)","Alcance (km)","Peso (g)",G]},
{id:"foto_acess",re:/tripes|estabilizadores|flashes|iluminacao de estudio|cartoes de memoria|(baterias|carregadores|bolsas|mochilas|microfones).*camera|cameras e fotografia/,s:[TP,MR,"Compatível com"]},
{id:"calcado",re:/calcad|sapat|sandal|chinel|botas|tenis|sapatilh|salto/,tam:CAL,matSug:"Couro,Pele sintética,Tecido,Borracha,Lona,Camurça,Outro",s:[]},
{id:"noiva_acess",re:/acessorios de noiv|coroas|luvas|tiaras|veus|brincos de noiva|colares de noiva|bolsas de noiva/,s:[]},
{id:"fato",re:/fatos (de noivo|masculinos|femininos|para eventos|e blazers)|^fatos$|blazer/,tam:L,medidas:1,matSug:"Lã,Poliéster,Algodão,Linho,Misto,Outro",s:[]},
{id:"noiva",re:/noiv|madrinha|daminha|pajem/,tam:L,medidas:1,matSug:"Renda,Cetim,Tule,Organza,Seda,Crepe,Outro",s:[]},
{id:"casamento",re:/^roupa de casamento$/,tam:L,medidas:1,s:[]},
{id:"bolsa",re:/bolsas|malas|bagagem/,matSug:"Couro,Pele sintética,Tecido,Nylon,Lona,Outro",s:[]},
{g:R_ROUPA,id:"bebe",re:/roupa de bebe|roupas de bebe|^bebe$/,tam:["idade"],s:[]},
{g:R_ROUPA,id:"banho",re:/banho|biquini|^praia/,tam:L,s:[]},
{g:R_ROUPA,id:"interior",re:/interior|lingerie|meias|pijama/,tam:L,s:[]},
{g:R_ROUPA,id:"uniforme",re:/uniforme/,tam:["idade","letras","numeros"],s:[]},
{g:R_ROUPA,id:"calca",re:/calca|jeans|calcoes|shorts|leggings|saia/,tam:["numeros","letras"],s:[]},
{g:R_ROUPA,id:"capulana",re:/capulana|lenco/,s:[]},
{id:"anel",re:/\banel|\baneis|alianc/,tam:["anel"],m:0,s:["Material*|Prata 925,Banhado a ouro,Ouro 18k,Ouro 14k,Aço inoxidável,Bijuteria"]},
{id:"joia",re:/joias/,m:0,tam:["unico","anel"],s:["Material*|Prata 925,Banhado a ouro,Ouro 18k,Ouro 14k,Aço inoxidável,Bijuteria"]},
{id:"cinto",re:/cinto/,tam:["cinto"],matSug:"Couro,Pele sintética,Tecido,Metal,Outro",s:[]},
{g:R_ROUPA,id:"relogio",re:/relogio|oculos/,matSug:"Aço inoxidável,Plástico,Couro,Metal,Outro",s:[MR]},
{g:R_ROUPA,id:"roupa_acess",re:/acessorios/,tam:["unico","cinto","letras"],matSug:"Couro,Algodão,Poliéster,Metal,Outro",s:[]},
{g:R_ROUPA,id:"roupa",re:/./,tam:L,s:[]},
{id:"peruca",re:/peruca|extens|tranca|lace|cabelo humano/,tam:["cabelo"],m:0,s:["Tipo de cabelo*|Cabelo humano,Sintético,Misto","Tipo de renda|Lace front 13x4,Lace front 13x6,Full lace,Fechamento 4x4,Fechamento 5x5,Sem renda"],o:["Densidade*|130%,150%,180%,200%,250%","Formato*|Liso,Ondulado,Body wave,Deep wave,Cacheado,Crespo"]},
{id:"perfume",re:/perfume/,x:1,s:["Volume (ml)*|30,50,75,100,150,200","Género*|Homem,Mulher,Unissexo","Tipo|Eau de parfum,Eau de toilette,Colónia","Validade"]},
{id:"maquiagem",re:/maquiagem/,x:1,s:["Tipo*|Base,Batom,Sombra,Máscara de pestanas,Pó,Outro","Tom ou cor*","Volume ou peso","Validade*"]},
{id:"pele",re:/cuidados com a pele|cuidados pessoais|barbear/,x:1,s:[TP,"Tipo de pele|Normal,Seca,Oleosa,Mista,Sensível,Todas","Volume (ml)*","Validade*"]},
{id:"cabelo",re:/produtos para cabelo/,x:1,s:["Tipo*|Shampoo,Condicionador,Óleo,Creme,Tinta,Outro","Volume (ml)*","Validade*"]},
{id:"beleza",re:/^beleza/,x:1,s:[TP,"Volume ou peso*","Validade*"]},
{id:"alimento",re:/^(alimentacao e bebidas|carnes)/,x:1,s:["Peso ou volume*","Validade*","Conservação*|Ambiente,Refrigerado,Congelado","Origem"]},
{id:"racao",re:/racoes/,x:1,s:["Animal*|Cão,Gato,Aves,Gado,Peixes,Outro","Peso (kg)*","Validade*"]},
{id:"agro_topo",re:/^animais e agricultura$/,x:1,s:["Tipo*|Animal,Equipamento,Fertilizante,Ração,Semente"]},
{id:"semente",re:/sementes|fertilizantes/,x:1,s:[TP,"Peso (kg)*","Validade"]},
{id:"animal",re:/^animais (de estimacao|e agricultura > animais)|^animais de estimacao/,x:1,s:["Espécie*","Raça","Idade","Sexo|Macho,Fêmea","Vacinado|Sim,Não"]},
{id:"jante_pneu",re:/pneus/,m:0,s:["Produto*|Pneu,Jante",MA,"Largura do pneu (mm)|135,155,165,175,185,195,205,215,225,235,245,255,265,275,285,295,305,315","Perfil do pneu|30,35,40,45,50,55,60,65,70,75,80","Aro*|R13,R14,R15,R16,R17,R18,R19,R20,R21,R22","Tipo de pneu|Verão,Inverno,Todas as estações","Índice de carga","Índice de velocidade","Ano de fabrico","Furação da jante (PCD)|4x100,4x114.3,5x100,5x112,5x114.3,5x120,6x139.7"]},
{id:"bateria_carro",re:/baterias( de carro)?$|bateria de carro/,g:/^(carros|pecas e acessorios auto)/,m:0,s:["Voltagem*|12V,24V","Capacidade (Ah)*","Marca compatível",G]},
{id:"vidro_auto",re:/vidro para automoveis/,m:0,s:["Posição*|Para-brisas,Vidro traseiro,Vidro lateral,Espelho","Marca compatível*","Modelo compatível*","Ano compatível*"]},
{id:"acess_carro",re:/acessorios (de carro|auto)/,g:/^(carros|pecas e acessorios auto)/,s:[TP,"Compatibilidade*|Universal,Marca e modelo específicos","Marca compatível","Modelo compatível"]},
{id:"peca_carro",re:/pecas|carrocaria|eletronica automovel|escape|filtros e oleos|iluminacao|suspensao|transmissao|travoes|motores de carros/,g:/^(carros|pecas e acessorios auto|motores de carros)/,m:0,s:R_PECA},
{id:"camiao",re:/camio|autocarros|minibus/,m:0,s:[MA,"Modelo*","Ano*","Capacidade (toneladas)*","Eixos*|2,3,4,5+","Lugares*|2,3,15,18,25,30,50,60+","Combustível*|Diesel,Gasolina,Elétrico,Gás","Transmissão*|Manual,Automática","Potência (cv)","Quilometragem (km)","Volante|Esquerdo,Direito"]},
{id:"mota",re:/motas|motorizadas/,m:0,s:[MA,"Modelo*","Ano*","Cilindrada (cc)*|50,70,110,125,150,200,250,300,400,500,Outra","Combustível*|Gasolina,Elétrico","Transmissão|Manual,Automática","Quilometragem (km)"]},
{id:"carro",re:/^(carros|automovel)/,m:0,s:[MA,"Modelo*","Ano*","Combustível*|Gasolina,Diesel,Elétrico,Híbrido","Transmissão*|Manual,Automática","Lugares*|2,4,5,7,8,9,12,15","Quilometragem (km)*","Cilindrada (cc)","Tração|2WD,4WD,AWD","Volante|Esquerdo,Direito"]},
{id:"barco",re:/^barcos/,m:0,s:[TP,"Comprimento (m)*","Motor (cv)","Ano","Capacidade (pessoas)","Material do casco|Fibra,Alumínio,Madeira,Aço"]},
{id:"tel_acess",re:/(celulares|telemoveis).* > (capas|carregadores|peliculas|pecas|power)/,m:0,s:["Compatível com*",TP,"Potência (W)","Capacidade (mAh)"]},
{id:"telemovel",re:/celulares|telemoveis|tablet/,m:0,s:[MA,"Modelo*","Sistema*|Android,iOS","Ecrã (polegadas)","Bateria (mAh)","Câmara (MP)"],o:["RAM*|2GB,3GB,4GB,6GB,8GB,12GB,16GB","Memória*|32GB,64GB,128GB,256GB,512GB,1TB","Rede*|4G,5G","Versão|Global,China,Outra"]},
{id:"pc_acess",re:/laptops > acessorios|componentes|teclados|impressoras|monitores/,m:0,s:[MA,"Modelo","Ligação|USB,Bluetooth,Wi-Fi,HDMI,Outra",G]},
{id:"disco",re:/discos|ssd|memorias ram/,m:0,s:[MA,"Capacidade*|4GB,8GB,16GB,32GB,128GB,256GB,512GB,1TB,2TB,4TB","Tipo*|SSD,HDD,DDR3,DDR4,DDR5",G]},
{id:"pc",re:/laptops|portateis|computadores/,m:0,s:["Marca*|Dell,HP,Lenovo,Apple,Asus,Acer,Microsoft,Samsung,Toshiba,MSI,Outra","Modelo","Processador*|Intel Celeron,Intel Pentium,Intel Core i3,Intel Core i5,Intel Core i7,Intel Core i9,Intel Core Ultra 5,Intel Core Ultra 7,Intel Core Ultra 9,AMD Ryzen 3,AMD Ryzen 5,AMD Ryzen 7,AMD Ryzen 9,Apple M1,Apple M2,Apple M3,Apple M4,Outro","Geração|4.ª,5.ª,6.ª,7.ª,8.ª,9.ª,10.ª,11.ª,12.ª,13.ª,14.ª,15.ª","RAM*|4GB,8GB,12GB,16GB,32GB,64GB","Armazenamento*|128GB SSD,256GB SSD,512GB SSD,1TB SSD,2TB SSD,500GB HDD,1TB HDD","Ecrã (polegadas)|11.6,13.3,14,15.6,16,17.3","Placa gráfica|Integrada,NVIDIA,AMD","Sistema operativo|Windows 11,Windows 10,macOS,Linux,Chrome OS,Sem sistema",G]},
{id:"informatica",re:/^informatica/,m:0,s:[MA,"Modelo",G]},
{id:"tv",re:/televisores/,m:0,s:[MA,"Tamanho do ecrã*|24,32,43,50,55,65,75,85 polegadas","Resolução*|HD,Full HD,4K,8K","Smart TV|Sim,Não","Voltagem|110-240V,220V",G]},
{id:"camara",re:/camaras/,m:0,s:[MA,"Resolução (MP)","Visão noturna|Sim,Não","Ligação|Wi-Fi,Cabo,4G",G]},
{id:"audio",re:/audio|auscult|colunas|microfones|amplificadores|projetores|equipamento dj/,m:0,s:[MA,"Potência (W)","Ligação|Bluetooth,Cabo,Wi-Fi","Voltagem|110-240V,220V,Bateria",G]},
{id:"carrinho",re:/carrinhos de bebe/,s:["Tipo*|Carrinho,Cadeira de carro,Berço,Andador,Outro","Idade|0-6 meses,0-3 anos,3-6 anos","Peso máximo (kg)","Dobrável|Sim,Não"]},
{id:"movel_inf",re:/mobiliario infantil/,s:["Dimensões (cm)*","Idade recomendada|1-3 anos,3-6 anos,6-12 anos",MO]},
{id:"brinquedo",re:/brinquedos|produtos para criancas e bebes|^criancas/,m:0,s:["Idade recomendada*|0-12 meses,1-3 anos,3-6 anos,6-12 anos,12+ anos","Funciona a|Pilhas,Bateria,Sem bateria"]},
{id:"jogo",re:/consolas|jogos|filmes|instrumentos/,m:0,s:[MR,"Plataforma|PlayStation,Xbox,Nintendo,PC,Outra","Tipo*"]},
{id:"eletronico",re:/^(eletronica|eletronicos|eletrodomesticos)/,m:0,s:[MA,"Modelo","Voltagem*|110V,220V,110-240V","Tipo de ficha|"+R_FICHA,"Potência (W)",G]},
{id:"solar_painel",re:/painel solar|paineis solares/,m:0,s:["Potência (W)*|100,200,300,400,450,550,600,700","Tipo*|Monocristalino,Policristalino","Voltagem*","Eficiência (%)","Garantia (anos)*","Dimensões (mm)","Peso (kg)"]},
{id:"solar_bateria",re:/baterias solares|inversores e baterias/,m:0,s:["Tipo*|Inversor,Bateria solar","Voltagem*|12V,24V,48V","Capacidade (Ah)","Potência (W)","Tipo de bateria|Lítio,Chumbo-ácido,Gel","Garantia (anos)*"]},
{id:"solar_inversor",re:/inversores/,m:0,s:["Potência (W)*","Tensão de entrada*","Tensão de saída*|110V,220V","Tipo*|Onda pura,Onda modificada,Híbrido","Garantia (anos)*"]},
{id:"solar_ctrl",re:/controladores/,m:0,s:["Corrente (A)*|10,20,30,40,60","Tipo*|MPPT,PWM","Voltagem*|12V,24V,48V",G]},
{id:"energia",re:/^energia solar|energia e eletricidade|material eletrico|cabos e fios|quadros|transformadores/,m:0,s:[MR,"Voltagem*|"+R_VOLT,"Corrente (A)","Potência (kW)",G]},
{id:"agua",re:/bombas de agua|filtros de agua/,m:0,s:[MR,"Potência (W)*","Caudal (L/min)","Altura máxima (m)",V3,G]},
{id:"reservatorio",re:/reservatorios|tanques|^agua e saneamento$/,s:["Capacidade (L)*","Altura (cm)","Diâmetro (cm)"]},
{id:"trator",re:/tratores|maquinas agricolas|equipamentos agricolas/,m:0,s:[MA,"Potência (cv)*","Tração|2WD,4WD","Combustível|Diesel,Gasolina","Ano",G]},
{id:"pagamento",re:/maquinas de pagamento/,m:0,s:[MA,"Tipo*|Cartão,Móvel (POS),Fixo","Ligação|Wi-Fi,4G,Ethernet",G]},
{id:"cabos",re:/cabos e adaptadores/,m:0,s:["Tipo*|HDMI,USB,Aux,Carregamento,Rede,Outro","Comprimento (m)","Marca"]},
{id:"irrigacao",re:/irrigacao/,s:["Tipo*|Gotejamento,Aspersão,Pivô,Mangueira,Outro","Cobertura (m²)","Comprimento (m)"]},
{id:"gerador",re:/geradores/,m:0,s:[MR,"Potência (kVA)*","Combustível*|Diesel,Gasolina,Gás","Fase*|Monofásico,Trifásico","Tipo*|Aberto,Silencioso",G]},
{id:"motor_diesel",re:/motor a diesel/,m:0,s:[MR,"Potência (kW)*","Cilindros|1,2,3,4,6","Rotação (rpm)","Arrefecimento|Ar,Água",G]},
{id:"motor_eletrico",re:/motor eletrico|motor e dinamo/,m:0,s:[MR,"Potência (kW)*","Voltagem*|110V,220V,380V,415V","Fase*|Monofásico,Trifásico","Rotação (rpm)*","Frequência|50Hz,60Hz",G]},
{id:"empilhadora",re:/empilhadoras/,m:0,s:[MR,"Capacidade de carga (kg)*","Altura de elevação (m)*","Tipo*|Elétrica,Diesel,Gás,Manual",G]},
{id:"compressor",re:/compressores/,m:0,s:[MR,"Pressão (bar)*","Caudal (L/min)*","Potência (kW)*",V3,"Capacidade do depósito (L)",G]},
{id:"soldadura",re:/soldadura/,m:0,s:[MR,"Tipo*|MIG,MMA,TIG,Plasma,Outro","Corrente (A)*",V3,G]},
{id:"rolamento",re:/rolamentos/,s:[MR,TP,"Diâmetro interno (mm)*","Diâmetro externo (mm)*","Largura (mm)*"]},
{id:"valvula",re:/tubos e valvulas/,s:["Tipo*|Tubo,Válvula","Diâmetro (mm)*","Pressão (bar)","Comprimento (m)"]},
{id:"epi",re:/seguranca industrial/,tam:["unico","letras","calcado"],s:["Tipo*|Capacete,Luvas,Botas,Óculos,Colete,Máscara,Outro","Norma|CE,EN,ANSI,Outra"]},
{id:"metais",re:/aco e metais/,s:[TP,"Espessura (mm)*","Dimensões*"]},
{id:"moagem",re:/moagem/,m:0,s:[MR,"Capacidade (kg/h)*","Potência (kW)*",V3,G]},
{id:"movel",re:/^(moveis|casa e|decoracao|cozinha)|armarios|cadeiras|mesas|balcoes|vitrinas/,s:["Dimensões (cm)*",MO]},
{id:"maquina",re:/^(industria|maquinas|equipamentos profissionais|comercio e negocios|ferramentas > ferramentas eletricas|ferramentas > equipamentos de oficina)/,m:0,s:R_MAQ},
{id:"ferramenta",re:/^ferramentas/,m:0,s:[MR,TP,"Voltagem|110V,220V,Bateria,Manual","Potência (W)",G]},
{id:"cimento",re:/cimento|blocos|areia/,x:1,s:[TP,"Peso ou volume*","Dimensões (cm)"]},
{id:"ferro",re:/^(ferros|vidros)/,s:[TP,"Espessura (mm)*","Dimensões*"]},
{id:"tubo",re:/canalizacao/,s:["Diâmetro (mm)*","Comprimento (m)","Pressão (bar)"]},
{id:"tinta",re:/tintas/,x:1,s:["Volume (L)*|1,4,5,10,18,20","Cor*","Acabamento|Fosco,Brilhante,Acetinado"]},
{id:"construcao",re:/^construcao/,s:[TP,MR,"Dimensões"]},
{id:"cama",re:/camas/,s:["Tamanho*|Solteiro,Casal,Queen,King",MO]},
{id:"sofa",re:/sofas/,s:["Lugares*|1,2,3,4,5,6",MO]},
{id:"bicicleta",re:/bicicleta/,s:["Tamanho do aro*|12,16,20,24,26,27.5,29","Mudanças|1,6,7,18,21,24","Tipo*|Montanha,Estrada,Urbana,Criança,Elétrica"]},
{id:"desporto",re:/^(desporto|esportes)/,tam:["unico","letras","calcado"],s:[MR,"Tipo*"]},
{id:"livro",re:/^livros|material escolar/,m:0,s:[TP,"Autor ou marca","Idioma|Português,Inglês,Francês,Outro"]},
{id:"seguranca",re:/^seguranca/,m:0,s:[MR,TP,"Voltagem|12V,110V,220V,Bateria",G]},
{id:"saude",re:/^saude/,m:0,s:[MA,TP,"Certificação|CE,ISO,Outra"]},
{id:"viagem",re:/^viagem/,s:[TP,"Capacidade (L)"]},
{id:"outros",re:/./,s:[MR,"Dimensões (cm)","Peso (kg)"]}
];
function semAcento(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function bbCampo(t){var p=t.split("|"),n=p[0],o=/\*$/.test(n);return{nome:n.replace(/\*$/,""),obrig:o,sug:p[1]?p[1].split(",").filter(Boolean):[]}}
function registoPerfil(caminho){
var c=semAcento(caminho).replace(/\s*>\s*/g," > ").trim(),R=BB_REG[BB_REG.length-1];
for(var i=0;i<BB_REG.length;i++){var r=BB_REG[i];if((!r.g||r.g.test(c))&&r.re.test(c)){R=r;break}}
var tam=(R.tam||["unico"]).slice();
var crianca=/crianca|infantis|bebe|menin|rapaz|rapariga/.test(c);
if(crianca&&(tam.indexOf("letras")>-1||tam.indexOf("numeros")>-1)&&tam.indexOf("idade")<0)tam.unshift("idade");
return{
id:R.id,cond:!R.x&&R.cond!==0,mat:!R.x&&R.m!==0,medidas:!!R.medidas,tam:tam,
matSug:(R.matSug||R_MAT_ROUPA).split(","),
spec:(R.s||[]).map(bbCampo),
opc:(R.o||[]).map(bbCampo)
};
}
function perfilDe(caminho){
var r=registoPerfil(caminho),spec=[],opc=[];
if(r.cond)spec.push({nome:"Condição",obrig:true,sug:["Novo","Usado","Usado e recondicionado"]});
if(r.mat)spec.push({nome:"Material",obrig:false,sug:r.matSug});
var soDetalhes=/detalhes-fornecedor/.test(location.pathname);
if(!soDetalhes){
spec=spec.concat(r.spec);
if(r.medidas)opc.push({nome:"Modo",obrig:false,sug:["Tamanho padrão","Medidas personalizadas"]});
opc=opc.concat(r.opc);
}
return{id:r.id,medidas:r.medidas,spec:spec,opc:opc,tam:r.tam};
}
function caminhoDe(cats,id){
var m={};cats.forEach(function(c){m[c.id]=c});
var out=[],n=0,c=m[id];
while(c&&n++<6){out.unshift(c.name||c.nome||c.title||"");c=m[c.parent_id||c.parent]}
return out.join(" > ");
}
(function(){
if(!/detalhes-fornecedor/.test(location.pathname)||!window.supabase)return;
function ob(x){if(typeof x=="string"){try{x=JSON.parse(x)}catch(e){x={}}}return x&&typeof x=="object"&&!Array.isArray(x)?x:{}}
var oc=supabase.createClient;
supabase.createClient=function(){var cl=oc.apply(this,arguments),of=cl.from.bind(cl);
cl.from=function(t){var q=of(t);if(t=="products"&&q.update){var ou=q.update.bind(q);q.update=function(r,o){try{var p=window.cur;if(p&&r){
var b=p._b||{s:ob(p.specs),o:ob(p.opcoes)};if(r.specs)r.specs=Object.assign({},b.s,r.specs);if(r.opcoes)r.opcoes=Object.assign({},b.o,r.opcoes);p._b={s:r.specs||b.s,o:r.opcoes||b.o}}}catch(e){}return ou(r,o)}}return q};return cl}
})();

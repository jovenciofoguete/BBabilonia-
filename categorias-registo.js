/* Campos pedidos ao REGISTAR o produto, por categoria. Ficheiro novo: não altera nada do que já existe.
   Nome* = obrigatório. "Nome|a,b,c" = lista de opções. cond/mat = mostrar Condição e Material nos detalhes. */
var R_GEN="Homem,Mulher,Menino,Menina,Unissexo";
var R_EST="Verão,Inverno,Meia-estação,Todas";
var R_PAD="Liso,Estampado,Riscas,Xadrez,Bordado,Outro";
var R_IDADE="0-3 meses,3-6 meses,6-12 meses,1-2 anos,2-4 anos,4-6 anos,6-8 anos,8-10 anos,10-14 anos";
var R_VOLT="110V,220V,110-240V,380V,415V";
var R_FICHA="Tipo A,Tipo C,Tipo D,Tipo G,Sem ficha";
var R_MAT_ROUPA="Algodão,Poliéster,Seda,Linho,Lã,Jeans,Couro,Malha,Nylon,Veludo,Misto,Outro";
var R_MEDIDAS=["Altura","Ombros","Peito","Cintura","Barriga","Ombro-pés","Ombro-cintura","Cintura-pés","Comprimento das mangas","Largura das mangas","Boca das mangas"];
var R_ROUPA=/^(roupa|homens|mulheres|criancas|conjuntos|calcas|camisas|casacos e jaquetas|saias|vestidos|fatos|roupa interior e pijamas|moda e acessorios|bebe|praia|produtos para criancas e bebes > roupas)/;
var R_SERV=["Tipo de serviço*","Preço por*|Hora,Dia,Projeto,Mês,Evento","Localização*","Disponibilidade"];
var R_MAQ=["Marca","Potência (kW)*","Voltagem*|"+R_VOLT,"Fase|Monofásico,Trifásico","Tipo de ficha|"+R_FICHA,"Capacidade*","Peso (kg)*","Dimensões (mm)*","Garantia*"];
var R_PECA=["Marca compatível*","Modelo compatível*","Ano compatível*","Nº da peça (OEM)","Garantia"];
/* g = grupo (só aplica se o caminho começar assim), re = palavra no caminho, cond/mat = 0 esconde */
var REGISTO=[
/* serviços e imóveis (sem Condição nem Material) */
{id:"emprego",re:/^emprego e servicos > empregos/,cond:0,mat:0,campos:["Cargo*","Tipo de contrato*|Tempo inteiro,Part-time,Temporário,Estágio","Salário","Localização*"]},
{id:"servico",re:/^(emprego e servicos|servicos para empresas|casamentos e eventos$|casamentos e eventos > (catering|decoracao|fotografia|som))/,cond:0,mat:0,campos:R_SERV},
{id:"turismo",re:/^turismo e alojamento/,cond:0,mat:0,campos:["Tipo*|Hotel,Quarto,Apartamento,Casa,Excursão","Capacidade (pessoas)*","Preço por*|Noite,Pessoa,Dia","Localização*","Comodidades|Wi-Fi,Piscina,Pequeno-almoço,Estacionamento,Ar condicionado"]},
{id:"terreno",re:/^imoveis > (terrenos|quintas)/,cond:0,mat:0,campos:["Tipo de negócio*|Venda,Aluguer","Área (m²)*","Localização*","Documentação*|DUAT,Título,Outra"]},
{id:"imovel",re:/^imoveis/,cond:0,mat:0,campos:["Tipo de negócio*|Venda,Aluguer","Área (m²)*","Quartos","Casas de banho","Localização*","Estado*|Novo,Usado,Em construção","Documentação|DUAT,Título,Outra"]},
/* calçado (antes de tudo o resto de roupa) */
{id:"calcado",gen:1,re:/calcad|sapat|sandal|chinel|botas|tenis|sapatilh|salto/,matSug:"Couro,Pele sintética,Tecido,Borracha,Lona,Camurça,Outro",campos:["Tipo de sola*|Borracha,Couro,EVA,PU","Fecho|Atacadores,Velcro,Elástico,Fivela,Sem fecho","Altura do salto (cm)","Estação|"+R_EST]},
/* casamento */
{id:"noiva_acess",re:/acessorios de noiv|coroas|luvas|tiaras|veus|brincos de noiva|colares de noiva|bolsas de noiva/,campos:["Cor*","Peças incluídas","Comprimento (cm)","Ajustável|Sim,Não"]},
{id:"fato",re:/fatos (de noivo|masculinos|femininos|para eventos|e blazers)|^fatos$|blazer/,medidas:1,matSug:"Lã,Poliéster,Algodão,Linho,Misto,Outro",campos:["Peças incluídas*|Casaco e calça,Casaco, calça e colete,Só casaco,Só calça","Corte*|Slim,Regular,Clássico","Botões|1,2,3,Duplo","Cor*","Aceita personalização*|Sim,Não","Prazo de personalização (dias)|2,4,7,15,22,30,45,60"]},
{id:"noiva",re:/noiv|madrinha|daminha|pajem/,medidas:1,matSug:"Renda,Cetim,Tule,Organza,Seda,Crepe,Outro",campos:["Silhueta*|Princesa,Sereia,Linha A,Reto,Trompete,Outro","Decote|Coração,V,Redondo,Ombro a ombro,Alças,Outro","Mangas|Sem mangas,Curtas,Longas,Alças","Comprimento*|Curto,Midi,Longo,Com cauda","Fecho|Zíper,Cordões,Botões","Cor*","Aceita personalização*|Sim,Não","Prazo de personalização (dias)|2,4,7,15,22,30,45,60"]},
{id:"casamento",re:/^roupa de casamento$/,campos:["Tipo de peça*|Vestido de noiva,Vestido de madrinha,Fato de noivo,Roupa de daminha ou pajem,Acessório,Calçado,Outro","Cor*","Aceita personalização|Sim,Não"]},
/* malas e bolsas */
{id:"bolsa",re:/bolsas|malas|bagagem/,matSug:"Couro,Pele sintética,Tecido,Nylon,Lona,Outro",campos:["Tipo*|Mala de mão,Mochila,Carteira,Mala de viagem,Pasta,Outro","Capacidade (L)","Fecho|Zíper,Botão,Magnético,Fivela","Cor*"]},
/* roupa por tipo (só dentro dos grupos de roupa) */
{g:R_ROUPA,id:"bebe",re:/roupa de bebe|roupas de bebe|^bebe$/,roupa:1,matSug:R_MAT_ROUPA,campos:["Género*|Menino,Menina,Unissexo","Faixa etária*|"+R_IDADE,"Estação|"+R_EST,"Padrão|"+R_PAD]},
{g:R_ROUPA,id:"banho",re:/banho|biquini|^praia/,roupa:1,matSug:"Poliéster,Nylon,Elastano,Lycra,Algodão,Outro",campos:["Tipo*|Biquíni,Fato inteiro,Calções de banho,Saída de praia,Outro","Proteção UV|Sim,Não","Padrão|"+R_PAD]},
{g:R_ROUPA,id:"interior",re:/interior|lingerie|meias|pijama/,roupa:1,matSug:"Algodão,Poliéster,Seda,Malha,Elastano,Outro",campos:["Pack de|1,2,3,5,6,12 peças","Estação|"+R_EST,"Padrão|"+R_PAD]},
{g:R_ROUPA,id:"vestido",re:/vestid|macac/,roupa:1,matSug:R_MAT_ROUPA,campos:["Comprimento*|Curto,Midi,Longo","Manga|Sem mangas,Curta,Longa,3/4","Estilo|Casual,Elegante,Festa,Praia,Trabalho","Estação|"+R_EST,"Padrão|"+R_PAD]},
{g:R_ROUPA,id:"uniforme",re:/uniforme/,roupa:1,matSug:R_MAT_ROUPA,campos:["Nível*|Pré-escolar,Primária,Secundária,Universitário","Escola ou cor*","Peças incluídas"]},
{g:R_ROUPA,id:"desportiva",re:/desportiv/,roupa:1,matSug:"Poliéster,Algodão,Elastano,Nylon,Misto,Outro",campos:["Desporto|Futebol,Corrida,Ginásio,Ténis,Natação,Outro","Estação|"+R_EST,"Padrão|"+R_PAD]},
{g:R_ROUPA,id:"festa",re:/festa/,roupa:1,matSug:R_MAT_ROUPA,campos:["Ocasião*|Casamento,Aniversário,Batizado,Gala,Outra","Comprimento|Curto,Midi,Longo","Padrão|"+R_PAD]},
{g:R_ROUPA,id:"casaco",re:/casaco|jaquet|jacket/,roupa:1,matSug:"Poliéster,Algodão,Couro,Lã,Nylon,Jeans,Misto,Outro",campos:["Forro|Sim,Não","Capuz|Sim,Não","Fecho|Zíper,Botões,Sem fecho","Estação|"+R_EST,"Padrão|"+R_PAD]},
{g:R_ROUPA,id:"capulana",re:/capulana|lenco/,roupa:1,matSug:"Algodão,Poliéster,Seda,Outro",campos:["Tamanho (cm)*","Padrão|"+R_PAD,"Cor*"]},
{g:R_ROUPA,id:"top",re:/blusa|camisa|camiseta|shirt|polo|\btops?\b|camisolas|hoodie/,roupa:1,matSug:R_MAT_ROUPA,campos:["Manga*|Sem mangas,Curta,Longa,3/4","Gola|Redonda,V,Polo,Alta,Capuz,Sem gola","Estilo|Casual,Elegante,Desportivo,Streetwear,Trabalho","Estação|"+R_EST,"Padrão|"+R_PAD]},
{g:R_ROUPA,id:"calca",re:/calca|jeans|calcoes|shorts|leggings|saia/,roupa:1,matSug:R_MAT_ROUPA,campos:["Cintura|Alta,Média,Baixa,Elástica","Comprimento|Curto,Midi,Longo","Corte|Justo,Reto,Largo,Skinny,Boot","Estação|"+R_EST,"Padrão|"+R_PAD]},
{g:R_ROUPA,id:"conjunto",re:/conjunt/,roupa:1,matSug:R_MAT_ROUPA,campos:["Peças incluídas*","Estilo|Casual,Elegante,Desportivo,Festa","Estação|"+R_EST,"Padrão|"+R_PAD]},
{id:"joia",re:/joias/,matSug:"Prata 925,Banhado a ouro,Ouro 18k,Aço inoxidável,Bijuteria,Outro",campos:["Tipo*|Anel,Aliança,Brinco,Colar,Pulseira,Relógio,Outro","Tamanho do anel|5,6,7,8,9,10,11,12,13","Pedra","Peso (g)","Garantia"]},
{g:R_ROUPA,id:"relogio",re:/relogio|oculos/,matSug:"Aço inoxidável,Plástico,Couro,Metal,Outro",campos:["Tipo*|Relógio,Óculos de sol,Óculos graduados,Outro","Género*|Homem,Mulher,Unissexo","Marca","Garantia"]},
{g:R_ROUPA,id:"roupa_acess",re:/acessorios/,roupa:1,matSug:"Couro,Algodão,Poliéster,Metal,Outro",campos:["Tipo*|Chapéu,Boné,Cinto,Lenço,Gravata,Luvas,Outro","Cor*"]},
{g:R_ROUPA,id:"roupa",re:/./,roupa:1,matSug:R_MAT_ROUPA,campos:["Estação|"+R_EST,"Padrão|"+R_PAD]},
/* beleza */
{id:"peruca",re:/peruca|extens|tranca|lace|cabelo humano/,matSug:"Cabelo humano,Sintético,Misto",campos:["Comprimento (polegadas)*|8,10,12,14,16,18,20,22,24,26,28,30,32","Densidade*|130%,150%,180%,200%,250%","Formato*|Liso,Ondulado,Cacheado,Crespo","Tipo de renda|Lace front,Full lace,Fechamento,Sem renda","Cor*"]},
{id:"perfume",re:/perfume/,cond:0,mat:0,campos:["Volume (ml)*|30,50,75,100,150,200","Género*|Homem,Mulher,Unissexo","Tipo|Eau de parfum,Eau de toilette,Colónia","Validade"]},
{id:"maquiagem",re:/maquiagem/,cond:0,mat:0,campos:["Tipo*|Base,Batom,Sombra,Máscara de pestanas,Pó,Outro","Tom ou cor*","Volume ou peso","Validade*"]},
{id:"pele",re:/cuidados com a pele|cuidados pessoais|barbear/,cond:0,mat:0,campos:["Tipo*","Tipo de pele|Normal,Seca,Oleosa,Mista,Sensível","Volume (ml)*","Validade*"]},
{id:"cabelo",re:/produtos para cabelo/,cond:0,mat:0,campos:["Tipo*|Shampoo,Condicionador,Óleo,Creme,Tinta,Outro","Volume (ml)*","Validade*"]},
{id:"beleza",re:/^beleza/,cond:0,mat:0,campos:["Tipo*","Volume ou peso*","Validade*"]},
/* alimentos e animais */
{id:"alimento",re:/^(alimentacao e bebidas|carnes)/,cond:0,mat:0,campos:["Peso ou volume*","Validade*","Conservação*|Ambiente,Refrigerado,Congelado","Origem"]},
{id:"racao",re:/racoes/,cond:0,mat:0,campos:["Animal*|Cão,Gato,Aves,Gado,Peixes,Outro","Peso (kg)*","Validade*"]},
{id:"agro_topo",re:/^animais e agricultura$/,cond:0,mat:0,campos:["Tipo*|Animal,Equipamento,Fertilizante,Ração,Semente"]},
{id:"semente",re:/sementes|fertilizantes/,cond:0,mat:0,campos:["Tipo*","Peso (kg)*","Validade"]},
{id:"animal",re:/^animais (de estimacao|e agricultura > animais)|^animais de estimacao/,cond:0,mat:0,campos:["Espécie*","Raça","Idade","Sexo|Macho,Fêmea","Vacinado|Sim,Não"]},
/* carros e peças */
{id:"jante_pneu",re:/pneus/,campos:["Produto*|Pneu,Jante","Marca*","Largura do pneu (mm)|135,155,165,175,185,195,205,215,225,235,245,255,265,275,285,295,305,315","Perfil do pneu|30,35,40,45,50,55,60,65,70,75,80","Aro do pneu|R13,R14,R15,R16,R17,R18,R19,R20,R21,R22","Tipo de pneu|Verão,Inverno,Todas as estações","Índice de carga","Índice de velocidade","Ano de fabrico","Diâmetro da jante (polegadas)|13,14,15,16,17,18,19,20,21,22","Furação da jante (PCD)|4x100,4x114.3,5x100,5x112,5x114.3,5x120,6x139.7","Offset da jante (ET)"],mat:0},
{id:"bateria_carro",re:/baterias( de carro)?$|bateria de carro/,mat:0,campos:["Voltagem*|12V,24V","Capacidade (Ah)*","Marca compatível","Garantia"],g:/^(carros|pecas e acessorios auto)/},
{id:"vidro_auto",re:/vidro para automoveis/,mat:0,campos:["Posição*|Para-brisas,Vidro traseiro,Vidro lateral,Espelho","Marca compatível*","Modelo compatível*","Ano compatível*"]},
{id:"acess_carro",re:/acessorios (de carro|auto)/,g:/^(carros|pecas e acessorios auto)/,campos:["Tipo*","Compatibilidade*|Universal,Marca e modelo específicos","Marca compatível","Modelo compatível"]},
{id:"peca_carro",re:/pecas|carrocaria|eletronica automovel|escape|filtros e oleos|iluminacao|suspensao|transmissao|travoes|motores de carros/,g:/^(carros|pecas e acessorios auto|motores de carros)/,mat:0,campos:R_PECA},
{id:"camiao",re:/camio|autocarros|minibus/,mat:0,campos:["Marca*","Capacidade (toneladas)*","Eixos*","Combustível*|Diesel,Gasolina,Elétrico,Gás","Potência (cv)*","Ano*","Transmissão|Manual,Automática","Quilometragem"]},
{id:"mota",re:/motas|motorizadas/,mat:0,campos:["Marca*","Modelo*","Ano*","Cilindrada (cc)*|50,70,110,125,150,200,250,300,400,500,Outra","Combustível*|Gasolina,Elétrico","Transmissão|Manual,Automática","Quilometragem"]},
{id:"carro",re:/^(carros|automovel)/,mat:0,campos:["Marca*","Modelo*","Ano*","Combustível*|Gasolina,Diesel,Elétrico,Híbrido","Transmissão*|Manual,Automática","Quilometragem","Cilindrada","Cor*","Lugares|2,4,5,7,9"]},
{id:"barco",re:/^barcos/,mat:0,campos:["Tipo*","Comprimento (m)*","Motor (cv)","Ano","Capacidade (pessoas)","Material do casco|Fibra,Alumínio,Madeira,Aço"]},
/* telemóveis e informática */
{id:"tel_acess",re:/(celulares|telemoveis).* > (capas|carregadores|peliculas|pecas|power)/,campos:["Compatível com*","Tipo*","Potência (W)","Capacidade (mAh)"]},
{id:"telemovel",re:/celulares|telemoveis|tablet/,campos:["Marca*","RAM*|2GB,3GB,4GB,6GB,8GB,12GB,16GB","Memória*|32GB,64GB,128GB,256GB,512GB,1TB","Rede*|4G,5G","Versão|Global,China,Outra","Sistema*|Android,iOS","Ecrã (polegadas)","Bateria (mAh)","Câmara (MP)","Garantia"]},
{id:"pc_acess",re:/laptops > acessorios|componentes|teclados|impressoras|monitores/,campos:["Marca*","Modelo","Ligação|USB,Bluetooth,Wi-Fi,HDMI,Outra","Garantia"]},
{id:"disco",re:/discos|ssd|memorias ram/,campos:["Marca*","Capacidade*|4GB,8GB,16GB,32GB,128GB,256GB,512GB,1TB,2TB,4TB","Tipo*|SSD,HDD,DDR3,DDR4,DDR5","Garantia"]},
{id:"pc",re:/laptops|portateis|computadores/,campos:["Marca*","RAM*|4GB,8GB,16GB,32GB,64GB","SSD*|128GB,256GB,512GB,1TB,2TB","Processador*|Intel Core i3,Intel Core i5,Intel Core i7,Intel Core i9,AMD Ryzen 5,AMD Ryzen 7","Geração|8.ª,10.ª,11.ª,12.ª,13.ª,14.ª","Ecrã (polegadas)","Placa gráfica","Sistema operativo","Garantia"]},
{id:"informatica",re:/^informatica/,campos:["Marca*","Modelo","Garantia"]},
{id:"tv",re:/televisores/,campos:["Marca*","Tamanho do ecrã*|24,32,43,50,55,65,75 polegadas","Resolução*|HD,Full HD,4K,8K","Smart TV|Sim,Não","Voltagem|110-240V,220V","Garantia*"]},
{id:"camara",re:/camaras/,campos:["Marca*","Resolução (MP)","Visão noturna|Sim,Não","Ligação|Wi-Fi,Cabo,4G","Garantia"]},
{id:"audio",re:/audio|auscult|colunas|microfones|amplificadores|projetores|equipamento dj/,campos:["Marca*","Potência (W)","Ligação|Bluetooth,Cabo,Wi-Fi","Voltagem|110-240V,220V,Bateria","Garantia*"]},
{id:"carrinho",re:/carrinhos de bebe/,campos:["Tipo*|Carrinho,Cadeira de carro,Berço,Andador,Outro","Idade|0-6 meses,0-3 anos,3-6 anos","Peso máximo (kg)","Dobrável|Sim,Não","Cor*"]},
{id:"movel_inf",re:/mobiliario infantil/,campos:["Dimensões (cm)*","Idade recomendada|1-3 anos,3-6 anos,6-12 anos","Montagem|Montado,Desmontado","Cor*"]},
{id:"brinquedo",re:/brinquedos|produtos para criancas e bebes|^criancas/,cond:1,campos:["Idade recomendada*|0-12 meses,1-3 anos,3-6 anos,6-12 anos,12+ anos","Funciona a|Pilhas,Bateria,Sem bateria","Peças|"]},
{id:"jogo",re:/consolas|jogos|filmes|instrumentos/,campos:["Marca","Plataforma|PlayStation,Xbox,Nintendo,PC,Outra","Tipo*"]},
{id:"eletronico",re:/^(eletronica|eletronicos|eletrodomesticos)/,campos:["Marca*","Modelo","Voltagem*|110V,220V,110-240V","Tipo de ficha|"+R_FICHA,"Potência (W)","Garantia*"]},
/* energia, água, indústria */
{id:"solar_painel",re:/painel solar|paineis solares/,campos:["Potência (W)*|100,200,300,400,450,550,600,700","Tipo*|Monocristalino,Policristalino","Voltagem*","Eficiência (%)","Garantia (anos)*","Dimensões (mm)","Peso (kg)"]},
{id:"solar_bateria",re:/baterias solares|inversores e baterias/,campos:["Voltagem*|12V,24V,48V","Capacidade (Ah)*","Tipo*|Lítio,Chumbo-ácido,Gel","Garantia (anos)*"]},
{id:"solar_inversor",re:/inversores/,campos:["Potência (W)*","Tensão de entrada*","Tensão de saída*|110V,220V","Tipo*|Onda pura,Onda modificada,Híbrido","Garantia (anos)*"]},
{id:"solar_ctrl",re:/controladores/,campos:["Corrente (A)*|10,20,30,40,60","Tipo*|MPPT,PWM","Voltagem*|12V,24V,48V","Garantia"]},
{id:"energia",re:/^energia solar|energia e eletricidade|material eletrico|cabos e fios|quadros|transformadores/,campos:["Marca","Voltagem*|"+R_VOLT,"Corrente (A)","Potência (kW)","Garantia"]},
{id:"agua",re:/bombas de agua|filtros de agua/,campos:["Marca","Potência (W)*","Caudal (L/min)","Altura máxima (m)","Voltagem*|110V,220V,380V","Garantia"]},
{id:"reservatorio",re:/reservatorios|tanques|^agua e saneamento$/,campos:["Capacidade (L)*","Altura (cm)","Diâmetro (cm)"]},
{id:"trator",re:/tratores|maquinas agricolas|equipamentos agricolas/,campos:["Marca","Potência (cv)*","Tração|2WD,4WD","Combustível|Diesel,Gasolina","Ano","Garantia"]},
{id:"pagamento",re:/maquinas de pagamento/,campos:["Marca*","Tipo*|Cartão,Móvel (POS),Fixo","Ligação|Wi-Fi,4G,Ethernet","Garantia"]},
{id:"cabos",re:/cabos e adaptadores/,campos:["Tipo*|HDMI,USB,Aux,Carregamento,Rede,Outro","Comprimento (m)","Conectores","Marca"]},
{id:"irrigacao",re:/irrigacao/,campos:["Tipo*|Gotejamento,Aspersão,Pivô,Mangueira,Outro","Cobertura (m²)","Comprimento (m)"]},
{id:"gerador",re:/geradores/,campos:["Marca","Potência (kVA)*","Combustível*|Diesel,Gasolina,Gás","Fase*|Monofásico,Trifásico","Frequência|50Hz,60Hz","Tipo*|Aberto,Silencioso","Garantia*"]},
{id:"inv_bat",re:/inversores e baterias/,campos:["Tipo*|Inversor,Bateria solar","Potência (W)","Voltagem*|12V,24V,48V","Capacidade (Ah)","Garantia (anos)*"]},
{id:"motor_diesel",re:/motor a diesel/,campos:["Marca","Potência (kW)*","Cilindros|1,2,3,4,6","Rotação (rpm)","Arrefecimento|Ar,Água","Garantia*"]},
{id:"motor_eletrico",re:/motor eletrico|motor e dinamo/,campos:["Marca","Potência (kW)*","Voltagem*|110V,220V,380V,415V","Fase*|Monofásico,Trifásico","Rotação (rpm)*","Frequência|50Hz,60Hz","Garantia*"]},
{id:"empilhadora",re:/empilhadoras/,campos:["Marca","Capacidade de carga (kg)*","Altura de elevação (m)*","Tipo*|Elétrica,Diesel,Gás,Manual","Garantia*"]},
{id:"compressor",re:/compressores/,campos:["Marca","Pressão (bar)*","Caudal (L/min)*","Potência (kW)*","Voltagem*|110V,220V,380V","Capacidade do depósito (L)","Garantia*"]},
{id:"soldadura",re:/soldadura/,campos:["Marca","Tipo*|MIG,MMA,TIG,Plasma,Outro","Corrente (A)*","Voltagem*|110V,220V,380V","Garantia*"]},
{id:"rolamento",re:/rolamentos/,campos:["Marca","Tipo*","Diâmetro interno (mm)*","Diâmetro externo (mm)*","Largura (mm)*"]},
{id:"valvula",re:/tubos e valvulas/,campos:["Tipo*|Tubo,Válvula","Diâmetro (mm)*","Pressão (bar)","Comprimento (m)"]},
{id:"epi",re:/seguranca industrial/,campos:["Tipo*|Capacete,Luvas,Botas,Óculos,Colete,Máscara,Outro","Norma|CE,EN,ANSI,Outra","Tamanho"]},
{id:"metais",re:/aco e metais/,campos:["Tipo*","Espessura (mm)*","Dimensões*"]},
{id:"moagem",re:/moagem/,campos:["Marca","Capacidade (kg/h)*","Potência (kW)*","Voltagem*|110V,220V,380V","Garantia*"]},
{id:"movel",re:/^(moveis|casa e|decoracao|cozinha)|armarios|cadeiras|mesas|balcoes|vitrinas/,campos:["Dimensões (cm)*","Peso (kg)","Montagem|Montado,Desmontado","Cor*"]},
{id:"maquina",re:/^(industria|maquinas|equipamentos profissionais|comercio e negocios|ferramentas > ferramentas eletricas|ferramentas > equipamentos de oficina)/,campos:R_MAQ},
{id:"ferramenta",re:/^ferramentas/,campos:["Marca","Tipo*","Voltagem|110V,220V,Bateria","Potência (W)","Garantia"]},
/* construção e materiais */
{id:"cimento",re:/cimento|blocos|areia/,cond:0,campos:["Tipo*","Peso ou volume*","Dimensões (cm)"]},
{id:"ferro",re:/^(ferros|vidros)/,campos:["Espessura (mm)*","Dimensões*","Tipo*"]},
{id:"tubo",re:/canalizacao/,campos:["Diâmetro (mm)*","Comprimento (m)","Pressão (bar)"]},
{id:"tinta",re:/tintas/,cond:0,mat:0,campos:["Volume (L)*|1,4,5,10,18,20","Cor*","Acabamento|Fosco,Brilhante,Acetinado"]},
{id:"construcao",re:/^construcao/,campos:["Tipo*","Marca","Dimensões"]},
/* casa, móveis, desporto, outros */
{id:"cama",re:/camas/,campos:["Tamanho*|Solteiro,Casal,Queen,King","Montagem|Montado,Desmontado","Cor*"]},
{id:"sofa",re:/sofas/,campos:["Lugares*|2,3,4,5,6","Montagem|Montado,Desmontado","Cor*"]},
{id:"bicicleta",re:/bicicleta/,campos:["Tamanho do aro*|12,16,20,24,26,27.5,29","Mudanças|1,6,7,18,21,24","Tipo*|Montanha,Estrada,Urbana,Criança,Elétrica"]},
{id:"desporto",re:/^(desporto|esportes)/,campos:["Marca","Tipo*","Tamanho"]},
{id:"livro",re:/^livros|material escolar/,campos:["Tipo*","Autor ou marca","Idioma|Português,Inglês,Francês,Outro"]},
{id:"seguranca",re:/^seguranca/,campos:["Marca","Tipo*","Voltagem|12V,110V,220V,Bateria","Garantia"]},
{id:"saude",re:/^saude/,campos:["Marca*","Tipo*","Certificação|CE,ISO,Outra","Garantia"]},
{id:"viagem",re:/^viagem/,campos:["Tipo*","Capacidade (L)","Cor*"]},
{id:"outros",re:/./,campos:["Marca","Dimensões (cm)","Peso (kg)","Garantia"]}
];
function _sa(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s*>\s*/g," > ").trim()}
function _campo(t){var p=t.split("|"),n=p[0],o=/\*$/.test(n);return{nome:n.replace(/\*$/,""),obrig:o,sug:p[1]?p[1].split(",").filter(Boolean):[]}}
function registoDe(caminho){
  var c=_sa(caminho),R=null;
  for(var i=0;i<REGISTO.length;i++){
    var r=REGISTO[i];
    if((!r.g||r.g.test(c))&&r.re.test(c)){R=r;break}
  }
  var campos=R.campos.map(_campo);
  var crianca=/crianca|infantis|bebe|menin|rapaz|rapariga/.test(c);
  var generoFixo=/homens|mulher|masculin|feminin|noiv/.test(c);
  if(R.roupa||R.gen){
    if(crianca){
      if(R.roupa&&R.id!=="bebe")campos.unshift(_campo("Faixa etária*|"+R_IDADE));
      if(R.id!=="bebe")campos.unshift(_campo("Género*|Menino,Menina,Unissexo"));
    }else if(!generoFixo){
      campos.unshift(_campo("Género*|"+R_GEN));
    }
  }
  return{id:R.id,cond:R.cond!==0,mat:R.mat!==0,matSug:R.matSug?R.matSug.split(","):[],medidas:!!R.medidas,campos:campos};
}

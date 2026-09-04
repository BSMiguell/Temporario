# DADOS DO MUNDO DE AETHERIA — Fonte da API da História

> 📌 **Este arquivo é a FONTE ESTRUTURADA do mundo** consumida pelo script `scripts\build_historia_api.ps1`, que gera o `historia-api.json` usado pelo Mapa de Aetheria (`Mapa_Aetheria.html`). Os demais arquivos desta pasta são narrativa livre; **este é o cânone operacional**: cada bloco abaixo vira um objeto na API.
>
> Formato: blocos `## TIPO: id | Nome` com campos `- **Rótulo:** valor` em linha única. Tipos válidos: `REGIAO`, `CELESTE`, `BATALHA`, `RACA`, `RITUAL`. Posições são coordenadas normalizadas do plano do mapa (`x` direita 0→1, `y` norte→sul 0→1). Para regenerar: `powershell -File scripts\build_historia_api.ps1`.

---

# PARTE I: REGIÕES DO MUNDO

## REGIAO: norte-sub-frost | O Norte Sub-Frost
- **Camada:** Mundo
- **Posição:** 0.42, 0.06
- **Bioma:** Tundra Glacial
- **Raças:** 01_Humanos
- **Cor:** #4A90D9
- **Descrição:** Tundra implacável acima da Linha de Geada, onde tempestades de neve místicas jamais cessam. Fortalezas de ferro negro pontuam o gelo: campos de prova da infantaria humana e prisões de segurança máxima que guardam segredos que o Império prefere enterrados — literalmente.

## REGIAO: norte-vetusto | O Norte Vetusto
- **Camada:** Mundo
- **Posição:** 0.28, 0.25
- **Bioma:** Zona Temperada
- **Raças:** 01_Humanos
- **Cor:** #4A90D9
- **Descrição:** Coração da civilização humana ao sul da Linha de Geada: cidades-bastião muradas, bacias hidrográficas e as rotas comerciais que abastecem o continente. É aqui que se decide o destino político de Aetheria — e onde a alquimia militar dos Observadores criou raiz mais funda.

## REGIAO: cumes-da-tempestade | Cumes da Tempestade
- **Camada:** Mundo
- **Posição:** 0.72, 0.18
- **Bioma:** Montanhas de Dente de Dragão
- **Raças:** 19_Barbaros
- **Cor:** #CA6F1E
- **Descrição:** Cadeia nordestina de picos afiados sob tempestades elétricas eternas, resquício elementais das guerras antigas. Os clãs bárbaros não têm cidades — têm assentamentos verticais de pedra e osso, e as espadas elementais que os Observadores lhes entregaram na Era de Ouro.

## REGIAO: grande-fenda-central | A Grande Fenda Central
- **Camada:** Mundo
- **Posição:** 0.50, 0.42
- **Bioma:** Ravinas Arcanas
- **Raças:** 02_Mutantes, 06_Desconhecidos
- **Cor:** #7B4D9E
- **Descrição:** Faixa divisória que corta o continente de leste a oeste: uma abóbada afundada de ravinas profundas, solo envenenado por radiação mágica e ruínas arcanas dos antigos laboratórios. Zona livre governada pelos párias mutantes desde a Queda dos Laboratórios Kether — e o lugar onde os Desconhecidos são vistos com mais frequência.

## REGIAO: florestas-espirituais | Florestas Espirituais e Vales de Névoa
- **Camada:** Mundo
- **Posição:** 0.24, 0.60
- **Bioma:** Floresta de Mana
- **Raças:** 17_Meio_Sangue
- **Cor:** #D35400
- **Descrição:** Árvores colossais cujas raízes canalizam o fluxo de mana do planeta, rios cristalinos e pântanos de névoa densa no centro-oeste. As tribos Meio-Sangue vivem em equilíbrio tenso com esse fluxo — quando o mana pulsa, elas sentem primeiro.

## REGIAO: necropoles-silenciosas | As Necrópoles Silenciosas
- **Camada:** Mundo
- **Posição:** 0.13, 0.80
- **Bioma:** Vales Sepulcrais
- **Raças:** 16_Alvamortos
- **Cor:** #BDC3C7
- **Descrição:** Vales cobertos de névoa eterna a sudoeste, onde cidades de mármore cinzento e obsidianas flutuantes formam um reino monástico e sepulcral. Isolados por barreiras de energia espiritual, os Alvamortos guardam os segredos da manipulação de almas — técnica legada diretamente pelos Observadores.

## REGIAO: terras-vermelhas | As Terras Vermelhas & Picos de Magma
- **Camada:** Mundo
- **Posição:** 0.68, 0.78
- **Bioma:** Planalto Vulcânico
- **Raças:** 21_Demonios_Akuma-Gani
- **Cor:** #DC143C
- **Descrição:** Planalto escaldante retalhado por rios de basalto e fendas de enxofre. As cidadelas Akuma-Gani são escavadas no interior dos próprios vulcões: arquitetura púrpura e rubra, portões colossais decorados com crânios de feras lendárias e forjas que nunca esfriam.

## REGIAO: fronteiras-de-magma | Fronteiras de Magma
- **Camada:** Mundo
- **Posição:** 0.86, 0.64
- **Bioma:** Transição Selva-Deserto
- **Raças:** 18_Canibais
- **Cor:** #A04000
- **Descrição:** Zona de transição entre a selva úmida e o deserto escuro nas bordas das Terras Vermelhas. Arenas de sacrifício e campos de caça pontuam a terra, e a única lei é a sobrevivência do mais forte — tribos de múltiplos braços incluídas.

## REGIAO: abismo-das-profundezas | O Abismo das Profundezas
- **Camada:** Mundo
- **Posição:** 0.52, 0.58
- **Bioma:** Fenda Cósmica
- **Raças:** 11_Seres_Do_Vazio
- **Cor:** #5D6D9E
- **Descrição:** O centro geométrico da Grande Fenda, onde a crosta cedeu por completo e revelou a dimensão corrosiva que dorme sob Aetheria. Não é um lugar — é uma ferida. Toda raça constrói suas defesas voltadas para dentro do solo; desde a Erupção, o mal latente respira de volta.

## REGIAO: torres-arcanas | Torres Arcanas de Vetusto
- **Camada:** Mundo
- **Posição:** 0.34, 0.32
- **Bioma:** Cidadelas-Torre
- **Raças:** 12_Magos
- **Cor:** #16A085
- **Descrição:** Distrito elevado do Norte Vetusto onde as academias de magia defensiva cresceram até virar cidadelas-torre, ligadas por pontes de pedra rúnica. Os Magos catalogam cada vertente de mana do continente — e desconfiam profundamente da "tecnologia arcana" dos Observadores, que parece magia sem fonte.

## REGIAO: fortalezas-de-juramento | Fortalezas de Juramento
- **Camada:** Mundo
- **Posição:** 0.37, 0.40
- **Bioma:** Marca Fronteiriça
- **Raças:** 03_Ordens_E_Guerreiros
- **Cor:** #C0392B
- **Descrição:** Linha de fortalezas-monastério erguidas sobre as estradas entre o Vetusto e a Fenda, após a Chacina da Linha de Geada provou que exércitos comuns não bastam. Cada Ordem juramenta uma guarda eterna: seus cavaleiros patrulham a Geada e enterram os mortos de todas as raças com o mesmo ritual.

## REGIAO: planalto-dos-colossos | Planalto dos Colossos
- **Camada:** Mundo
- **Posição:** 0.07, 0.48
- **Bioma:** Altiplano Ocidental
- **Raças:** 07_Gigantes
- **Cor:** #D68910
- **Descrição:** Cadeia montanhosa ocidental esquecida pelos mapas humanos, onde mesetas gigantescas carregam tronos talhados na própria rocha. Os Gigantes são testemunhas vivas da Era da Criação — e desde o Retorno Divino, os mais velhos despertam de sono de séculos para olhar fixamente o céu.

## REGIAO: terras-selvagens | Terras Selvagens
- **Camada:** Mundo
- **Posição:** 0.83, 0.40
- **Bioma:** Cinturão Bruto
- **Raças:** 08_Monstros
- **Cor:** #2E4053
- **Descrição:** Cinturão de biomas brutais entre a Fenda e o litoral leste, onde a fauna mutou fora de controle desde a Primeira Ruptura: bestas de couraça, colossos de caverna e matilhas que caçam por território, não por fome. Exércitos inteiros entram; caravanas de bandeiras saem.

## REGIAO: cavernas-de-obsidiana | Cavernas de Obsidiana
- **Camada:** Mundo
- **Posição:** 0.58, 0.90
- **Bioma:** Subsolo Vulcânico
- **Raças:** 04_Onis
- **Cor:** #E74C3C
- **Descrição:** Rede feudal de galerias e salões sob as bordas oeste das Terras Vermelhas, iluminada por veios de obsidiana espelhada. Cada corte Oni reivindica uma forja ancestral, e a guerra fria entre eles e as cidadelas Akuma-Gani pelo domínio das profundezas esquenta a cada ciclo.

## REGIAO: fosso-infernal | O Fosso Infernal
- **Camada:** Mundo
- **Posição:** 0.72, 0.93
- **Bioma:** Caldeira Selada
- **Raças:** 05_Demonios
- **Cor:** #8E44AD
- **Descrição:** Uma caldeira de basalto no extremo sul, coroada por sete pilares-selo gravados em linguagem anterior aos Deuses. Ali foram aprisionados os nobres infernais nascidos dos pactos de sangue da era pré-Ruptura — e cada guerra no continente acima afrouxa um elo da corrente.

## REGIAO: ruinas-do-voto-partido | Ruínas do Voto Partido
- **Camada:** Mundo
- **Posição:** 0.34, 0.72
- **Bioma:** Campo de Ruínas
- **Raças:** 20_Amaldiçoados
- **Cor:** #5D6D7E
- **Descrição:** Campo de santuários arruinados no centro-sul onde maldições antigas condensam em névoa visível. Os Amaldiçoados — monges e guerreiros marcados por votos que ninguém deveria fazer — peregrinam até aqui para reforçar os selos menores que mantêm o Vazio longe dos vales habitados.

---

# PARTE II: ENTIDADES CELESTES E SOMBRIAS

## CELESTE: naves-dos-observadores | Naves-Cidadelas dos Observadores
- **Camada:** Céus
- **Posição:** 0.80, 0.10
- **Altitude:** Alta
- **Raças:** 10_Os_Observadores
- **Cor:** #1ABC9C
- **Descrição:** Figuras colossais envoltas em halos de luz e tecnologia arcana indecifrável, estacionadas no Vazio Superior. Chegaram como benfeitoras há séculos; hoje suas naves-cidadelas descem em silêncio, planejando sacrificar 80% do continente como escudo de almas contra o Abismo.

## CELESTE: retorno-dos-deuses | Retorno dos Deuses
- **Camada:** Céus
- **Posição:** 0.50, 0.30
- **Altitude:** Alta
- **Raças:** 13_Deuses
- **Cor:** #F39C12
- **Descrição:** Feixes de luz divina rasgam o céu e avatares como Solkhamun, Mycelium e Kaminari descem em carruagens de fogo e tempestade. O Retorno não é milagre: é resposta de emergência à barreira rompida — os velhos mestres da realidade voltaram para reivindicar posições.

## CELESTE: mascaras-na-nevoa | Máscaras na Névoa
- **Camada:** Céus
- **Posição:** 0.79, 0.88
- **Altitude:** Baixa
- **Raças:** 14_Demonios_Do_Caos
- **Cor:** #E67E22
- **Descrição:** Remanescentes da primeira invasão do Abismo, presos no plano material quando as fendas se fecharam. Vestem trajes de bufões e máscaras risonhas enquanto rondam os campos de batalha do sul — colhendo a energia da dor e provocando guerras para abrir os portões por baixo.

## CELESTE: aspectos-em-marcha | Os Aspectos em Marcha
- **Camada:** Céus
- **Posição:** 0.46, 0.14
- **Altitude:** Média
- **Raças:** 15_Os_Aspectos
- **Cor:** #9B59B6
- **Descrição:** Seres conceituais em armaduras lendárias — Convex, Ganion, Eonis — marchando de novo sobre picos imortais e geleiras. Não fazem aliança, não negociam, não poupam: sua única missão é rearmar as defesas do mundo, e quem cruzar essa linha é obstáculo.

## CELESTE: sementes-de-ascensao | Sementes de Ascensão
- **Camada:** Céus
- **Posição:** 0.84, 0.22
- **Altitude:** Média
- **Raças:** 09_Semi_Deuses
- **Cor:** #F1C40F
- **Descrição:** Fragmentos de poder cósmico lançados pelos Observadores sobre mortais comuns — Humanos, Alvamortos, Meio-Sangue. Cada centelha que acende cria um Semi-Deus: imortalidade parcial, propósito incerto e uma suspeita crescente de que são peões, não campeões.

---

# PARTE III: AS GRANDES BATALHAS

## BATALHA: chacina-da-linha-de-geada | A Chacina da Linha de Geada
- **Posição:** 0.44, 0.15
- **Região:** norte-sub-frost
- **Lados:** 01_Humanos vs 15_Os_Aspectos
- **Era:** I
- **Data:** Inverno Eterno, ano 0
- **Resumo:** A 1ª Divisão de Infantaria Humana cruzou com Os Aspectos emergindo do gelo — e foi obliterada por lâminas cósmicas em horas. A fronteira congelada ficou marcada por armaduras despedaçadas: o primeiro sinal público do fim dos tempos.

## BATALHA: tres-picos | A Batalha dos Três Picos
- **Posição:** 0.74, 0.20
- **Região:** cumes-da-tempestade
- **Lados:** 19_Barbaros vs 09_Semi_Deuses
- **Era:** II
- **Data:** Primavera dos Cumes, ano 3
- **Resumo:** Sob a maior tempestade elétrica já registrada, os clãs bárbaros resistiram à magia divina e ao voo dos Semi-Deuses enviados pelos Observadores, transformando as gargantas em corredor de sangue. Uma trégua forçada nasceu da interferência de um único Aspecto.

## BATALHA: queda-dos-laboratorios-kether | A Queda dos Laboratórios Kether
- **Posição:** 0.48, 0.35
- **Região:** grande-fenda-central
- **Lados:** 02_Mutantes vs 01_Humanos, 21_Demonios_Akuma-Gani
- **Era:** III
- **Data:** Outono da Fenda, ano 7
- **Resumo:** O levante massivo das cobaias destruiu o maior complexo de clonagem e síntese arcana de Aetheria. As habilidades instáveis alimentadas pela energia residual dos experimentos arrasaram as estruturas arcanas — e nasceu ali a zona livre dos párias mutantes.

## BATALHA: erupcao-do-abismo | A Erupção do Abismo
- **Posição:** 0.51, 0.56
- **Região:** abismo-das-profundezas
- **Lados:** 13_Deuses vs 11_Seres_Do_Vazio
- **Era:** IV
- **Data:** Verão do Vazio, ano 12
- **Resumo:** Com os selos enfraquecidos pelas guerras mortais, o solo da Fenda cedeu e o Vazio emergiu em névoa cinzenta. No mesmo instante, avatares divinos desceram direto no ponto de impacto — a batalha em curso que rasga a física do continente.

## BATALHA: cerco-de-obsidianas | O Cerco de Obsidianas
- **Posição:** 0.66, 0.84
- **Região:** terras-vermelhas
- **Lados:** 21_Demonios_Akuma-Gani vs 14_Demonios_Do_Caos
- **Era:** IV
- **Data:** Verão do Vazio, ano 12 (clímax)
- **Resumo:** Atraídos pela energia acumulada das forjas, os Demônios do Caos invadiram a cidadela vulcânica sobre rios de lava e pontes de basalto. Defendida com fogo puro, a fortaleza resistiu — mas os invasores recuaram satisfeitos, tendo colhido a dor de centenas de mortos.

---

# PARTE IV: RAÇAS E SUAS TERRAS

## RACA: 01_Humanos | Humanos
- **Cor:** #4A90D9
- **Tipo:** Territorial
- **Regiões:** norte-sub-frost, norte-vetusto
- **Descrição:** Donos do Norte Duplo: civilização de bastiões, alquimia militar herdada dos Observadores e a ambição que sustenta — e ameaça — o equilíbrio continental.

## RACA: 02_Mutantes | Mutantes
- **Cor:** #7B4D9E
- **Tipo:** Dispersa
- **Regiões:** grande-fenda-central
- **Descrição:** Nascidos de experimentos, adaptações extremas ou rejeição genética; banidos de toda cidade, organizam células rebeldes na única terra que os aceitou: a Fenda.

## RACA: 03_Ordens_E_Guerreiros | Ordens e Guerreiros
- **Cor:** #C0392B
- **Tipo:** Territorial
- **Regiões:** fortalezas-de-juramento
- **Descrição:** Cavalaria de juramentos permanentes que guarda a Linha de Geada e as estradas do sul; enterram os mortos de qualquer raça com o mesmo ritual.

## RACA: 04_Onis | Onis
- **Cor:** #E74C3C
- **Tipo:** Territorial
- **Regiões:** cavernas-de-obsidiana
- **Descrição:** Cortes feudais demoníacas do subsolo vulcânico, cada uma disputando uma forja ancestral — rivais frios dos Akuma-Gani nas profundezas.

## RACA: 05_Demonios | Demônios
- **Cor:** #8E44AD
- **Tipo:** Territorial
- **Regiões:** fosso-infernal
- **Descrição:** Nobres infernais selados desde a era pré-Ruptura numa caldeira de sete pilares; cada guerra no mundo acima afrouxa um elo.

## RACA: 06_Desconhecidos | Desconhecidos
- **Cor:** #95A5A6
- **Tipo:** Errante
- **Regiões:** grande-fenda-central
- **Descrição:** Manifestações encapuzadas que aparecem antes de tragédias e ativam monólitos da Era da Criação. Não falam: gravam marcas em pedra.

## RACA: 07_Gigantes | Gigantes
- **Cor:** #D68910
- **Tipo:** Territorial
- **Regiões:** planalto-dos-colossos
- **Descrição:** Testemunhas da Era da Criação no altiplano ocidental; desde o Retorno Divino, os mais antigos despertam para olhar o céu.

## RACA: 08_Monstros | Monstros
- **Cor:** #2E4053
- **Tipo:** Selvagem
- **Regiões:** terras-selvagens
- **Descrição:** Fauna mutada pela radiação mágica das guerras antigas; caçam por território e transformaram o cinturão leste em terra proibida.

## RACA: 09_Semi_Deuses | Semideuses
- **Cor:** #F1C40F
- **Tipo:** Ascensa
- **Regiões:** sementes-de-ascensao
- **Descrição:** Mortais com Sementes de Ascensão injetadas pelos Observadores; imortalidade parcial e a dúvida de serem peões de um tabuleiro maior.

## RACA: 10_Os_Observadores | Os Observadores
- **Cor:** #1ABC9C
- **Tipo:** Cósmica
- **Regiões:** naves-dos-observadores
- **Descrição:** Arquitetos silenciosos do Vazio Superior; cada "presente" dado às raças foi calibrado para forjar uma linha de frente contra o Abismo.

## RACA: 11_Seres_Do_Vazio | Seres do Vazio
- **Cor:** #5D6D9E
- **Tipo:** Abissal
- **Regiões:** abismo-das-profundezas
- **Descrição:** O mal latente sob a crosta: entidades amorfas numa dimensão corrosiva que ninguém jamais visitou e voltou para descrever.

## RACA: 12_Magos | Magos
- **Cor:** #16A085
- **Tipo:** Territorial
- **Regiões:** torres-arcanas
- **Descrição:** Catalogadores da mana em cidadelas-torre sobre o Vetusto; desconfiam da tecnologia arcana dos Observadores — magia sem fonte é feitiçaria mentirosa.

## RACA: 13_Deuses | Deuses
- **Cor:** #F39C12
- **Tipo:** Divina
- **Regiões:** retorno-dos-deuses
- **Descrição:** O Panteão Ressurrecto, de volta em carruagens de fogo não por milagre, mas por contingência: a barreira está se rompendo.

## RACA: 14_Demonios_Do_Caos | Demônios do Caos
- **Cor:** #E67E22
- **Tipo:** Parasita
- **Regiões:** mascaras-na-nevoa
- **Descrição:** Bufões da primeira invasão, alimentam-se de conflito e desespero; ELES NÃO QUEREM A PAZ — guerra é colheita.

## RACA: 15_Os_Aspectos | Os Aspectos
- **Cor:** #9B59B6
- **Tipo:** Conceitual
- **Regiões:** aspectos-em-marcha
- **Descrição:** Guardiões conceituais em armaduras lendárias que selaram a grande fenda ancestral; seu retorno é o maior indicativo de tragédia iminente.

## RACA: 16_Alvamortos | Alvamortos
- **Cor:** #BDC3C7
- **Tipo:** Territorial
- **Regiões:** necropoles-silenciosas
- **Descrição:** MONGES SEPULCRAIS das necrópoles de mármore e obsidiana flutuante; herdeiros diretos da técnica de manipulação de almas dos Observadores.

## RACA: 17_Meio_Sangue | Meio-Sangue
- **Cor:** #D35400
- **Tipo:** Territorial
- **Regiões:** florestas-espirituais
- **Descrição:** Linhagens mistas das florestas de mana; sentem o pulso do planeta primeiro — e pagam o preço de estar na frente.

## RACA: 18_Canibais | Canibais
- **Cor:** #A04000
- **Tipo:** Territorial
- **Regiões:** fronteiras-de-magma
- **Descrição:** Tribos de múltiplos braços das arenas de sacrifício; a única lei que reconhecem é a sobrevivência do mais forte.

## RACA: 19_Barbaros | Bárbaros
- **Cor:** #CA6F1E
- **Tipo:** Territorial
- **Regiões:** cumes-da-tempestade
- **Descrição:** Clãs nômades das Montanhas de Dente de Dragão, armados com as espadas elementais que os Observadores lhes deram — e que aprenderam a odiar.

## RACA: 20_Amaldiçoados | Amaldiçoados
- **Cor:** #5D6D7E
- **Tipo:** Territorial
- **Regiões:** ruinas-do-voto-partido
- **Descrição:** Monges e guerreiros marcados por votos impossíveis; peregrinam entre ruínas reforçando selos menores contra o Vazio.

## RACA: 21_Demonios_Akuma-Gani | Demônios Akuma-Gani
- **Cor:** #DC143C
- **Tipo:** Territorial
- **Regiões:** terras-vermelhas
- **Descrição:** Onze fragmentos da vontade do soberano Imu, selado — cada cidadela vulcânica é um domínio dessa vontade partida, forjando guerra eterna.

## RACA: 22_Bersek | Bersek
- **Cor:** #8B0000
- **Tipo:** Nômade
- **Regiões:** cumes-da-tempestade
- **Descrição:** Guerreiros moldados pela guerra, pela raiva e por juramentos quebrados — gladiadores, cavaleiros amaldiçoados e fúrias forjadas da própria violência. Vagam pelos campos de batalha abandonados, sem pátria e sem senhor, movidos apenas pela próxima luta.

# PARTE V: RITUAIS ANCESTRAIS (W7+W8)

> Cada ritual é uma estrofe única invocada por uma raça no `Mapa_Aetheria.html` ao abrir
> a pílula correspondente. `Raça` deve bater com o `id` de uma `RACA` acima.

## RITUAL: rt-demon-pacto | Pacto Rubro
- **Raça:** 05_Demonios
- **Título:** Pacto Rubro
- **Estrofe:** Pelos sete pilares eu juro: meu sangue, minha chama, minha palavra. Tomo o que me deve e devolvo o que me toma. Que a voz do pacto me siga até onde nem a noite alcança.
- **Duração (ms):** 3800
- **Estilo:** pacto
- **Ícone:** 🔥

## RITUAL: rt-demon-massacre | Massacre Inominável
- **Raça:** 05_Demonios
- **Título:** Massacre Inominável
- **Estrofe:** Que o silêncio reine. Que o último grito seja meu. Eu não perdoo — eu permito que o outro exista enquanto me pertence.
- **Duração (ms):** 4200
- **Estilo:** massacre
- **Ícone:** ⚔

## RITUAL: rt-demon-ressurreicao | Ressurreição Púrpura
- **Raça:** 05_Demonios
- **Título:** Ressurreição Púrpura
- **Estrofe:** O que a terra engole, o sangue devolve. O que a cinza esquece, a chama nomeia. Levanta, que o senhor não te permite partir.
- **Duração (ms):** 4000
- **Estilo:** ressurreicao
- **Ícone:** ✦

## RITUAL: rt-oni-devoracao | Devoração Vermelha
- **Raça:** 04_Onis
- **Título:** Devoração Vermelha
- **Estrofe:** Açoito o ar, parto o ferro, trago a presa. O que a forja cospe, a forja engole. Pelo sangue de meus pais, a fome me basta.
- **Duração (ms):** 3600
- **Estilo:** devoracao
- **Ícone:** 🩸

## RITUAL: rt-oni-honra | Honra Ancestral
- **Raça:** 04_Onis
- **Título:** Honra Ancestral
- **Estrofe:** Ajoelho diante dos meus. Ergo-me diante dos meus. Entre o primeiro e o último suspiro, mantenho o nome limpo e a lâmina inteira.
- **Duração (ms):** 4000
- **Estilo:** honra
- **Ícone:** ⚜

## RITUAL: rt-hum-selo | Selo da Forja
- **Raça:** 01_Humanos
- **Título:** Selo da Forja
- **Estrofe:** Pela bigorna, pela lâmina, pelo nome que assino. Tudo o que foi forjado aqui resiste. Tudo o que jurou, permanece.
- **Duração (ms):** 3600
- **Estilo:** selo
- **Ícone:** ⚒

## RITUAL: rt-semi-raio | Raio Ascendente
- **Raça:** 09_Semi_Deuses
- **Título:** Raio Ascendente
- **Estrofe:** Não me peças mansidão. Carrego o trovão no peito e a semente no sangue. Onde eu piso, a centelha acorda; onde eu olho, o céu responde.
- **Duração (ms):** 3200
- **Estilo:** raio
- **Ícone:** ⚡

## RITUAL: rt-deus-flash | Clarão Divino
- **Raça:** 13_Deuses
- **Título:** Clarão Divino
- **Estrofe:** Que a luz revele o que a noite escondeu. Que a noite engula o que a luz não soube absolver. A verdade não se escolhe — se permite.
- **Duração (ms):** 2400
- **Estilo:** flash
- **Ícone:** ☀

## RITUAL: rt-monstro-mandibula | Mandíbula que se Abre
- **Raça:** 08_Monstros
- **Título:** Mandíbula que se Abre
- **Estrofe:** A trilha se cala. O vento recua. O que eu mordo não se levanta, o que eu engole não se nomeia. Devoro, logo existo.
- **Duração (ms):** 3500
- **Estilo:** mandibula
- **Ícone:** 🦷

## RITUAL: rt-meio-fusao | Fusão de Linhagens
- **Raça:** 17_Meio_Sangue
- **Título:** Fusão de Linhagens
- **Estrofe:** O sangue lembra o que a boca esquece. Herdei a ira do lobo e a promessa do homem. Sou a ponte, sou a fenda, sou o justo-meio que sangra dos dois lados.
- **Duração (ms):** 3400
- **Estilo:** fusao
- **Ícone:** ☯

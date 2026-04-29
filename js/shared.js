const SUPABASE_URL='https://shhtdamjxoxxxsyeqhhi.supabase.co';
const SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaHRkYW1qeG94eHhzeWVxaGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzQ1OTIsImV4cCI6MjA5MjkxMDU5Mn0.9ZWxZszdUZbZppsk2VNzxzj1jJtB3soyBrswRUFdaIk';
const TOTAL_CHAPTERS=1189,AT_CHAPTERS=929,NT_CHAPTERS=260,TOTAL_WEEKS=87;

const BOOKS = [
  ["Gênesis",50,"AT",1,"No princípio, criou Deus os céus e a terra.","Gênesis 1:1"],
  ["Êxodo",40,"AT",51,"Eu sou o que sou.","Êxodo 3:14"],
  ["Levítico",27,"AT",91,"Sede santos, porque eu, o Senhor vosso Deus, sou santo.","Levítico 19:2"],
  ["Números",36,"AT",118,"O Senhor te abençoe e te guarde.","Números 6:24"],
  ["Deuteronômio",34,"AT",154,"Amarás o Senhor teu Deus de todo o teu coração.","Deuteronômio 6:5"],
  ["Josué",24,"AT",188,"Escolhei hoje a quem sirveis.","Josué 24:15"],
  ["Juízes",21,"AT",212,"Naqueles dias não havia rei em Israel; cada um fazia o que parecia reto aos seus olhos.","Juízes 21:25"],
  ["Rute",4,"AT",233,"Onde tu morreres, morrerei eu.","Rute 1:17"],
  ["1 Samuel",31,"AT",237,"O homem olha para a aparência exterior, mas o Senhor olha para o coração.","1 Samuel 16:7"],
  ["2 Samuel",24,"AT",268,"Teu amor por mim era maravilhoso, superior ao amor das mulheres.","2 Samuel 1:26"],
  ["1 Reis",22,"AT",292,"O Senhor é Deus; o Senhor é Deus!","1 Reis 18:39"],
  ["2 Reis",25,"AT",314,"Não vos faltou coisa alguma de tudo o que disse.","2 Reis 10:10"],
  ["1 Crônicas",29,"AT",339,"Vosso é, Senhor, a grandeza, o poder, a glória, a vitória e a majestade.","1 Crônicas 29:11"],
  ["2 Crônicas",36,"AT",368,"Se o meu povo, que se chama pelo meu nome, se humilhar e orar...","2 Crônicas 7:14"],
  ["Esdras",10,"AT",404,"A mão bondosa do seu Deus estava sobre ele.","Esdras 7:9"],
  ["Neemias",13,"AT",414,"A alegria do Senhor é a nossa força.","Neemias 8:10"],
  ["Ester",10,"AT",427,"Quem sabe se não foi para um momento como este que chegaste ao reino?","Ester 4:14"],
  ["Jó",42,"AT",437,"O Senhor o deu, o Senhor o tomou; bendito seja o nome do Senhor.","Jó 1:21"],
  ["Salmos",150,"AT",479,"O Senhor é o meu pastor; nada me faltará.","Salmos 23:1"],
  ["Provérbios",31,"AT",629,"Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.","Provérbios 3:5"],
  ["Eclesiastes",12,"AT",660,"O fim de tudo o que se ouviu é este: teme a Deus e guarda os seus mandamentos.","Eclesiastes 12:13"],
  ["Cantares",8,"AT",672,"Forte como a morte é o amor.","Cantares 8:6"],
  ["Isaías",66,"AT",680,"Mas os que esperam no Senhor renovarão as suas forças.","Isaías 40:31"],
  ["Jeremias",52,"AT",746,"Porque eu bem sei os planos que tenho para vós, diz o Senhor.","Jeremias 29:11"],
  ["Lamentações",5,"AT",798,"As misericórdias do Senhor não têm fim; as suas compaixões não se esgotam.","Lamentações 3:22"],
  ["Ezequiel",48,"AT",803,"Eu vos darei um coração novo e porei dentro de vós um espírito novo.","Ezequiel 36:26"],
  ["Daniel",12,"AT",851,"Os entendidos resplandecerão como o fulgor do firmamento.","Daniel 12:3"],
  ["Oséias",14,"AT",863,"Meu povo perece por falta de conhecimento.","Oséias 4:6"],
  ["Joel",3,"AT",877,"Derramarei o meu Espírito sobre toda a carne.","Joel 2:28"],
  ["Amós",9,"AT",880,"Corra o direito como as águas, e a justiça como ribeiro perene.","Amós 5:24"],
  ["Obadias",1,"AT",889,"Como procedeste, assim se fará contigo.","Obadias 1:15"],
  ["Jonas",4,"AT",890,"A salvação pertence ao Senhor.","Jonas 2:9"],
  ["Miquéias",7,"AT",894,"Fazer justiça, amar a misericórdia e andar humildemente com o teu Deus.","Miquéias 6:8"],
  ["Naum",3,"AT",901,"O Senhor é bom, uma fortaleza no dia da angústia.","Naum 1:7"],
  ["Habacuque",3,"AT",904,"O justo viverá pela sua fé.","Habacuque 2:4"],
  ["Sofonias",3,"AT",907,"O Senhor teu Deus está no meio de ti como herói que salva.","Sofonias 3:17"],
  ["Ageu",2,"AT",910,"A glória futura desta casa será maior do que a da anterior.","Ageu 2:9"],
  ["Zacarias",14,"AT",912,"Não por força nem por poder, mas pelo meu Espírito, diz o Senhor.","Zacarias 4:6"],
  ["Malaquias",4,"AT",926,"Para vós outros que temeis o meu nome, nascerá o sol da justiça.","Malaquias 4:2"],
  ["Mateus",28,"NT",930,"Ide, portanto, e fazei discípulos de todas as nações.","Mateus 28:19"],
  ["Marcos",16,"NT",958,"O Filho do homem não veio para ser servido, mas para servir.","Marcos 10:45"],
  ["Lucas",24,"NT",974,"O Filho do homem veio buscar e salvar o perdido.","Lucas 19:10"],
  ["João",21,"NT",998,"Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.","João 3:16"],
  ["Atos",28,"NT",1019,"Recebereis poder, ao descer sobre vós o Espírito Santo.","Atos 1:8"],
  ["Romanos",16,"NT",1047,"Tudo concorre para o bem daqueles que amam a Deus.","Romanos 8:28"],
  ["1 Coríntios",16,"NT",1063,"O amor nunca falha.","1 Coríntios 13:8"],
  ["2 Coríntios",13,"NT",1079,"A minha graça te basta, porque o poder se aperfeiçoa na fraqueza.","2 Coríntios 12:9"],
  ["Gálatas",6,"NT",1092,"Já não sou eu quem vive, mas Cristo vive em mim.","Gálatas 2:20"],
  ["Efésios",6,"NT",1098,"Sede fortes no Senhor e na força do seu poder.","Efésios 6:10"],
  ["Filipenses",4,"NT",1104,"Tudo posso naquele que me fortalece.","Filipenses 4:13"],
  ["Colossenses",4,"NT",1108,"Cristo em vós, a esperança da glória.","Colossenses 1:27"],
  ["1 Tessalonicenses",5,"NT",1112,"Regozijai-vos sempre. Orai sem cessar. Em tudo dai graças.","1 Tessalonicenses 5:16-18"],
  ["2 Tessalonicenses",3,"NT",1117,"O próprio Senhor da paz vos dê paz em toda a circunstância.","2 Tessalonicenses 3:16"],
  ["1 Timóteo",6,"NT",1120,"Não te envergonhes do testemunho do nosso Senhor.","2 Timóteo 1:8"],
  ["2 Timóteo",4,"NT",1126,"Combati o bom combate, terminei a corrida, guardei a fé.","2 Timóteo 4:7"],
  ["Tito",3,"NT",1130,"A graça de Deus se manifestou para a salvação de todos os homens.","Tito 2:11"],
  ["Filemom",1,"NT",1133,"Talvez ele se tenha apartado por um momento para que o recebesses para sempre.","Filemom 1:15"],
  ["Hebreus",13,"NT",1134,"A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.","Hebreus 11:1"],
  ["Tiago",5,"NT",1147,"A fé sem obras é morta.","Tiago 2:26"],
  ["1 Pedro",5,"NT",1152,"Lançai sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.","1 Pedro 5:7"],
  ["2 Pedro",3,"NT",1157,"O Senhor não retarda a sua promessa, como alguns a julgam demorada.","2 Pedro 3:9"],
  ["1 João",5,"NT",1160,"Deus é amor.","1 João 4:8"],
  ["2 João",1,"NT",1165,"Quem persevera na doutrina de Cristo, esse tem o Pai e o Filho.","2 João 1:9"],
  ["3 João",1,"NT",1166,"Amado, ora eu desejo que te vá bem em tudo.","3 João 1:2"],
  ["Judas",1,"NT",1167,"Àquele que é poderoso para vos guardar de tropeçar...","Judas 1:24"],
  ["Apocalipse",22,"NT",1168,"Eis que venho sem demora, e comigo está o meu galardão.","Apocalipse 22:12"]
];
const WEEKS_INDEX = [
  { num:1, ds:new Date(2026,3,27), de:new Date(2026,4,3), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:2, ds:new Date(2026,4,4), de:new Date(2026,4,10), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:3, ds:new Date(2026,4,11), de:new Date(2026,4,17), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:4, ds:new Date(2026,4,18), de:new Date(2026,4,24), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:5, ds:new Date(2026,4,25), de:new Date(2026,4,31), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:6, ds:new Date(2026,5,1), de:new Date(2026,5,7), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:7, ds:new Date(2026,5,8), de:new Date(2026,5,14), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:8, ds:new Date(2026,5,15), de:new Date(2026,5,21), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:9, ds:new Date(2026,5,22), de:new Date(2026,5,28), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:10, ds:new Date(2026,5,29), de:new Date(2026,6,5), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:11, ds:new Date(2026,6,6), de:new Date(2026,6,12), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:12, ds:new Date(2026,6,13), de:new Date(2026,6,19), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:13, ds:new Date(2026,6,20), de:new Date(2026,6,26), block:"Pentateuco", hasContent:false, range:"Bloco: Pentateuco" },
  { num:14, ds:new Date(2026,6,27), de:new Date(2026,7,2), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:15, ds:new Date(2026,7,3), de:new Date(2026,7,9), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:16, ds:new Date(2026,7,10), de:new Date(2026,7,16), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:17, ds:new Date(2026,7,17), de:new Date(2026,7,23), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:18, ds:new Date(2026,7,24), de:new Date(2026,7,30), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:19, ds:new Date(2026,7,31), de:new Date(2026,8,6), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:20, ds:new Date(2026,8,7), de:new Date(2026,8,13), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:21, ds:new Date(2026,8,14), de:new Date(2026,8,20), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:22, ds:new Date(2026,8,21), de:new Date(2026,8,27), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:23, ds:new Date(2026,8,28), de:new Date(2026,9,4), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:24, ds:new Date(2026,9,5), de:new Date(2026,9,11), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:25, ds:new Date(2026,9,12), de:new Date(2026,9,18), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:26, ds:new Date(2026,9,19), de:new Date(2026,9,25), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:27, ds:new Date(2026,9,26), de:new Date(2026,10,1), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:28, ds:new Date(2026,10,2), de:new Date(2026,10,8), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:29, ds:new Date(2026,10,9), de:new Date(2026,10,15), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:30, ds:new Date(2026,10,16), de:new Date(2026,10,22), block:"Históricos AT", hasContent:false, range:"Bloco: Históricos AT" },
  { num:31, ds:new Date(2026,10,23), de:new Date(2026,10,29), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:32, ds:new Date(2026,10,30), de:new Date(2026,11,6), block:"Poéticos", hasContent:true, range:"Daniel 7 – Daniel 12" },
  { num:33, ds:new Date(2026,11,7), de:new Date(2026,11,13), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:34, ds:new Date(2026,11,14), de:new Date(2026,11,20), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:35, ds:new Date(2026,11,21), de:new Date(2026,11,27), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:36, ds:new Date(2026,11,28), de:new Date(2027,0,3), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:37, ds:new Date(2027,0,4), de:new Date(2027,0,10), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:38, ds:new Date(2027,0,11), de:new Date(2027,0,17), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:39, ds:new Date(2027,0,18), de:new Date(2027,0,24), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:40, ds:new Date(2027,0,25), de:new Date(2027,0,31), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:41, ds:new Date(2027,1,1), de:new Date(2027,1,7), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:42, ds:new Date(2027,1,8), de:new Date(2027,1,14), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:43, ds:new Date(2027,1,15), de:new Date(2027,1,21), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:44, ds:new Date(2027,1,22), de:new Date(2027,1,28), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:45, ds:new Date(2027,2,1), de:new Date(2027,2,7), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:46, ds:new Date(2027,2,8), de:new Date(2027,2,14), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:47, ds:new Date(2027,2,15), de:new Date(2027,2,21), block:"Poéticos", hasContent:false, range:"Bloco: Poéticos" },
  { num:48, ds:new Date(2027,2,22), de:new Date(2027,2,28), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:49, ds:new Date(2027,2,29), de:new Date(2027,3,4), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:50, ds:new Date(2027,3,5), de:new Date(2027,3,11), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:51, ds:new Date(2027,3,12), de:new Date(2027,3,18), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:52, ds:new Date(2027,3,19), de:new Date(2027,3,25), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:53, ds:new Date(2027,3,26), de:new Date(2027,4,2), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:54, ds:new Date(2027,4,3), de:new Date(2027,4,9), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:55, ds:new Date(2027,4,10), de:new Date(2027,4,16), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:56, ds:new Date(2027,4,17), de:new Date(2027,4,23), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:57, ds:new Date(2027,4,24), de:new Date(2027,4,30), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:58, ds:new Date(2027,4,31), de:new Date(2027,5,6), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:59, ds:new Date(2027,5,7), de:new Date(2027,5,13), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:60, ds:new Date(2027,5,14), de:new Date(2027,5,20), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:61, ds:new Date(2027,5,21), de:new Date(2027,5,27), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:62, ds:new Date(2027,5,28), de:new Date(2027,6,4), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:63, ds:new Date(2027,6,5), de:new Date(2027,6,11), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:64, ds:new Date(2027,6,12), de:new Date(2027,6,18), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:65, ds:new Date(2027,6,19), de:new Date(2027,6,25), block:"Proféticos AT", hasContent:false, range:"Bloco: Proféticos AT" },
  { num:66, ds:new Date(2027,6,26), de:new Date(2027,7,1), block:"Evangelhos + Atos", hasContent:false, range:"Bloco: Evangelhos + Atos" },
  { num:67, ds:new Date(2027,7,2), de:new Date(2027,7,8), block:"Evangelhos + Atos", hasContent:false, range:"Bloco: Evangelhos + Atos" },
  { num:68, ds:new Date(2027,7,9), de:new Date(2027,7,15), block:"Evangelhos + Atos", hasContent:false, range:"Bloco: Evangelhos + Atos" },
  { num:69, ds:new Date(2027,7,16), de:new Date(2027,7,22), block:"Evangelhos + Atos", hasContent:false, range:"Bloco: Evangelhos + Atos" },
  { num:70, ds:new Date(2027,7,23), de:new Date(2027,7,29), block:"Evangelhos + Atos", hasContent:false, range:"Bloco: Evangelhos + Atos" },
  { num:71, ds:new Date(2027,7,30), de:new Date(2027,8,5), block:"Evangelhos + Atos", hasContent:false, range:"Bloco: Evangelhos + Atos" },
  { num:72, ds:new Date(2027,8,6), de:new Date(2027,8,12), block:"Evangelhos + Atos", hasContent:false, range:"Bloco: Evangelhos + Atos" },
  { num:73, ds:new Date(2027,8,13), de:new Date(2027,8,19), block:"Evangelhos + Atos", hasContent:false, range:"Bloco: Evangelhos + Atos" },
  { num:74, ds:new Date(2027,8,20), de:new Date(2027,8,26), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:75, ds:new Date(2027,8,27), de:new Date(2027,9,3), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:76, ds:new Date(2027,9,4), de:new Date(2027,9,10), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:77, ds:new Date(2027,9,11), de:new Date(2027,9,17), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:78, ds:new Date(2027,9,18), de:new Date(2027,9,24), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:79, ds:new Date(2027,9,25), de:new Date(2027,9,31), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:80, ds:new Date(2027,10,1), de:new Date(2027,10,7), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:81, ds:new Date(2027,10,8), de:new Date(2027,10,14), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:82, ds:new Date(2027,10,15), de:new Date(2027,10,21), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:83, ds:new Date(2027,10,22), de:new Date(2027,10,28), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:84, ds:new Date(2027,10,29), de:new Date(2027,11,5), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:85, ds:new Date(2027,11,6), de:new Date(2027,11,12), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:86, ds:new Date(2027,11,13), de:new Date(2027,11,19), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" },
  { num:87, ds:new Date(2027,11,20), de:new Date(2027,11,26), block:"Epístolas + Ap", hasContent:false, range:"Bloco: Epístolas + Ap" }
];

function getBook(n){for(let i=BOOKS.length-1;i>=0;i--)if(n>=BOOKS[i][3])return BOOKS[i];return BOOKS[0];}
function atPct(n){return Math.min(100,Math.round(Math.max(0,n-1)/AT_CHAPTERS*100));}
function ntPct(n){if(n<930)return 0;return Math.min(100,Math.round((n-930)/NT_CHAPTERS*100));}

function fmtD(d){return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});}
function fmtDFull(d){return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});}
function isToday(d){return d.toDateString()===new Date().toDateString();}
function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function toast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400);}

let ST={completedDays:{},completedComplements:{},currentWeek:32,weekCompletionHistory:{}};
let NT_NOTES={};
let UID=null;
function getUID(){return UID;}

function nextSunday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  if (day !== 0) {
    d.setDate(d.getDate() + (7 - day));
  }
  return d;
}

function calculateWeekDates() {
  if (!ST.planStartDate) return null;
  const dates = {};
  
  let currentStart = nextSunday(new Date(ST.planStartDate));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!ST.weekCompletionHistory) ST.weekCompletionHistory = {};

  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const dStart = new Date(currentStart);
    const dEnd = new Date(currentStart);
    dEnd.setDate(dEnd.getDate() + 6);
    
    let delayed = false;
    if (w === ST.currentWeek) {
      const isDay0Marked = !!ST.completedDays[w + '-0'];
      if (!isDay0Marked && today > dStart) {
        delayed = true;
      }
    }
    
    dates[w] = { dateStart: dStart, dateEnd: dEnd, delayed: delayed };
    
    if (ST.weekCompletionHistory[w]) {
       let compDate = ST.weekCompletionHistory[w].completedAt || ST.weekCompletionHistory[w];
       currentStart = nextSunday(new Date(compDate));
    } else {
       currentStart = new Date(currentStart);
       currentStart.setDate(currentStart.getDate() + 7);
    }
  }
  return dates;
}

function checkWeekCompletion(wn) {
  let daysCompleted = 0;
  for (let i = 0; i < 6; i++) {
    if (ST.completedDays[wn + '-' + i]) daysCompleted++;
  }
  const compCompleted = !!ST.completedComplements[wn];
  const isCompleted = (daysCompleted === 6 && compCompleted);
  
  if (!ST.weekCompletionHistory) ST.weekCompletionHistory = {};
  
  if (isCompleted && !ST.weekCompletionHistory[wn]) {
    const weekDates = calculateWeekDates();
    let daysElapsed = 0;
    let wasDelayed = false;
    if (weekDates && weekDates[wn]) {
      daysElapsed = Math.round((new Date() - new Date(weekDates[wn].dateStart)) / 86400000);
      wasDelayed = weekDates[wn].delayed;
    }
    ST.weekCompletionHistory[wn] = {
      completedAt: new Date().toISOString(),
      daysElapsed: daysElapsed,
      wasDelayed: wasDelayed
    };
  } else if (!isCompleted && ST.weekCompletionHistory[wn]) {
    delete ST.weekCompletionHistory[wn];
  }
}


function renderPH(wk){
  const tot=Object.values(ST.completedDays).filter(Boolean).length;
  const wkd=Object.keys(ST.completedComplements).filter(k=>ST.completedComplements[k]).length;
  const ch=Math.min(tot,TOTAL_CHAPTERS);
  const pct=Math.round(ch/TOTAL_CHAPTERS*100);
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  const setW=(id,v)=>{const e=document.getElementById(id);if(e){e.style.width=v+'%';if(e.getAttribute('role')==='progressbar')e.setAttribute('aria-valuenow',Math.round(v));}};
  
  setW('pfil',pct);set('ppct',pct+'%');
  set('swk',wkd+' / '+TOTAL_WEEKS);
  set('sch',ch+' / '+TOTAL_CHAPTERS);
  set('sst',tot);

  let atCompleted = 0;
  let ntCompleted = 0;
  if (ST.completedDays) {
    Object.keys(ST.completedDays).forEach(key => {
      if (!ST.completedDays[key]) return;
      const parts = key.split('-');
      const s = parseInt(parts[0]);
      const d = parseInt(parts[1]);
      let chNum = null;
      if (typeof WEEKS_DATA !== 'undefined' && WEEKS_DATA[s]) {
        const wd = WEEKS_DATA[s];
        if (wd.days && wd.days[d] && wd.days[d].reading) {
          const reading = wd.days[d].reading;
          const bk = BOOKS.find(b => reading.startsWith(b[0]));
          if (bk) {
            const rest = reading.substring(bk[0].length).trim();
            const match = rest.match(/\d+/);
            if (match) chNum = bk[3] + parseInt(match[0]) - 1;
            else chNum = bk[3];
          }
        }
        if (chNum === null && wd.chaptersStart !== undefined) {
          chNum = wd.chaptersStart + d;
          if (wd.chaptersEnd !== undefined) chNum = Math.min(wd.chaptersEnd, chNum);
        }
      }
      if (chNum === null && typeof WEEKS_INDEX !== 'undefined') {
        const wi = WEEKS_INDEX.find(w => w.num === s);
        if (wi && wi.chaptersStart !== undefined) {
          chNum = wi.chaptersStart + d;
          if (wi.chaptersEnd !== undefined) chNum = Math.min(wi.chaptersEnd, chNum);
        }
      }
      if (chNum !== null) {
        const book = getBook(chNum);
        if (book[2] === "AT") atCompleted++;
        else if (book[2] === "NT") ntCompleted++;
      } else {
        if (s >= 66) ntCompleted++;
        else atCompleted++;
      }
    });
  }
  const patVal = Math.min(100, Math.round(atCompleted / AT_CHAPTERS * 100));
  const pntVal = Math.min(100, Math.round(ntCompleted / NT_CHAPTERS * 100));
  const patWidth = Math.min(100, atCompleted / AT_CHAPTERS * 100);
  const pntWidth = Math.min(100, ntCompleted / NT_CHAPTERS * 100);
  setW('bat', patWidth); set('pat', patVal + '%');
  setW('bnt', pntWidth); set('pnt', pntVal + '%');

  if(wk!==undefined&&typeof WEEKS_DATA!=='undefined'){
    const wd=WEEKS_DATA[wk];
    if(wd){
      const bk=getBook(wd.chaptersStart);
      let bkCh=0;
      Object.keys(ST.completedDays).forEach(key=>{
        if(!ST.completedDays[key])return;
        const wn=parseInt(key.split('-')[0]);
        const d2=WEEKS_DATA[wn];if(!d2)return;
        if(getBook(d2.chaptersStart)[3]===bk[3])bkCh++;
      });
      const bp=Math.min(100,Math.round(bkCh/bk[1]*100));
      setW('bbk',bp);set('pbk',bp+'%');set('lbk',bk[0]);
      set('bbdg',bk[0].toUpperCase());
      set('bvt',bk[4]?'"'+bk[4]+'"':' ');
      set('bvr',bk[5]||'');
    }
  }
}

function setupNav(){
  document.querySelectorAll('[data-nav]').forEach(b=>{b.onclick=()=>window.location.href=b.dataset.nav;});
  const lo=document.getElementById('btnLogout');if(lo)lo.onclick=doLogout;
}

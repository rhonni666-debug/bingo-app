import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- PERSISTÊNCIA EM DISCO DO ADMIN ---
const ADMIN_DATA_FILE = './admin_data.json';
let historicoSaques = [];
let historicoEntradas = [];

try {
  if (fs.existsSync(ADMIN_DATA_FILE)) {
    const raw = fs.readFileSync(ADMIN_DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    historicoSaques = parsed.saques || [];
    historicoEntradas = parsed.entradas || [];
  }
} catch (e) {
  console.error("Aviso ao carregar admin_data.json:", e);
}

function salvarDadosAdmin() {
  try {
    fs.writeFileSync(ADMIN_DATA_FILE, JSON.stringify({
      saques: historicoSaques,
      entradas: historicoEntradas
    }, null, 2));
  } catch (e) {
    console.error("Erro ao salvar admin_data.json:", e);
  }
}
// --------------------------------------

const REAL_PLAYERS_POOL = [
  'MARFM69', 'Edvardo', 'KEKEL', 'ALESANTANA72', 'EUSOUASORTE',
  'CTCSU', 'JOAO_BR', 'LUCKY_77', 'TIZIL', 'gaviao78', 'Zilma',
  'Lú', 'S20ATIVADO', 'TÂNIA', 'NENE1410', 'Bugdoidao', 'RENATA',
  'Lula22', 'abertojose25@gmail.com', 'finindatarde', '244Nike',
  'vidarasa22', 'Ronyn', 'vanessalopes','paulinhalanches',
  'gabisantos','mariaaurora','Odetesilva','Norapacheco','eduardolopes','Creuzamaria',
  'anabeatriz','jose-carlos','Trumpmeuovo','Geo286','anapaula64@gmail.com',
  'Verdaodamasssa','TropadoMengao','Merendiel','gingartcapoeira','Tudo2','AndrewCocao','Redbull26',
  'Novin7','Peixaria26','tropadomantem','esquinada19','pedroIvo55','nonato','jabingeui','Ginde10',
  'Windows98','Penha2687','Queixotatto','linsducorte','ElderMecanico','gbsilva','biaMorenana','22737373',
];

function generateCard90(todasCartelasExistentes = []) {
  const isCartelaRepetida = (novaCartela) => {
    const novaStr = novaCartela.sort((a, b) => a - b).join(',');
    return todasCartelasExistentes.some(c => c.join(',') === novaStr);
  };
  let nums = [];
  let tentativas = 0;
  do {
    nums = [];
    while (nums.length < 15) {
      const r = Math.floor(Math.random() * 90) + 1;
      if (!nums.includes(r)) nums.push(r);
    }
    nums.sort((a, b) => a - b);
    tentativas++;
  } while (isCartelaRepetida(nums) && tentativas < 100);
  return nums;
}

let cartelasAtivasPorSorteio = {};

let estadoGlobal = {
  gameState: 'WAITING',
  timeRemaining: 180,
  sorteioNum: Math.floor(100000 + Math.random() * 900000),
  sorteioHoraInicio: 'Sincronizando...',
  drawnNumbers: [],
  pedraAtual: null,
  totalCartelasVendidas: 0,
  botCards: [], // NOVO: Servidor agora guarda os bots
  precoPorCartela: 0.40,
  premios: {
    kuadra: 15.00,
    kina: 15.00,
    keno: 40.00,
    acumulado: 100.00,
    bolaAcumulado: 0
  }
};

function formatTargetDateTime() {
  const date = new Date(Date.now() + estadoGlobal.timeRemaining * 1000);
  const dataStr = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
  const horaStr = date.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  return `${dataStr}-${horaStr}`;
}
estadoGlobal.sorteioHoraInicio = formatTargetDateTime();

let drawLoop = null;
let resetTimeout = null;
let sorteioPausado = false;
let timeoutPausa = null;

function resetarParaLobby() {
  if (drawLoop) clearInterval(drawLoop);
  if (resetTimeout) clearTimeout(resetTimeout);
  if (timeoutPausa) clearTimeout(timeoutPausa);
  drawLoop = null;
  resetTimeout = null;
  timeoutPausa = null;
  sorteioPausado = false;

  delete cartelasAtivasPorSorteio[estadoGlobal.sorteioNum];

  estadoGlobal.gameState = 'WAITING';
  estadoGlobal.timeRemaining = 180;
  estadoGlobal.drawnNumbers = [];
  estadoGlobal.pedraAtual = null;
  estadoGlobal.botCards = []; // Limpa os bots para a proxima rodada
  estadoGlobal.sorteioNum = Math.floor(100000 + Math.random() * 900000);
  estadoGlobal.sorteioHoraInicio = formatTargetDateTime();
  estadoGlobal.premios.kuadra = 15.00;
  estadoGlobal.premios.kina = 15.00;
  estadoGlobal.premios.keno = 40.00;
  estadoGlobal.totalCartelasVendidas = 0;
  
  io.emit('estado-jogo', estadoGlobal);
}

function encerrarPartidaPorBingo() {
  if (drawLoop) {
    clearInterval(drawLoop);
    drawLoop = null;
  }
  if (timeoutPausa) clearTimeout(timeoutPausa);
  sorteioPausado = false;
  
  if (!resetTimeout) {
    resetTimeout = setTimeout(() => {
      resetarParaLobby();
    }, 17000);
  }
}

function iniciarSorteioCentral() {
  if (drawLoop) clearInterval(drawLoop);
  if (resetTimeout) clearTimeout(resetTimeout);
  if (timeoutPausa) clearTimeout(timeoutPausa);
  resetTimeout = null;
  timeoutPausa = null;
  sorteioPausado = false;

  estadoGlobal.gameState = 'DRAWING';
  estadoGlobal.drawnNumbers = [];
  estadoGlobal.pedraAtual = null;

  // GERAÇÃO DOS BOTS CENTRALIZADA NO SERVIDOR
  const numBots = 18;
  const cartelasPorBot = 16;
  const precoCartelaBot = 0.15; 
  const valorGastoBots = numBots * cartelasPorBot * precoCartelaBot;

  let novasCartelasBots = [];
  let botBaseId = Math.floor(100 + Math.random() * 2000);
  const nomesEmbaralhados = [...REAL_PLAYERS_POOL].sort(() => 0.5 - Math.random());
  const botsEscolhidos = nomesEmbaralhados.slice(0, numBots);
  
  let allBotArrays = [];
  botsEscolhidos.forEach(nomeBot => {
    for (let i = 0; i < cartelasPorBot; i++) {
      const cartela = generateCard90(allBotArrays);
      allBotArrays.push(cartela); // Guarda para nao repetir entre bots
      novasCartelasBots.push({
        id: botBaseId++,
        player: nomeBot,
        numbers: cartela
      });
    }
  });
  
  estadoGlobal.botCards = novasCartelasBots; // Guarda no estado global para enviar a todos

  if (valorGastoBots > 0) {
    estadoGlobal.premios.keno = +(estadoGlobal.premios.keno + (valorGastoBots * 0.30)).toFixed(2);
    estadoGlobal.premios.kuadra = +(estadoGlobal.premios.kuadra + (valorGastoBots * 0.075)).toFixed(2);
    estadoGlobal.premios.kina = +(estadoGlobal.premios.kina + (valorGastoBots * 0.075)).toFixed(2);
    estadoGlobal.premios.acumulado = +(estadoGlobal.premios.acumulado + (valorGastoBots * 0.04)).toFixed(2);
    estadoGlobal.totalCartelasVendidas += (numBots * cartelasPorBot);
  }
  
  io.emit('estado-jogo', estadoGlobal);

  drawLoop = setInterval(() => {
    if (sorteioPausado) return;

    if (estadoGlobal.drawnNumbers.length >= 90) {
      if (drawLoop) clearInterval(drawLoop);
      drawLoop = null;
      resetTimeout = setTimeout(resetarParaLobby, 17000);
      return;
    }

    const disponiveis = Array.from({ length: 90 }, (_, i) => i + 1)
      .filter(n => !estadoGlobal.drawnNumbers.includes(n));

    const novaPedra = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    estadoGlobal.drawnNumbers.push(novaPedra);
    estadoGlobal.pedraAtual = novaPedra;

    io.emit('nova-pedra-central', {
      pedra: novaPedra,
      drawnNumbers: estadoGlobal.drawnNumbers
    });
  }, 3000);
}

setInterval(() => {
  if (estadoGlobal.gameState === 'WAITING') {
    if (estadoGlobal.timeRemaining > 0) {
      estadoGlobal.timeRemaining -= 1;
      io.emit('sync-timer', {
        timeRemaining: estadoGlobal.timeRemaining,
        sorteioHoraInicio: estadoGlobal.sorteioHoraInicio
      });
    } else {
      iniciarSorteioCentral();
    }
  }
}, 1000);

const MINHA_CHAVE_PIX = "df3aef5f-849d-4d25-ab7c-5ad65bddab29";

function emvField(id, value) {
  const str = String(value);
  const len = String(str.length).padStart(2, '0');
  return `${id}${len}${str}`;
}

function calcularCRC16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function gerarPixBancoCentral(chave, valor, txid = 'BINGO01') {
  const gui = emvField('00', 'br.gov.bcb.pix');
  const key = emvField('01', chave.trim());
  const merchantAccount = emvField('26', `${gui}${key}`);
  const additionalData = emvField('62', emvField('05', txid));

  const payloadSemCRC = [
    emvField('00', '01'),
    merchantAccount,
    emvField('52', '0000'),
    emvField('53', '986'),
    emvField('54', Number(valor).toFixed(2)),
    emvField('58', 'BR'),
    emvField('59', 'BOTECO DA SORTE'),
    emvField('60', 'SAO GONCALO'),
    additionalData,
    '6304'
  ].join('');

  return `${payloadSemCRC}${calcularCRC16(payloadSemCRC)}`;
}

app.post('/api/pix', async (req, res) => {
  try {
    const { amount, username } = req.body;
    const valorFinal = Number(amount || 10);
    const idLocal = `PIX${Date.now().toString().slice(-6)}`;
    const brCode = gerarPixBancoCentral(MINHA_CHAVE_PIX, valorFinal, idLocal);

    const novaEntrada = {
      id: idLocal,
      amount: valorFinal,
      user: username || 'Jogador',
      status: 'Gerado',
      hora: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
    };
    historicoEntradas.unshift(novaEntrada);
    if (historicoEntradas.length > 100) historicoEntradas.pop();
    salvarDadosAdmin();

    io.emit('admin-update', { saques: historicoSaques, entradas: historicoEntradas });

    return res.status(200).json({
      id: idLocal,
      status: 'pending',
      qrCode: brCode,
      qrCodeBase64: null
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

const tratarSolicitacaoSaque = (req, res) => {
  try {
    const { uid, nome, valor, tipoChave, chavePix } = req.body;

    if (!valor || !chavePix) {
      return res.status(400).json({ error: 'Dados incompletos para o saque.' });
    }

    const novoSaque = { 
      id: Date.now().toString(), 
      uid: uid || 'N/A', 
      nome: nome || 'Anônimo', 
      valor: Number(valor), 
      tipoChave: tipoChave || 'Chave PIX', 
      chavePix: String(chavePix).trim(), 
      hora: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }), 
      data: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      status: 'Pendente' 
    };

    historicoSaques.unshift(novoSaque);
    if (historicoSaques.length > 100) historicoSaques.pop();
    salvarDadosAdmin();

    io.emit('admin-update', { saques: historicoSaques, entradas: historicoEntradas });

    return res.status(200).json({
      success: true,
      message: 'Solicitação recebida com sucesso!'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao processar solicitação.' });
  }
};

app.post('/solicitar-saque', tratarSolicitacaoSaque);
app.post('/api/solicitar-saque', tratarSolicitacaoSaque);

io.on('connection', (socket) => {
  socket.emit('estado-jogo', estadoGlobal);

  socket.on('recuperar-minhas-cartelas', ({ uid, sorteioNum }) => {
    if (!uid || !sorteioNum) return;
    const cartelasDoJogo = cartelasAtivasPorSorteio[sorteioNum];
    if (cartelasDoJogo && cartelasDoJogo[uid]) {
      socket.emit('suas-cartelas-sincronizadas', {
        sorteioNum,
        cards: cartelasDoJogo[uid]
      });
    }
  });

  socket.on('pausar-sorteio-premio', () => {
    sorteioPausado = true;
    if (timeoutPausa) clearTimeout(timeoutPausa);
    timeoutPausa = setTimeout(() => {
      sorteioPausado = false;
    }, 6500);
  });

  socket.on('bingo-vencedor', () => {
    encerrarPartidaPorBingo();
  });

  socket.on('finalizar-sorteio', () => {
    encerrarPartidaPorBingo();
  });

  socket.on('reset-game', () => {
    resetarParaLobby();
  });

  socket.on('comprar-cartelas', (dados) => {
    const quantidade = Number(dados?.quantidade || 0);
    const valorGasto = Number(dados?.valorTotal || 0);
    const uid = dados?.uid;
    const sorteioNum = dados?.sorteioNum || estadoGlobal.sorteioNum;
    const newCards = Array.isArray(dados?.cards) ? dados.cards : [];

    if (uid && newCards.length > 0) {
      if (!cartelasAtivasPorSorteio[sorteioNum]) {
        cartelasAtivasPorSorteio[sorteioNum] = {};
      }
      if (!cartelasAtivasPorSorteio[sorteioNum][uid]) {
        cartelasAtivasPorSorteio[sorteioNum][uid] = [];
      }
      cartelasAtivasPorSorteio[sorteioNum][uid].push(...newCards);
    }

    if (valorGasto > 0) {
      estadoGlobal.premios.keno = +(estadoGlobal.premios.keno + (valorGasto * 0.30)).toFixed(2);
      estadoGlobal.premios.kuadra = +(estadoGlobal.premios.kuadra + (valorGasto * 0.075)).toFixed(2);
      estadoGlobal.premios.kina = +(estadoGlobal.premios.kina + (valorGasto * 0.075)).toFixed(2);
      estadoGlobal.premios.acumulado = +(estadoGlobal.premios.acumulado + (valorGasto * 0.04)).toFixed(2);
      estadoGlobal.totalCartelasVendidas += quantidade;

      io.emit('estado-jogo', estadoGlobal);
    }
  });

  socket.on('pedir-dados-admin', (senha) => {
    if (senha === 'boteco2026') {
      socket.emit('admin-update', { saques: historicoSaques, entradas: historicoEntradas });
    }
  });

  socket.on('marcar-saque-pago', (id) => {
    const saque = historicoSaques.find(s => s.id === id);
    if (saque) {
      saque.status = 'Pago';
      salvarDadosAdmin();
      io.emit('admin-update', { saques: historicoSaques, entradas: historicoEntradas });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor central de Bingo rodando na porta ${PORT}`);
});
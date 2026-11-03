import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor central de Bingo online e operacional!');
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- SISTEMA DE MEMÓRIA DO ADMIN ---
let historicoSaques = [];
let historicoEntradas = [];
// -----------------------------------

let estadoGlobal = {
  gameState: 'WAITING',
  timeRemaining: 180,
  sorteioNum: 120780,
  sorteioHoraInicio: 'Sincronizando...',
  drawnNumbers: [],
  pedraAtual: null,
  totalCartelasVendidas: 0,
  precoPorCartela: 1.00,
  premios: {
    kuadra: 15.00,
    kina: 15.00,
    keno: 40.00,
    acumulado: 100.00, // Base fixa de R$ 100,00 que cresce com as vendas
    bolaAcumulado: 36
  }
};

function formatTargetDateTime() {
  const date = new Date(Date.now() + estadoGlobal.timeRemaining * 1000);
  const dia = date.getDate().toString().padStart(2, '0');
  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  const hora = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia}/${mes}-${hora}`;
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

  estadoGlobal.gameState = 'WAITING';
  estadoGlobal.timeRemaining = 180;
  estadoGlobal.drawnNumbers = [];
  estadoGlobal.pedraAtual = null;
  estadoGlobal.sorteioNum = Math.floor(120000 + Math.random() * 900);
  estadoGlobal.sorteioHoraInicio = formatTargetDateTime();
  
  // Reseta os prêmios base para o próximo sorteio mantendo o Acumulado
  estadoGlobal.premios.kuadra = 15.00;
  estadoGlobal.premios.kina = 15.00;
  estadoGlobal.premios.keno = 40.00;
  estadoGlobal.totalCartelasVendidas = 0;
  
  io.emit('estado-jogo', estadoGlobal);
}

function encerrarPartidaPorBingo(vencedores) {
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

  const crc = calcularCRC16(payloadSemCRC);
  return `${payloadSemCRC}${crc}`;
}

app.post('/api/pix', async (req, res) => {
  try {
    const { amount } = req.body;
    const valorFinal = Number(amount || 10);
    const idLocal = `PIX${Date.now().toString().slice(-6)}`;
    const brCode = gerarPixBancoCentral(MINHA_CHAVE_PIX, valorFinal, idLocal);

    // --- SALVA A ENTRADA NA MEMÓRIA DO ADMIN ---
    const novaEntrada = { id: idLocal, amount: valorFinal, status: 'Gerado', hora: new Date().toLocaleTimeString('pt-BR') };
    historicoEntradas.unshift(novaEntrada);
    if(historicoEntradas.length > 50) historicoEntradas.pop();
    io.emit('admin-update', { saques: historicoSaques, entradas: historicoEntradas });
    // -------------------------------------------

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

    // --- SALVA O SAQUE NA MEMÓRIA DO ADMIN ---
    const novoSaque = { 
      id: Date.now().toString(), 
      uid, nome: nome || 'Anônimo', 
      valor, tipoChave, chavePix, 
      hora: new Date().toLocaleTimeString('pt-BR'), 
      status: 'Pendente' 
    };
    historicoSaques.unshift(novoSaque);
    io.emit('admin-update', { saques: historicoSaques, entradas: historicoEntradas });
    // -----------------------------------------

    return res.status(200).json({
      success: true,
      message: 'Solicitação recebida! Prazo de até 15 minutos.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao processar solicitação.' });
  }
};

app.post('/solicitar-saque', tratarSolicitacaoSaque);
app.post('/api/solicitar-saque', tratarSolicitacaoSaque);

io.on('connection', (socket) => {
  socket.emit('estado-jogo', estadoGlobal);

  socket.on('pausar-sorteio-premio', () => {
    sorteioPausado = true;
    if (timeoutPausa) clearTimeout(timeoutPausa);
    timeoutPausa = setTimeout(() => {
      sorteioPausado = false;
    }, 6500);
  });

  socket.on('bingo-vencedor', (dados) => {
    encerrarPartidaPorBingo(dados?.winners);
  });

  socket.on('finalizar-sorteio', () => {
    encerrarPartidaPorBingo();
  });

  socket.on('reset-game', () => {
    resetarParaLobby();
  });

  // --- DISTRIBUIÇÃO DAS VENDAS DE CARTELAS ---
  socket.on('comprar-cartelas', (dados) => {
    const quantidade = Number(dados?.quantidade || 0);
    const valorGasto = Number(dados?.valorTotal || 0);

    if (valorGasto > 0) {
      // 40% Bingo | 15% Quadra | 15% Quina | 5% Acumulado | 25% Margem da Casa
      const incrementoBingo = valorGasto * 0.40;
      const incrementoQuadra = valorGasto * 0.15;
      const incrementoQuina = valorGasto * 0.15;
      const incrementoAcumulado = valorGasto * 0.05;

      estadoGlobal.premios.keno += incrementoBingo;
      estadoGlobal.premios.kuadra += incrementoQuadra;
      estadoGlobal.premios.kina += incrementoQuina;
      estadoGlobal.premios.acumulado += incrementoAcumulado;
      estadoGlobal.totalCartelasVendidas += quantidade;

      io.emit('estado-jogo', estadoGlobal);
    }
  });

  // --- COMANDOS DO PAINEL ADMIN ---
  socket.on('pedir-dados-admin', (senha) => {
    if (senha === 'boteco2026') {
      socket.emit('admin-update', { saques: historicoSaques, entradas: historicoEntradas });
    }
  });

  socket.on('marcar-saque-pago', (id) => {
    const saque = historicoSaques.find(s => s.id === id);
    if (saque) {
      saque.status = 'Pago';
      io.emit('admin-update', { saques: historicoSaques, entradas: historicoEntradas });
    }
  });
  // --------------------------------
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor central de Bingo rodando na porta ${PORT}`);
});
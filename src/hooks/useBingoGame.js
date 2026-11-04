import { useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { io } from 'socket.io-client';

const socket = io('https://bingo-app-16i4.onrender.com', {
  transports: ['websocket', 'polling']
});

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

// Instâncias globais de áudio
const globalAudio = new Audio();
globalAudio.preload = 'auto';

const celebrationAudio = new Audio();
celebrationAudio.preload = 'auto';

const prizeVoiceAudio = new Audio();
prizeVoiceAudio.preload = 'auto';

let audioUnlocked = false;
let ultimaPedraTocada = null;
let ultimoTempoTocado = 0;

function tocarPedraAudio(pedra) {
  const numLimpo = Number(pedra);
  if (isNaN(numLimpo)) return;

  const agora = Date.now();
  if (ultimaPedraTocada === numLimpo && (agora - ultimoTempoTocado) < 1500) {
    return;
  }
  ultimaPedraTocada = numLimpo;
  ultimoTempoTocado = agora;

  const numComZero = String(numLimpo).padStart(2, '0');

  globalAudio.pause();
  globalAudio.currentTime = 0;
  globalAudio.src = `/audios/${numLimpo}.mp3`;

  const playPromise = globalAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      if (err.name === 'NotSupportedError' && numLimpo < 10) {
        globalAudio.src = `/audios/${numComZero}.mp3`;
        globalAudio.play().catch(() => {});
      }
    });
  }
}

// Dispara a voz do narrador e a música Tema da Vitória (vitoria.mp3) juntas
function anunciarPremio(tipoPremio) {
  const nomeAudioVoz = tipoPremio === 'KUADRA' ? 'quadra.mp3' :
                       tipoPremio === 'KINA'   ? 'quina.mp3' :
                       'bingo_voz.mp3';

  prizeVoiceAudio.pause();
  prizeVoiceAudio.currentTime = 0;
  prizeVoiceAudio.volume = 1.0;
  prizeVoiceAudio.src = `/audios/${nomeAudioVoz}`;
  prizeVoiceAudio.play().catch((err) => {
    console.warn(`Aviso ao tocar voz do prêmio ${nomeAudioVoz}:`, err.message);
  });

  celebrationAudio.pause();
  celebrationAudio.currentTime = 0;
  celebrationAudio.volume = 0.8;
  celebrationAudio.src = `/audios/vitoria.mp3?v=${Date.now()}`;
  celebrationAudio.play().catch((err) => {
    console.warn('Aviso: Áudio vitoria.mp3 não pôde ser reproduzido:', err.message);
  });
}

export function useBingoGame() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('bds_logged_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [sorteioNum, setSorteioNum] = useState(() => {
    const savedSorteio = localStorage.getItem('bds_active_sorteio_num');
    return savedSorteio ? Number(savedSorteio) : 120780;
  });

  // Carrega as cartelas do cache local imediatamente para evitar sumiço no F5
  const [cards, setCards] = useState(() => {
    try {
      const savedSorteio = localStorage.getItem('bds_active_sorteio_num') || 120780;
      const savedCards = localStorage.getItem(`bds_cards_${savedSorteio}`);
      return savedCards ? JSON.parse(savedCards) : [];
    } catch {
      return [];
    }
  });

  const [botCards, setBotCards] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [betAmount, setBetAmount] = useState(0.40
  );
  const [ticketQty, setTicketQty] = useState(5);

  const [sorteioHoraInicio, setSorteioHoraInicio] = useState('--------');
  const [gameState, setGameState] = useState('WAITING');
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [currentTarget, setCurrentTarget] = useState('KUADRA');

  const [confirmModal, setConfirmModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [lastBoughtQty, setLastBoughtQty] = useState(0);
  const [celebrationModal, setCelebrationModal] = useState(null);
  const [activeModalView, setActiveModalView] = useState('NONE');
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const [prizes, setPrizes] = useState({
    kuadra: 15.00,
    kina: 15.00,
    keno: 40.00,
    acumulado: 100.00,
    bolaAcumulado: 36
  });

  const [winnersList, setWinnersList] = useState({ kuadra: [], kina: [], keno: [] });
  const [matchHistory, setMatchHistory] = useState(() => {
    const saved = localStorage.getItem('bds_match_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [userTransactions, setUserTransactions] = useState(() => {
    const saved = localStorage.getItem('bds_user_tx');
    return saved ? JSON.parse(saved) : [
      { date: '28/10/2026 13:22:06', type: 'DEPÓSITO', value: 5.00, balance: 5.00 }
    ];
  });
  const [leaderboard, setLeaderboard] = useState([]);

  // Trava de fases
  const isPausedRef = useRef(false);
  const roundFinishedRef = useRef(false);
  const stagesWonRef = useRef({ KUADRA: false, KINA: false, KENO: false });

  const cardsRef = useRef(cards);
  const botsRef = useRef(botCards);
  const targetRef = useRef(currentTarget);
  const prizesRef = useRef(prizes);
  const currentUserRef = useRef(currentUser);
  const sorteioNumRef = useRef(sorteioNum);

  useEffect(() => { cardsRef.current = cards; }, [cards]);
  useEffect(() => { botsRef.current = botCards; }, [botCards]);
  useEffect(() => { targetRef.current = currentTarget; }, [currentTarget]);
  useEffect(() => { prizesRef.current = prizes; }, [prizes]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { sorteioNumRef.current = sorteioNum; }, [sorteioNum]);

  // Sincroniza persistência do usuário logado
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bds_logged_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('bds_logged_user');
    }
  }, [currentUser]);

  // Sincroniza as cartelas no localStorage quando o sorteioNum mudar
  useEffect(() => {
    if (sorteioNum) {
      localStorage.setItem('bds_active_sorteio_num', String(sorteioNum));
      const savedCards = localStorage.getItem(`bds_cards_${sorteioNum}`);
      if (savedCards) {
        try {
          const parsed = JSON.parse(savedCards);
          if (Array.isArray(parsed) && parsed.length > 0 && cardsRef.current.length === 0) {
            setCards(parsed);
          }
        } catch (e) {
          console.error("Erro ao carregar cartelas do sorteio atual:", e);
        }
      }
    }
  }, [sorteioNum]);

  // Solicita as cartelas ativas diretamente ao servidor central pelo UID do usuário
  useEffect(() => {
    if (currentUser?.uid && sorteioNum) {
      socket.emit('recuperar-minhas-cartelas', {
        uid: currentUser.uid,
        sorteioNum: sorteioNum
      });
    }
  }, [currentUser?.uid, sorteioNum]);

  // Desbloqueio global de áudio no primeiro clique
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioUnlocked) {
        audioUnlocked = true;
        const silent = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

        [globalAudio, celebrationAudio, prizeVoiceAudio].forEach(audio => {
          audio.src = silent;
          audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
          }).catch(() => {});
        });

        console.log('🔓 Canal de áudio liberado para pedras, vozes e comemorações.');
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const generateCard90 = useCallback(() => {
    const nums = [];
    while (nums.length < 15) {
      const r = Math.floor(Math.random() * 90) + 1;
      if (!nums.includes(r)) nums.push(r);
    }
    nums.sort((a, b) => a - b);
    return nums;
  }, []);

  const computeMissingForTarget = useCallback((card, drawn, target) => {
    const drawnSet = new Set(drawn.map(n => Number(n)));
    const cardNums = card.numbers.map(n => Number(n));

    const rows = [
      cardNums.slice(0, 5),
      cardNums.slice(5, 10),
      cardNums.slice(10, 15)
    ];

    if (target === 'KUADRA' || target === 'KINA') {
      let bestRowMissing = null;
      let maxRowHits = -1;

      rows.forEach(row => {
        const hits = row.filter(n => drawnSet.has(n));
        const missing = row.filter(n => !drawnSet.has(n));
        if (hits.length > maxRowHits) {
          maxRowHits = hits.length;
          bestRowMissing = missing;
        }
      });

      return {
        hitsCount: maxRowHits,
        missingBalls: bestRowMissing || [],
        isWinner: target === 'KUADRA' ? maxRowHits >= 4 : maxRowHits === 5
      };
    } else {
      const hits = cardNums.filter(n => drawnSet.has(n));
      const missing = cardNums.filter(n => !drawnSet.has(n));
      return {
        hitsCount: hits.length,
        missingBalls: missing || [],
        isWinner: hits.length === 15
      };
    }
  }, []);

  const resetRoundStates = useCallback(() => {
    roundFinishedRef.current = false;
    isPausedRef.current = false;
    stagesWonRef.current = { KUADRA: false, KINA: false, KENO: false };
    targetRef.current = 'KUADRA';
    setCurrentTarget('KUADRA');
    setWinnersList({ kuadra: [], kina: [], keno: [] });
    setCelebrationModal(null);
    celebrationAudio.pause();
    celebrationAudio.currentTime = 0;
    prizeVoiceAudio.pause();
    prizeVoiceAudio.currentTime = 0;
  }, []);

  useEffect(() => {
    const handleEstadoJogo = (estado) => {
      if (estado.gameState === 'WAITING' || (estado.drawnNumbers && estado.drawnNumbers.length === 0)) {
        resetRoundStates();
        if (estado.gameState === 'WAITING') {
          setBotCards([]);
          botsRef.current = [];
        }
      }

      if (roundFinishedRef.current && (estado.gameState === 'DRAWING' || estado.gameState === 'WINNERS_SUMMARY')) {
        return;
      }

      setGameState(estado.gameState);
      setTimeRemaining(estado.timeRemaining);

      if (estado.sorteioNum && estado.sorteioNum !== sorteioNumRef.current) {
        setSorteioNum(estado.sorteioNum);
        const cartelasNovoSorteio = localStorage.getItem(`bds_cards_${estado.sorteioNum}`);
        setCards(cartelasNovoSorteio ? JSON.parse(cartelasNovoSorteio) : []);
      }

      setSorteioHoraInicio(estado.sorteioHoraInicio);

      const numerosNormalizados = (estado.drawnNumbers || []).map(n => Number(n));
      setDrawnNumbers(numerosNormalizados);

      // Sincroniza os prêmios em tempo real vindos do servidor
      const premiosServidor = estado.premios || estado.prizes;
      if (premiosServidor) {
        setPrizes({
          kuadra: Number(premiosServidor.kuadra || 15.00),
          kina: Number(premiosServidor.kina || 15.00),
          keno: Number(premiosServidor.keno || 40.00),
          acumulado: Number(premiosServidor.acumulado || 100.00),
          bolaAcumulado: Number(premiosServidor.bolaAcumulado || 36)
        });
      }

      if (estado.gameState === 'DRAWING' && botsRef.current.length === 0) {
        const numBots = 10; // EXATAMENTE 10 BOTS FIXOS
        const nomesEmbaralhados = [...REAL_PLAYERS_POOL].sort(() => 0.5 - Math.random());
        const botsEscolhidos = nomesEmbaralhados.slice(0, numBots);

        const novasCartelasBots = [];
        let botBaseId = Math.floor(100 + Math.random() * 2000);

        botsEscolhidos.forEach(nomeBot => {
          for (let i = 0; i < 17; i++) { // EXATAMENTE 17 CARTELAS CADA BOT (TOTAL 136)
            novasCartelasBots.push({
              id: botBaseId++,
              player: nomeBot,
              numbers: generateCard90()
            });
          }
        });

        botsRef.current = novasCartelasBots;
        setBotCards(novasCartelasBots);
      }
    };

    const handleSyncTimer = (dados) => {
      if (!roundFinishedRef.current) {
        setTimeRemaining(dados.timeRemaining);
        setSorteioHoraInicio(dados.sorteioHoraInicio);
      }
    };

    const handleCartelasSincronizadas = (dados) => {
      if (dados && dados.sorteioNum === sorteioNumRef.current && Array.isArray(dados.cards)) {
        setCards(dados.cards);
        try {
          localStorage.setItem(`bds_cards_${dados.sorteioNum}`, JSON.stringify(dados.cards));
        } catch (err) {
          console.error("Erro ao salvar cartelas sincronizadas:", err);
        }
      }
    };

    const handleNovaPedra = ({ pedra, drawnNumbers: novoArray }) => {
      if (roundFinishedRef.current) return;

      const pedraNum = Number(pedra);
      const arrayNormalizado = (novoArray || []).map(n => Number(n));

      if (arrayNormalizado.length <= 1) {
        resetRoundStates();
      }

      setDrawnNumbers(arrayNormalizado);

      if (pedraNum && !isPausedRef.current) {
        tocarPedraAudio(pedraNum);
      }

      const allCards = [...cardsRef.current, ...botsRef.current];
      const activeTarget = targetRef.current;

      const evaluated = allCards.map(card => ({
        ...card,
        ...computeMissingForTarget(card, arrayNormalizado, activeTarget)
      }));

      evaluated.sort((a, b) => a.missingBalls.length - b.missingBalls.length);
      setLeaderboard(evaluated.slice(0, 12));

      if (cardsRef.current.length > 0) {
        const sortedUserCards = [...cardsRef.current].sort((a, b) => {
          const evalA = computeMissingForTarget(a, arrayNormalizado, activeTarget);
          const evalB = computeMissingForTarget(b, arrayNormalizado, activeTarget);
          return evalA.missingBalls.length - evalB.missingBalls.length;
        });
        setCards(sortedUserCards);
      }

      const winnerCards = evaluated.filter(c => c.isWinner);

      if (winnerCards.length > 0 && !isPausedRef.current && !stagesWonRef.current[activeTarget]) {
        isPausedRef.current = true;
        stagesWonRef.current[activeTarget] = true;

        const totalPrize = activeTarget === 'KUADRA' ? prizesRef.current.kuadra :
                           activeTarget === 'KINA'   ? prizesRef.current.kina :
                           prizesRef.current.keno;

        const prizePerWinner = +(totalPrize / winnerCards.length).toFixed(2);
        const chavePremio = activeTarget.toLowerCase();

        setWinnersList(prev => ({
          ...prev,
          [chavePremio]: winnerCards.map(w => ({
            id: w.id,
            player: w.player,
            prize: prizePerWinner
          }))
        }));

        if (currentUserRef.current) {
          const userWins = winnerCards.filter(w => w.player === currentUserRef.current.username);
          if (userWins.length > 0) {
            const ganhoTotalUsuario = +(userWins.length * prizePerWinner).toFixed(2);
            setCurrentUser(prev => {
              if (!prev) return null;
              const novoSaldo = +(prev.balance + ganhoTotalUsuario).toFixed(2);
              setUserTransactions(txPrev => [
                {
                  date: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                  type: `PRÊMIO ${activeTarget}`,
                  value: ganhoTotalUsuario,
                  balance: novoSaldo
                },
                ...txPrev
              ]);
              return { ...prev, balance: novoSaldo };
            });
          }
        }

        anunciarPremio(activeTarget);

        setCelebrationModal({
          title: activeTarget === 'KENO' ? 'BINGO' : activeTarget,
          winners: winnerCards,
          prizePerWinner: prizePerWinner,
          totalPrize: totalPrize
        });

        if (activeTarget === 'KENO') {
          roundFinishedRef.current = true;
          globalAudio.pause();
          confetti({ particleCount: 500, spread: 180, origin: { y: 0.3 } });
          socket.emit('bingo-vencedor', { winners: winnerCards, sorteioNum });
        } else {
          socket.emit('pausar-sorteio-premio');
          confetti({ particleCount: 350, spread: 150, origin: { y: 0.3 } });
        }

        if (activeTarget === 'KUADRA') {
          targetRef.current = 'KINA';
          setCurrentTarget('KINA');
        } else if (activeTarget === 'KINA') {
          targetRef.current = 'KENO';
          setCurrentTarget('KENO');
        }

        setTimeout(() => {
          setCelebrationModal(null);
          celebrationAudio.pause();
          celebrationAudio.currentTime = 0;
          prizeVoiceAudio.pause();
          prizeVoiceAudio.currentTime = 0;

          if (activeTarget === 'KENO') {
            setGameState('WINNERS_SUMMARY');

            setTimeout(() => {
              setGameState('WAITING');
              setTimeRemaining(180);
              setDrawnNumbers([]);
              setCards([]);
              localStorage.removeItem(`bds_cards_${sorteioNumRef.current}`);
              setBotCards([]);
              botsRef.current = [];
              resetRoundStates();
            }, 10000);
          } else {
            isPausedRef.current = false;
          }
        }, 6500);
      }
    };

    socket.off('estado-jogo');
    socket.off('sync-timer');
    socket.off('nova-pedra-central');
    socket.off('suas-cartelas-sincronizadas');

    socket.on('estado-jogo', handleEstadoJogo);
    socket.on('sync-timer', handleSyncTimer);
    socket.on('nova-pedra-central', handleNovaPedra);
    socket.on('suas-cartelas-sincronizadas', handleCartelasSincronizadas);

    return () => {
      socket.off('estado-jogo');
      socket.off('sync-timer');
      socket.off('nova-pedra-central');
      socket.off('suas-cartelas-sincronizadas');
    };
  }, [computeMissingForTarget, generateCard90, resetRoundStates, sorteioNum]);

  // CONTROLES DE QUANTIDADE COM LIMITE DE 50 CARTELAS
  const LIMITE_CARTELAS = 40;
  const updateQty = (delta) => setTicketQty(prev => Math.min(LIMITE_CARTELAS, Math.max(1, prev + delta)));
  const setQtyDirect = (val) => setTicketQty(Math.min(LIMITE_CARTELAS, val));

  const handleDoarClick = () => {
    if (!currentUser) {
      setActiveModalView('LOGIN');
      return;
    }
    setConfirmModal(true);
  };

  const confirmPurchase = () => {
    if (!currentUser) return;

    // TRAVA DE COMPRA - NÃO PERMITE PASSAR DE 50 CARTELAS NO TOTAL
    if (cards.length + ticketQty > LIMITE_CARTELAS) {
      alert(`Você só pode ter no máximo ${LIMITE_CARTELAS} cartelas por rodada!`);
      setConfirmModal(false);
      return;
    }

    const cost = +(ticketQty * betAmount).toFixed(2);
    if (cost > currentUser.balance) {
      alert('Saldo insuficiente!');
      setConfirmModal(false);
      setActiveModalView('DEPOSITAR');
      return;
    }

    const newBalance = +(currentUser.balance - cost).toFixed(2);
    setCurrentUser(prev => ({ ...prev, balance: newBalance }));

    const baseId = Math.floor(1370 + Math.random() * 50);
    const newCards = Array.from({ length: ticketQty }).map((_, idx) => ({
      id: baseId + idx,
      player: currentUser.username,
      numbers: generateCard90()
    }));

    // Notifica o servidor central na Render para armazenar no UID do jogador e subir os prêmios
    socket.emit('comprar-cartelas', {
      uid: currentUser.uid,
      sorteioNum: sorteioNumRef.current,
      quantidade: ticketQty,
      valorTotal: cost,
      cards: newCards
    });

    // Salva no estado e no localStorage simultaneamente
    setCards(prev => {
      const updatedCards = [...prev, ...newCards];
      try {
        localStorage.setItem(`bds_cards_${sorteioNumRef.current}`, JSON.stringify(updatedCards));
      } catch (err) {
        console.error("Erro ao salvar cartelas no localStorage:", err);
      }
      return updatedCards;
    });

    setUserTransactions(prev => [
      {
        date: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        type: 'APOSTA / DOAÇÃO',
        value: cost,
        balance: newBalance
      },
      ...prev
    ]);

    setLastBoughtQty(ticketQty);
    setConfirmModal(false);
    setSuccessModal(true);
  };

  const logout = () => setCurrentUser(null);

  return {
    currentUser, setCurrentUser, cards, drawnNumbers, betAmount, ticketQty, sorteioNum, sorteioHoraInicio,
    gameState, timeRemaining, currentTarget, prizes, winnersList, leaderboard,
    confirmModal, setConfirmModal, successModal, setSuccessModal, lastBoughtQty,
    celebrationModal, activeModalView, setActiveModalView, historyModalOpen, setHistoryModalOpen,
    rulesModalOpen, setRulesModalOpen, matchHistory, userTransactions, setUserTransactions,
    updateQty, setQtyDirect, handleDoarClick, confirmPurchase, logout
  };
}
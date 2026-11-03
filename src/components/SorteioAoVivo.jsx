import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Conecta ao servidor Node.js na porta 3001
const socket = io('http://localhost:3001');

export default function SorteioAoVivo() {
  const [pedraAtual, setPedraAtual] = useState(null);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    // Recebe o estado inicial ao entrar na sala
    socket.on('estado-atual', (data) => {
      setPedraAtual(data.pedraAtual);
      setHistorico(data.pedrasSorteadas);
    });

    // Ouve o sorteio da pedra
    socket.on('nova-pedra', (data) => {
      const numeroSorteado = data.pedra || data.pedraAtual;
      setPedraAtual(numeroSorteado);
      if (data.pedrasSorteadas) setHistorico(data.pedrasSorteadas);

      // Toca o arquivo da pasta public/audios/
      if (numeroSorteado) {
        const audio = new Audio(`/audios/${numeroSorteado}.mp3?v=${Date.now()}`);
        audio.play().catch((err) => {
          console.warn("Navegador bloqueou áudio ou ficheiro não encontrado:", err);
        });
      }
    });

    socket.on('jogo-reiniciado', () => {
      setPedraAtual(null);
      setHistorico([]);
    });

    // LIMPEZA OBRIGATÓRIA: Evita duplicar os ouvintes e falar repetido
    return () => {
      socket.off('estado-atual');
      socket.off('nova-pedra');
      socket.off('jogo-reiniciado');
    };
  }, []);
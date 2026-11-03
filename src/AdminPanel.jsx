import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { CheckCircle, Clock, Copy, DollarSign, LogOut, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const SOCKET_URL = 'https://bingo-app-16i4.onrender.com';

export default function AdminPanel() {
  const [senha, setSenha] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [dados, setDados] = useState({ saques: [], entradas: [] });
  const [conectado, setConectado] = useState(false);
  const [socketInst, setSocketInst] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000
    });

    s.on('connect', () => {
      setConectado(true);
      if (autenticado) {
        s.emit('pedir-dados-admin', 'boteco2026');
      }
    });

    s.on('disconnect', () => {
      setConectado(false);
    });

    s.on('admin-update', (novosDados) => {
      if (novosDados) {
        setDados({
          saques: novosDados.saques || [],
          entradas: novosDados.entradas || []
        });
      }
    });

    setSocketInst(s);

    return () => {
      s.disconnect();
    };
  }, [autenticado]);

  const fazerLogin = (e) => {
    e.preventDefault();
    if (senha === 'boteco2026') {
      setAutenticado(true);
      if (socketInst) {
        socketInst.emit('pedir-dados-admin', senha);
      }
    } else {
      alert('Senha incorreta!');
    }
  };

  const atualizarManualmente = () => {
    if (socketInst && autenticado) {
      socketInst.emit('pedir-dados-admin', 'boteco2026');
    }
  };

  const copiarPix = (chave) => {
    navigator.clipboard.writeText(chave);
    alert('Chave PIX copiada para a área de transferência!');
  };

  const marcarComoPago = (id) => {
    if (window.confirm('Tem a certeza de que já enviou o PIX a este jogador?')) {
      if (socketInst) {
        socketInst.emit('marcar-saque-pago', id);
      }
    }
  };

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <form onSubmit={fazerLogin} className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md text-center">
          <DollarSign className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-6">Acesso Restrito</h1>
          <input 
            type="password" 
            value={senha} 
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Palavra-passe"
            className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg p-3 mb-4 text-center text-lg focus:outline-none focus:border-yellow-500"
          />
          <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg transition-colors">
            Entrar no Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
          <div className="flex items-center gap-3">
            <DollarSign className="text-yellow-500" />
            <h1 className="text-2xl md:text-3xl font-bold">Painel do Administrador</h1>
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold ${conectado ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {conectado ? <><Wifi size={14} /> Online</> : <><WifiOff size={14} /> Desconectado</>}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={atualizarManualmente} className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white transition">
              <RefreshCw size={16} /> Atualizar
            </button>
            <button onClick={() => setAutenticado(false)} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
              <LogOut size={20} /> Sair
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Tabela de Saques (Saídas) */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-red-400 flex items-center gap-2">
              <Clock /> Pedidos de Saque (Vencedores)
            </h2>
            <div className="space-y-4">
              {dados.saques.length === 0 && <p className="text-gray-400">Nenhum saque pendente.</p>}
              {dados.saques.map((saque) => (
                <div key={saque.id} className={`p-4 rounded-lg border ${saque.status === 'Pago' ? 'bg-green-900/20 border-green-800' : 'bg-gray-700 border-gray-600'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-lg">{saque.nome}</p>
                      <p className="text-sm text-gray-400">{saque.hora} - {saque.tipoChave}</p>
                    </div>
                    <span className="font-bold text-green-400 text-xl">R$ {Number(saque.valor).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-900 p-2 rounded text-sm mb-3 font-mono break-all">
                    {saque.chavePix}
                    <button onClick={() => copiarPix(saque.chavePix)} className="p-2 bg-gray-800 hover:bg-gray-600 rounded text-gray-300 transition" title="Copiar PIX">
                      <Copy size={16} />
                    </button>
                  </div>
                  {saque.status !== 'Pago' ? (
                    <button onClick={() => marcarComoPago(saque.id)} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition">
                      <CheckCircle size={18} /> Marcar como Pago
                    </button>
                  ) : (
                    <div className="text-center text-green-500 font-bold py-2 flex items-center justify-center gap-2">
                      <CheckCircle size={18} /> Pagamento Concluído
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tabela de Entradas (Pix Gerados) */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2">
              <DollarSign /> Histórico de PIX (Cartelas)
            </h2>
            <div className="space-y-3">
              {dados.entradas.length === 0 && <p className="text-gray-400">Nenhum PIX gerado ainda.</p>}
              {dados.entradas.map((entrada, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg border border-gray-600">
                  <div>
                    <p className="font-bold text-sm">ID: {entrada.id}</p>
                    <p className="text-xs text-gray-400">{entrada.hora}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">R$ {Number(entrada.amount).toFixed(2)}</p>
                    <p className="text-xs text-yellow-400">{entrada.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
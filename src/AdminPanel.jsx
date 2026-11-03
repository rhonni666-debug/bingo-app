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
      <div className="notranslate" style={{ minHeight: '100vh', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <form onSubmit={fazerLogin} style={{ backgroundColor: '#1f2937', padding: '32px', borderRadius: '12px', border: '1px solid #374151', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <DollarSign style={{ width: '64px', height: '64px', color: '#eab308', margin: '0 auto 16px auto' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '24px' }}>Acesso Restrito</h1>
          <input 
            type="password" 
            value={senha} 
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Palavra-passe"
            style={{ width: '100%', backgroundColor: '#111827', color: '#ffffff', border: '1px solid #4b5563', borderRadius: '8px', padding: '12px', marginBottom: '16px', textAlign: 'center', fontSize: '18px', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', backgroundColor: '#ca8a04', color: '#ffffff', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            Entrar no Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="notranslate" style={{ minHeight: '100vh', backgroundColor: '#111827', color: '#ffffff', padding: '24px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #374151', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DollarSign style={{ color: '#eab308' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Painel do Administrador</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', borderRadius: '9999px', fontWeight: 'bold', backgroundColor: conectado ? '#064e3b' : '#7f1d1d', color: conectado ? '#6ee7b7' : '#fca5a5' }}>
              {conectado ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{conectado ? 'Online' : 'Desconectado'}</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={atualizarManualmente} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1f2937', border: '1px solid #4b5563', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', color: '#d1d5db', cursor: 'pointer' }}>
              <RefreshCw size={16} /> <span>Atualizar</span>
            </button>
            <button onClick={() => setAutenticado(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
              <LogOut size={20} /> <span>Sair</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Coluna Saques */}
          <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} /> <span>Pedidos de Saque (Vencedores)</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dados.saques.length === 0 && <p style={{ color: '#9ca3af' }}>Nenhum saque pendente.</p>}
              {dados.saques.map((saque) => (
                <div key={saque.id} style={{ padding: '14px', borderRadius: '8px', border: '1px solid', backgroundColor: saque.status === 'Pago' ? 'rgba(6, 78, 59, 0.2)' : '#374151', borderColor: saque.status === 'Pago' ? '#065f46' : '#4b5563' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', fontSize: '16px', margin: 0 }}>{saque.nome}</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>{saque.hora} - {saque.tipoChave}</p>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#4ade80', fontSize: '18px' }}>R$ {Number(saque.valor).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#111827', padding: '8px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '10px' }}>
                    <span style={{ flex: 1 }}>{saque.chavePix}</span>
                    <button onClick={() => copiarPix(saque.chavePix)} style={{ padding: '6px', backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '4px', color: '#d1d5db', cursor: 'pointer' }} title="Copiar PIX">
                      <Copy size={14} />
                    </button>
                  </div>
                  {saque.status !== 'Pago' ? (
                    <button onClick={() => marcarComoPago(saque.id)} style={{ width: '100%', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: 'bold', padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <CheckCircle size={16} /> <span>Marcar como Pago</span>
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#4ade80', fontWeight: 'bold', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <CheckCircle size={16} /> <span>Pagamento Concluído</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Coluna Entradas */}
          <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={20} /> <span>Histórico de PIX (Cartelas)</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dados.entradas.length === 0 && <p style={{ color: '#9ca3af' }}>Nenhum PIX gerado ainda.</p>}
              {dados.entradas.map((entrada, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#374151', borderRadius: '8px', border: '1px solid #4b5563' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>ID: {entrada.id}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>{entrada.hora}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 'bold', color: '#4ade80', margin: 0 }}>R$ {Number(entrada.amount).toFixed(2)}</p>
                    <p style={{ fontSize: '12px', color: '#facc15', margin: '2px 0 0 0' }}>{entrada.status}</p>
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
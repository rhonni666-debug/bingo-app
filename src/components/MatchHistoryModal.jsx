import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function MatchHistoryModal({ isOpen, onClose, historyList, userTransactions = [] }) {
  const [activeTab, setActiveTab] = useState('movimentacoes');
  const [period, setPeriod] = useState('7D');

  if (!isOpen) return null;

  const renderWinners = (winnersArray) => {
    if (!winnersArray || winnersArray.length === 0) return '-';
    return winnersArray.map(w => `${w.player} (#${w.id})`).join(' | ');
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '850px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', color: '#1e293b' }}>
        
        <div style={{ background: '#0284c7', color: '#ffffff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          <span>Extrato - Sorteio</span>
          <button onClick={onClose} type="button" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={22}/></button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {['7D', '30D', '60D'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} type="button" style={{ background: period === p ? '#0f172a' : '#e2e8f0', color: period === p ? '#fff' : '#475569', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}>
                {p === '7D' ? '7 Dias' : p === '30D' ? '30 Dias' : '60 Dias'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '15px' }}>
            <button onClick={() => setActiveTab('movimentacoes')} type="button" style={{ background: 'transparent', border: 'none', padding: '10px 16px', cursor: 'pointer', fontWeight: activeTab === 'movimentacoes' ? '600' : '400', color: activeTab === 'movimentacoes' ? '#0f172a' : '#64748b', borderBottom: activeTab === 'movimentacoes' ? '2px solid #0284c7' : '2px solid transparent', fontSize: '14px' }}>
              Movimentações
            </button>
            <button onClick={() => setActiveTab('jogos')} type="button" style={{ background: 'transparent', border: 'none', padding: '10px 16px', cursor: 'pointer', fontWeight: activeTab === 'jogos' ? '600' : '400', color: activeTab === 'jogos' ? '#0f172a' : '#64748b', borderBottom: activeTab === 'jogos' ? '2px solid #0284c7' : '2px solid transparent', fontSize: '14px' }}>
              Histórico de Jogos
            </button>
          </div>

          {activeTab === 'movimentacoes' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}><th style={{ padding: '10px' }}>Data</th><th style={{ padding: '10px' }}>Tipo</th><th style={{ padding: '10px', textAlign: 'right' }}>Valor</th><th style={{ padding: '10px', textAlign: 'right' }}>Saldo</th></tr></thead>
                <tbody>
                  {userTransactions.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Nenhuma movimentação registrada.</td></tr>
                  ) : (
                    userTransactions.map((tx, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 10px', color: '#334155' }}>{tx.date}</td>
                        <td style={{ padding: '12px 10px', fontWeight: '500', color: tx.type.includes('DEPÓSITO') || tx.type.includes('PRÊMIO') ? '#16a34a' : '#dc2626' }}>{tx.type}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '500' }}>R$ {tx.value.toFixed(2).replace('.', ',')}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: '#64748b' }}>R$ {tx.balance.toFixed(2).replace('.', ',')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'jogos' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}><th style={{ padding: '10px' }}>Sorteio</th><th style={{ padding: '10px' }}>Data / Hora</th><th style={{ padding: '10px' }}>Kuadra</th><th style={{ padding: '10px' }}>Kina</th><th style={{ padding: '10px' }}>Keno</th></tr></thead>
                <tbody>
                  {historyList.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Nenhuma partida finalizada nesta sessão.</td></tr>
                  ) : (
                    historyList.map((match, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 10px', fontWeight: '600', color: '#0284c7' }}>#{match.sorteioNum}</td>
                        <td style={{ padding: '12px 10px', color: '#334155' }}>{match.date}</td>
                        <td style={{ padding: '12px 10px' }}>{renderWinners(match.winners.kuadra)}</td>
                        <td style={{ padding: '12px 10px' }}>{renderWinners(match.winners.kina)}</td>
                        <td style={{ padding: '12px 10px' }}>{renderWinners(match.winners.keno)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
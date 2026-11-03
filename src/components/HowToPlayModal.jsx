import React from 'react';
import { X, HelpCircle, Award, ShieldAlert, Sparkles } from 'lucide-react';

export default function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '650px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        color: '#1e293b'
      }}>
        
        <div style={{
          background: '#0284c7',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          <span><HelpCircle size={20} style={{marginRight: '8px', verticalAlign: 'middle'}}/> Como Jogar - Boteco da Sorte</span>
          <button onClick={onClose} type="button" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={22}/>
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '14px', lineHeight: '1.6' }}>
          
          <h3 style={{ color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={18}/> Dinâmica da Partida
          </h3>
          <p style={{ marginBottom: '16px', color: '#475569' }}>
            O jogo funciona em ciclos contínuos de apostas e sorteios ao vivo sincronizados. Durante a fase de espera, escolhe as suas cartelas e clica em <b>DOAR</b> para participar da rodada atual. O sistema sorteia bolas de 1 a 90 automaticamente.
          </p>

          <h3 style={{ color: '#0284c7', marginBottom: '8px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={18}/> Níveis de Prêmios
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px', color: '#475569' }}>
            <li style={{ marginBottom: '8px' }}><b>Kuadra:</b> Ganha quem completar primeiro 4 números em qualquer uma das linhas da cartela.</li>
            <li style={{ marginBottom: '8px' }}><b>Kina:</b> Ganha quem preencher uma linha inteira (5 números) de uma cartela primeiro.</li>
            <li style={{ marginBottom: '8px' }}><b>Keno:</b> O grande prêmio principal da rodada! Leva quem preencher os 15 números da cartela.</li>
            <li><b>Acumulado:</b> Prémio acumulado especial conquistado mediante regras da rodada.</li>
          </ul>

          <h3 style={{ color: '#0284c7', marginBottom: '8px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={18}/> Saldo e Contas
          </h3>
          <p style={{ color: '#475569' }}>
            Pode gerir o seu saldo através do menu superior para simular depósitos via Pix ou consultar o extrato e histórico de partidas.
          </p>

        </div>

        <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
          <button className="auth-submit-black-btn" onClick={onClose} type="button" style={{ padding: '10px 24px', width: 'auto' }}>Entendido</button>
        </div>
      </div>
    </div>
  );
}
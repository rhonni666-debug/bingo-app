import React from 'react';
import { X, User, Mail, Phone, FileText, DollarSign } from 'lucide-react';

export default function UserDataModal({ isOpen, onClose, currentUser }) {
  if (!isOpen || !currentUser) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '16px'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #060b18 100%)', border: '2px solid #eab308', borderRadius: '16px',
        padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 0 30px rgba(234, 179, 8, 0.3)', color: '#ffffff', fontFamily: 'sans-serif'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #374151', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User className="text-yellow-500" size={24} color="#eab308" />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#facc15' }}>Meus Dados</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
          <div style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', border: '1px solid #374151' }}>
            <span style={{ color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><User size={14}/> Nome de Utilizador</span>
            <strong style={{ fontSize: '16px', color: '#fff' }}>{currentUser.username || 'Não informado'}</strong>
          </div>

          <div style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', border: '1px solid #374151' }}>
            <span style={{ color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={14}/> E-mail</span>
            <span style={{ fontSize: '15px', color: '#e2e8f0' }}>{currentUser.email || 'Não informado'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', border: '1px solid #374151' }}>
              <span style={{ color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><FileText size={14}/> CPF</span>
              <span style={{ fontSize: '14px', color: '#e2e8f0' }}>{currentUser.cpf || 'Não informado'}</span>
            </div>

            <div style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', border: '1px solid #374151' }}>
              <span style={{ color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={14}/> Telefone</span>
              <span style={{ fontSize: '14px', color: '#e2e8f0' }}>{currentUser.phone || 'Não informado'}</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ color: '#facc15', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><DollarSign size={16}/> Saldo Atual</span>
            <strong style={{ fontSize: '18px', color: '#4ade80' }}>R$ {(currentUser.balance || 0).toFixed(2).replace('.', ',')}</strong>
          </div>
        </div>

        <button 
          onClick={onClose} 
          style={{
            width: '100%', marginTop: '20px', padding: '12px', backgroundColor: '#ca8a04', color: '#ffffff',
            fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', textTransform: 'uppercase'
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
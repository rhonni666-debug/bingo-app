import React, { useState } from 'react';
import { Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function ModalDeposito({ isOpen, onClose, currentUser }) {
  const [valor, setValor] = useState('10');
  const [carregando, setCarregando] = useState(false);
  const [dadosPix, setDadosPix] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const handleGerarPix = async () => {
    setErro('');
    const quantia = parseFloat(valor);

    if (isNaN(quantia) || quantia < 1) {
      setErro('O valor mínimo de depósito é R$ 1,00');
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch('http://localhost:3001/api/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: quantia,
          email: currentUser?.email || 'cliente.bingo@gmail.com',
          description: `Deposito Bingo - ${currentUser?.displayName || 'Jogador'}`,
          uid: currentUser?.uid
        })
      });

      const data = await response.json();

      if (!response.ok || !data.qrCode) {
        throw new Error(data.error || 'Falha ao gerar cobrança Pix');
      }

      setDadosPix(data);
    } catch (err) {
      console.error('Erro no ModalDeposito:', err);
      setErro(err.message || 'Erro ao conectar ao servidor de pagamentos.');
    } finally {
      setCarregando(false);
    }
  };

  const handleCopiarChave = () => {
    if (dadosPix?.qrCode) {
      navigator.clipboard.writeText(dadosPix.qrCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const handleReset = () => {
    setDadosPix(null);
    setErro('');
    setCarregando(false);
    onClose();
  };

  return (
    <div style={styles.overlay} translate="no" className="notranslate">
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Depósito via Pix</h2>
          <button type="button" onClick={handleReset} style={styles.closeBtn}>✕</button>
        </div>

        {erro ? (
          <div style={styles.alertError}>
            <AlertCircle size={18} style={{ marginRight: 8, flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        ) : null}

        {!dadosPix ? (
          <div key="form-deposito">
            <label style={styles.label}>Selecione ou digite o valor (R$):</label>
            <div style={styles.quickValues}>
              {['10', '20', '50', '100'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setValor(val)}
                  style={{
                    ...styles.quickBtn,
                    backgroundColor: valor === val ? '#2563eb' : '#334155',
                    color: '#fff'
                  }}
                >
                  <span>R$ {val}</span>
                </button>
              ))}
            </div>

            <input
              type="number"
              min="1"
              step="any"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              style={styles.input}
            />

            <button
              type="button"
              onClick={handleGerarPix}
              disabled={carregando}
              style={{
                ...styles.actionBtn,
                opacity: carregando ? 0.7 : 1
              }}
            >
              {carregando ? (
                <span key="btn-loading" style={{ display: 'flex', alignItems: 'center' }}>
                  <Loader2 className="animate-spin" size={20} style={{ marginRight: 8 }} />
                  <span>Gerando Pix...</span>
                </span>
              ) : (
                <span key="btn-idle">Gerar Código Pix</span>
              )}
            </button>
          </div>
        ) : (
          <div key="resultado-pix" style={{ textAlign: 'center' }}>
            <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '12px' }}>
              Escaneie o QR Code abaixo com o aplicativo do seu banco:
            </p>

            <div style={styles.qrFallback}>
              <QRCodeSVG value={dadosPix.qrCode} size={180} />
            </div>

            <div style={styles.copiaColaContainer}>
              <input
                type="text"
                readOnly
                value={dadosPix.qrCode}
                style={styles.copiaColaInput}
              />
              <button type="button" onClick={handleCopiarChave} style={styles.copyBtn}>
                {copiado ? (
                  <span key="copied" style={{ display: 'flex', alignItems: 'center' }}>
                    <Check size={18} color="#22c55e" />
                    <span style={{ marginLeft: 6 }}>Copiado!</span>
                  </span>
                ) : (
                  <span key="copy" style={{ display: 'flex', alignItems: 'center' }}>
                    <Copy size={18} />
                    <span style={{ marginLeft: 6 }}>Copiar</span>
                  </span>
                )}
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>
              Após o pagamento, o saldo é adicionado na sua conta automaticamente.
            </p>

            <button
              type="button"
              onClick={handleReset}
              style={{ ...styles.actionBtn, marginTop: '16px', backgroundColor: '#475569' }}
            >
              <span>Fechar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', // Mantém fixo na tela visível independentemente do scroll
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '420px',
    color: '#fff',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    border: '1px solid #334155'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#f8fafc'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '20px',
    cursor: 'pointer'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    color: '#cbd5e1',
    marginBottom: '10px'
  },
  quickValues: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px'
  },
  quickBtn: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#fff',
    fontSize: '16px',
    boxSizing: 'border-box',
    marginBottom: '18px'
  },
  actionBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#16a34a',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrFallback: {
    width: '200px',
    height: '200px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px'
  },
  copiaColaContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px'
  },
  copiaColaInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#94a3b8',
    fontSize: '13px',
    outline: 'none'
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#334155',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500'
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    backgroundColor: '#ef444420',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px'
  }
};
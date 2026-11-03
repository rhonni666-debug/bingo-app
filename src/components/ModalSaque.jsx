import React, { useState } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../firebase';

export default function ModalSaque({ isOpen, onClose, currentUser, setCurrentUser }) {
  const [valor, setValor] = useState('');
  const [tipoChave, setTipoChave] = useState('cpf');
  const [chavePix, setChavePix] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Garante que o saldo é sempre um número seguro, evitando o NaN
  const saldoAtual = Number(currentUser.balance || 0);

  const handleSolicitarSaque = async (e) => {
    e.preventDefault();
    setErro('');

    const valorNumerico = parseFloat(valor);

    if (!valorNumerico || valorNumerico <= 0) {
      setErro('Digite um valor válido para o saque.');
      return;
    }

    if (valorNumerico > saldoAtual) {
      setErro('Saldo insuficiente para este valor.');
      return;
    }

    if (!chavePix.trim()) {
      setErro('Informe a sua chave Pix para receber.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://bingo-app-16i4.onrender.com/solicitar-saque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          nome: currentUser.username || currentUser.email || 'Jogador',
          valor: valorNumerico,
          tipoChave,
          chavePix
        })
      });

      const data = await response.json();

      if (response.ok) {
        const novoSaldo = Number((saldoAtual - valorNumerico).toFixed(2));

        // Atualiza o saldo real no Firebase
        try {
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, { balance: novoSaldo });
        } catch (fbErr) {
          console.error("Erro ao atualizar saldo no Firebase:", fbErr);
        }

        // Atualiza o saldo em tempo real na tela do usuário
        setCurrentUser({
          ...currentUser,
          balance: novoSaldo
        });

        setSucesso(true);
      } else {
        setErro(data.error || 'Erro ao processar solicitação.');
      }
    } catch (err) {
      setErro('Erro de conexão com o servidor. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const fecharModal = () => {
    setSucesso(false);
    setValor('');
    setChavePix('');
    setErro('');
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>💸 Solicitar Saque via Pix</h2>
          <button onClick={fecharModal} style={styles.closeBtn}>✕</button>
        </div>

        {sucesso ? (
          <div style={styles.sucessoBox}>
            <div style={styles.iconeSucesso}>✅</div>
            <h3 style={{ color: '#4ade80', marginBottom: '10px' }}>Saque Solicitado com Sucesso!</h3>
            <p style={styles.textoAviso}>
              Sua solicitação de <strong>R$ {parseFloat(valor || 0).toFixed(2).replace('.', ',')}</strong> foi enviada.
            </p>
            <div style={styles.alertaPrazo}>
              ⏱️ <strong>Prazo:</strong> O valor cairá na sua conta Pix em até <strong>15 minutos</strong> após a confirmação do prêmio.
            </div>
            <button onClick={fecharModal} style={styles.btnConfirmar}>
              Entendi, Voltar ao Jogo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSolicitarSaque}>
            <div style={styles.saldoInfo}>
              Saldo Real Disponível: <strong style={{ color: '#4ade80' }}>R$ {saldoAtual.toFixed(2).replace('.', ',')}</strong>
            </div>

            {erro && <div style={styles.erroBox}>{erro}</div>}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Valor do Saque (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 50.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Tipo de Chave Pix</label>
              <select
                value={tipoChave}
                onChange={(e) => setTipoChave(e.target.value)}
                style={styles.select}
              >
                <option value="cpf">CPF / CNPJ</option>
                <option value="celular">Celular</option>
                <option value="email">E-mail</option>
                <option value="aleatoria">Chave Aleatória</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Sua Chave Pix</label>
              <input
                type="text"
                placeholder="Digite sua chave Pix aqui..."
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.avisoPre}>
              ⚠️ O pagamento será validado e enviado para a sua chave em até <strong>15 minutos</strong>.
            </div>

            <button type="submit" disabled={loading} style={styles.btnSubmit}>
              {loading ? 'A processar...' : 'Confirmar Saque'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999
  },
  modal: {
    backgroundColor: '#0f172a', color: '#fff', padding: '24px',
    borderRadius: '12px', width: '92%', maxWidth: '400px',
    boxShadow: '0 0 30px rgba(0,0,0,0.8), 0 0 15px rgba(234, 179, 8, 0.25)',
    border: '1.5px solid #eab308'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px'
  },
  title: { margin: 0, fontSize: '18px', fontWeight: '900', color: '#facc15', textTransform: 'uppercase' },
  closeBtn: {
    background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold'
  },
  saldoInfo: {
    backgroundColor: '#071128', padding: '12px', borderRadius: '8px',
    marginBottom: '16px', textAlign: 'center', fontSize: '15px', border: '1px solid rgba(56, 189, 248, 0.3)'
  },
  inputGroup: { marginBottom: '14px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', color: '#fde047', fontWeight: 'bold' },
  input: {
    width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid #38bdf8',
    backgroundColor: '#030816', color: '#fff', fontSize: '15px', boxSizing: 'border-box'
  },
  select: {
    width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid #38bdf8',
    backgroundColor: '#030816', color: '#fff', fontSize: '15px', boxSizing: 'border-box'
  },
  avisoPre: {
    fontSize: '12px', color: '#fde68a', backgroundColor: 'rgba(234, 179, 8, 0.12)',
    border: '1px solid rgba(234, 179, 8, 0.4)',
    padding: '10px', borderRadius: '6px', marginBottom: '16px', lineHeight: '1.4'
  },
  btnSubmit: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(180deg, #4ade80 0%, #16a34a 50%, #14532d 100%)',
    color: '#fff', border: '1px solid #bbf7d0', borderRadius: '8px',
    fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer',
    boxShadow: '0 0 14px rgba(34, 197, 94, 0.5)'
  },
  erroBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px',
    borderRadius: '6px', marginBottom: '14px', fontSize: '13px', textAlign: 'center', fontWeight: 'bold'
  },
  sucessoBox: { textAlign: 'center', padding: '10px 0' },
  iconeSucesso: { fontSize: '48px', marginBottom: '10px' },
  textoAviso: { fontSize: '15px', color: '#e2e8f0', marginBottom: '16px' },
  alertaPrazo: {
    backgroundColor: '#071128', border: '1.5px solid #facc15', color: '#fde047',
    padding: '14px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5'
  },
  btnConfirmar: {
    width: '100%', padding: '12px', background: 'linear-gradient(180deg, #38bdf8, #0284c7)', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase'
  }
};
import ModalDeposito from './components/ModalDeposito';
import ModalSaque from './components/ModalSaque';
import React, { useState } from 'react';
import BingoCard from './components/BingoCard';
import MatchHistoryModal from './components/MatchHistoryModal';
import HowToPlayModal from './components/HowToPlayModal';
import { useBingoGame } from './hooks/useBingoGame';
import { X, LogOut, User, DollarSign, Menu, HelpCircle, Wallet, Grid } from 'lucide-react';

// IMPORTAÇÃO DO PAINEL DE ADMINISTRAÇÃO SECRETO
import AdminPanel from './AdminPanel';

// IMPORTAÇÕES DO FIREBASE
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

function App() {
  // ROTA DO PAINEL SECRETO (aceita tanto por URL direta quanto por #admin)
  if (typeof window !== 'undefined' && (window.location.pathname === '/admin-secreto' || window.location.hash === '#admin')) {
    return <AdminPanel />;
  }

  const {
    currentUser, setCurrentUser, cards, drawnNumbers, betAmount, ticketQty, sorteioNum, sorteioHoraInicio,
    gameState, timeRemaining, currentTarget, prizes, winnersList, leaderboard,
    confirmModal, setConfirmModal, successModal, setSuccessModal, lastBoughtQty,
    celebrationModal, activeModalView, setActiveModalView, historyModalOpen, setHistoryModalOpen,
    rulesModalOpen, setRulesModalOpen, matchHistory, userTransactions,
    updateQty, setQtyDirect, handleDoarClick, confirmPurchase,
    logout
  } = useBingoGame();

  // ESTADOS DE REGISTRO
  const [regCpf, setRegCpf] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [regTerms, setRegTerms] = useState(false);

  // ESTADOS DE LOGIN
  const [loginEmail, setLoginEmail] = useState(() => localStorage.getItem('bds_remembered_email') || '');
  const [loginPass, setLoginPass] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('bds_remembered_email'));

  const [compactCards, setCompactCards] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const lastBall = drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : null;
  const previousBalls = drawnNumbers.slice(0, -1).slice(-3).reverse();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regUser || !regPass || !regCpf || !regEmail) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    if (regPass !== regPassConfirm) {
      alert("As senhas não coincidem!");
      return;
    }
    if (!regTerms) {
      alert("Você deve aceitar os termos de uso.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPass);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        username: regUser.trim().toUpperCase(),
        cpf: regCpf,
        email: regEmail,
        phone: regPhone,
        balance: 10.00,
        createdAt: new Date().toISOString()
      });

      alert("Conta criada com sucesso! 📩 Verifique a sua caixa de entrada (ou spam) e clique no link para ativar a conta antes de fazer o login.");
      
      setActiveModalView('NONE');
      setRegEmail(''); setRegPass(''); setRegPassConfirm(''); setRegCpf(''); setRegPhone(''); setRegUser('');
      await signOut(auth);

    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') alert("Este e-mail já está cadastrado.");
      else if (error.code === 'auth/weak-password') alert("A senha deve ter pelo menos 6 caracteres.");
      else alert("Erro ao criar conta: " + error.message);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPass);
      const user = userCredential.user;

      if (!user.emailVerified) {
        alert("⚠️ O seu e-mail ainda não foi verificado! Por favor, acesse o seu e-mail e clique no link de ativação.");
        await signOut(auth);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('bds_remembered_email', loginEmail);
      } else {
        localStorage.removeItem('bds_remembered_email');
      }

      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setCurrentUser({
          uid: user.uid,
          ...userData
        });
        setActiveModalView('NONE');
        setLoginPass('');
      } else {
        alert("Erro: Dados do usuário não encontrados.");
      }

    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        alert("E-mail ou senha incorretos!");
      } else {
        alert("Erro ao entrar: " + error.message);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      alert("⚠️ Por favor, digite o seu E-mail no campo acima primeiro e depois clique em 'Esqueci a senha'.");
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      alert("✅ Link de recuperação de senha enviado! Verifique o seu e-mail (e a caixa de spam).");
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        alert("Não existe nenhuma conta cadastrada com este e-mail.");
      } else if (error.code === 'auth/invalid-email') {
        alert("Formato de e-mail inválido.");
      } else {
        alert("Erro ao enviar o e-mail de recuperação: " + error.message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    setMenuOpen(false);
  };

  const formatarNomePremio = (cat) => {
    if (!cat) return '';
    const map = { kuadra: 'QUADRA', kina: 'QUINA', keno: 'BINGO' };
    return map[cat.toLowerCase()] || cat.toUpperCase();
  };

  return (
    <div className="bds-page-wrapper">
      <style>{`
        .bds-page-wrapper {
          background: radial-gradient(circle at top, #0f172a 0%, #020617 100%) !important;
          min-height: 100vh;
        }
        .bds-mobile-container {
          background: linear-gradient(180deg, #071128 0%, #030816 100%) !important;
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.9), 0 0 15px rgba(234, 179, 8, 0.2) !important;
          border-left: 1px solid rgba(250, 204, 21, 0.25) !important;
          border-right: 1px solid rgba(250, 204, 21, 0.25) !important;
        }

        .bds-round-menu-icon {
          background: linear-gradient(180deg, #1e3a8a, #091326) !important;
          border: 1.5px solid #eab308 !important;
          box-shadow: 0 0 10px rgba(234, 179, 8, 0.3) !important;
        }
        .bds-timer-card {
          background: linear-gradient(180deg, rgba(15, 29, 64, 0.95) 0%, rgba(6, 12, 30, 0.98) 100%) !important;
          border: 1.5px solid rgba(250, 204, 21, 0.7) !important;
          border-radius: 12px !important;
          box-shadow: 0 6px 18px rgba(0,0,0,0.8), inset 0 0 15px rgba(250, 204, 21, 0.15) !important;
        }
        .bds-timer-label {
          color: #fde047 !important;
          font-weight: 800 !important;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .bds-timer-digits {
          color: #ffffff !important;
          text-shadow: 0 0 12px rgba(56, 189, 248, 0.6), 0 2px 4px #000 !important;
          font-weight: 900 !important;
        }

        .bds-prizes-stack {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 8px !important;
          padding: 8px 10px !important;
        }
        .bds-live-prizes-row {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 8px !important;
          padding: 8px 10px 4px 10px !important;
        }
        .bds-live-prize-pill, .bds-prize-line {
          background: linear-gradient(180deg, rgba(16, 32, 70, 0.95) 0%, rgba(7, 14, 34, 0.98) 100%) !important;
          border: 1.5px solid rgba(250, 204, 21, 0.65) !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7), inset 0 0 12px rgba(250, 204, 21, 0.12) !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 8px 4px !important;
          text-align: center !important;
        }
        .lp-title, .p-name {
          color: #fde047 !important;
          font-weight: 800 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9) !important;
          margin-bottom: 2px !important;
        }
        .lp-val, .p-val {
          color: #ffffff !important;
          font-weight: 900 !important;
          font-size: 14px !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9) !important;
        }

        .bds-live-acumulado-row, .bds-acumulado-bar {
          background: linear-gradient(90deg, #091326 0%, #162447 50%, #091326 100%) !important;
          border: 1.5px solid rgba(250, 204, 21, 0.65) !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.15) !important;
        }
        .acumulado-Outline-sm, .acumulado-Outline {
          color: #facc15 !important;
          font-weight: 900 !important;
          letter-spacing: 1px;
          text-shadow: 0 2px 4px #000 !important;
        }
        .acumulado-red-box-sm, .acumulado-red-box {
          background: linear-gradient(180deg, #ef4444 0%, #b91c1c 55%, #7f1d1d 100%) !important;
          border: 1px solid #fca5a5 !important;
          color: #ffffff !important;
          font-weight: 900 !important;
          border-radius: 6px !important;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.5) !important;
        }
        .acumulado-ball-badge-sm, .acumulado-ball-badge {
          background: radial-gradient(circle at 30% 30%, #f87171, #dc2626 65%, #7f1d1d) !important;
          border: 1px solid #fecaca !important;
          color: #ffffff !important;
          font-weight: 900 !important;
          box-shadow: inset -2px -2px 4px rgba(0,0,0,0.6), 0 2px 6px rgba(220, 38, 38, 0.6) !important;
        }

        .bds-info-pill {
          background: linear-gradient(180deg, #111e3d 0%, #080f24 100%) !important;
          border: 1px solid rgba(250, 204, 21, 0.45) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.6) !important;
        }
        .pill-title { color: #fde047 !important; font-weight: 700 !important; }
        .pill-val { color: #ffffff !important; font-weight: 900 !important; }

        .bds-halloween-banner {
          background: linear-gradient(90deg, rgba(124, 45, 18, 0.6), rgba(234, 88, 12, 0.3), rgba(124, 45, 18, 0.6)) !important;
          border: 1px solid rgba(251, 146, 60, 0.5) !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
        }
        .h-banner-title { color: #fde047 !important; font-weight: 900 !important; }
        .h-banner-sub { color: #fed7aa !important; font-weight: 700 !important; }

        .bds-quick-qty-bar {
          background: rgba(9, 19, 38, 0.8) !important;
          border: 1px solid rgba(56, 189, 248, 0.25) !important;
          border-radius: 8px !important;
        }
        .bds-qty-chip {
          background: linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%) !important;
          border: 1px solid rgba(56, 189, 248, 0.5) !important;
          color: #ffffff !important;
          font-weight: 800 !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 5px rgba(0,0,0,0.5) !important;
        }
        .bds-qty-chip:hover {
          border-color: #fde047 !important;
          color: #fde047 !important;
        }

        .bds-doar-button {
          background: linear-gradient(180deg, #4ade80 0%, #16a34a 50%, #14532d 100%) !important;
          border: 1px solid #bbf7d0 !important;
          color: #ffffff !important;
          font-weight: 900 !important;
          text-shadow: 0 1px 2px #000 !important;
          box-shadow: 0 0 14px rgba(34, 197, 94, 0.5) !important;
        }

        .bds-cartelas-bar {
          background: linear-gradient(90deg, #091326 0%, #162447 100%) !important;
          border: 1px solid rgba(250, 204, 21, 0.45) !important;
          border-radius: 8px !important;
        }

        .bds-globe-circle {
          background: radial-gradient(circle at 50% 40%, rgba(30, 64, 175, 0.45), rgba(7, 16, 40, 0.95) 75%) !important;
          border: 3px solid #eab308 !important;
          box-shadow: 0 0 22px rgba(234, 179, 8, 0.4), inset 0 0 25px rgba(56, 189, 248, 0.5), inset 0 -10px 20px rgba(0, 0, 0, 0.85) !important;
        }
        .bds-main-ball {
          background: radial-gradient(circle at 30% 30%, #86efac, #16a34a 60%, #052e16) !important;
          border: 2px solid #bbf7d0 !important;
          box-shadow: 0 0 20px rgba(74, 222, 128, 0.8), inset -4px -4px 8px rgba(0,0,0,0.6) !important;
        }
        .bds-main-ball-inner {
          background: radial-gradient(circle at 35% 35%, #ffffff, #e2e8f0) !important;
          color: #064e3b !important;
          font-weight: 900 !important;
        }
        .prev-pos-1 { background: radial-gradient(circle at 30% 30%, #e9d5ff, #9333ea 65%, #3b0764) !important; border: 1.5px solid #f3e8ff !important; }
        .prev-pos-2 { background: radial-gradient(circle at 30% 30%, #fde68a, #d97706 65%, #451a03) !important; border: 1.5px solid #fef3c7 !important; }
        .prev-pos-3 { background: radial-gradient(circle at 30% 30%, #67e8f9, #0284c7 65%, #082f49) !important; border: 1.5px solid #cffafe !important; }

        .bds-matrix-90 {
          background: linear-gradient(180deg, #060d1f 0%, #030712 100%) !important;
          border: 1.5px solid rgba(250, 204, 21, 0.5) !important;
          border-radius: 10px !important;
          box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.95), 0 4px 10px rgba(0,0,0,0.5) !important;
        }
        .m90-num { color: #fef08a !important; opacity: 0.75; font-weight: 700 !important; }
        .m90-called { color: #4ade80 !important; opacity: 1 !important; font-weight: 900 !important; text-shadow: 0 0 8px rgba(74, 222, 128, 0.85) !important; }
        .m90-current { color: #f87171 !important; opacity: 1 !important; font-weight: 900 !important; text-shadow: 0 0 10px rgba(248, 113, 113, 1) !important; transform: scale(1.12); }

        .bds-order-strip {
          background: linear-gradient(180deg, #fde047 0%, #eab308 45%, #a16207 100%) !important;
          border: 1px solid #fef9c3 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.6) !important;
          display: grid !important;
          grid-template-columns: 1fr 1.25fr 1fr 1.15fr !important;
          align-items: center !important;
          padding: 6px 6px !important;
          gap: 4px !important;
          margin: 6px 0 !important;
          box-sizing: border-box !important;
        }
        .os-col {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          line-height: 1.15 !important;
          overflow: hidden !important;
        }
        .os-label {
          color: #422006 !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        .os-val {
          color: #090d16 !important;
          font-weight: 900 !important;
          font-size: 12.5px !important;
          white-space: nowrap !important;
        }
        .bds-ordem-box {
          background: rgba(0, 0, 0, 0.16) !important;
          border: 1px solid rgba(0, 0, 0, 0.12) !important;
          border-radius: 6px !important;
          padding: 3px 5px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 4px !important;
        }
        .os-ordem-text {
          color: #422006 !important;
          font-weight: 800 !important;
          font-size: 11px !important;
        }
        .os-ordem-num {
          color: #090d16 !important;
          font-weight: 900 !important;
          font-size: 15px !important;
        }

        .bds-live-ranking {
          background: #060c1e !important;
          border: 1px solid rgba(56, 189, 248, 0.3) !important;
          border-radius: 8px !important;
          box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.9) !important;
        }
        .bds-rank-row {
          background: linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.6) 100%) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07) !important;
          color: #e2e8f0 !important;
        }
        .rank-top-green {
          background: linear-gradient(90deg, rgba(6, 78, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%) !important;
          border-left: 3px solid #4ade80 !important;
        }
        .rank-user-row {
          background: linear-gradient(90deg, rgba(133, 77, 14, 0.8) 0%, rgba(66, 32, 6, 0.45) 100%) !important;
          border-top: 1px solid rgba(250, 204, 21, 0.8) !important;
          border-bottom: 1px solid rgba(250, 204, 21, 0.8) !important;
        }
        .rank-user-row .r-id, .rank-user-row .r-name { color: #fde047 !important; font-weight: 900 !important; }
        .r-id { color: #94a3b8 !important; font-weight: 700 !important; }
        .r-name { color: #f8fafc !important; font-weight: 700 !important; }

        .r-ball-pill {
          border-radius: 50% !important;
          width: 22px !important;
          height: 22px !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          font-size: 11px !important;
          font-weight: 900 !important;
          color: #ffffff !important;
          box-shadow: inset -1px -1px 3px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.5) !important;
        }
        .ball-color-0 { background: radial-gradient(circle at 30% 30%, #f87171, #b91c1c) !important; border: 1px solid #fca5a5 !important; }
        .ball-color-1 { background: radial-gradient(circle at 30% 30%, #4ade80, #15803d) !important; border: 1px solid #86efac !important; }
        .ball-color-2 { background: radial-gradient(circle at 30% 30%, #38bdf8, #0369a1) !important; border: 1px solid #7dd3fc !important; }
        .ball-color-3 { background: radial-gradient(circle at 30% 30%, #c084fc, #7e22ce) !important; border: 1px solid #d8b4fe !important; }

        .bds-tab-red {
          background: linear-gradient(180deg, #dc2626 0%, #7f1d1d 100%) !important;
          border: 1px solid #fca5a5 !important;
          border-radius: 8px !important;
          color: #ffffff !important;
          font-weight: 800 !important;
        }
        .bds-tab-yellow {
          background: linear-gradient(180deg, #fef08a 0%, #eab308 50%, #a16207 100%) !important;
          border: 1px solid #fef9c3 !important;
          border-radius: 8px !important;
          color: #1e1b4b !important;
          font-weight: 900 !important;
        }

        .bds-cards-two-cols {
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
        }
      `}</style>

      <div className="bds-mobile-container">
        
        {/* CABEÇALHO */}
        <header style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'linear-gradient(180deg, #0b1938 0%, #060d21 100%)', 
          padding: '10px 12px',
          borderBottom: '1px solid rgba(250, 204, 21, 0.35)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6)'
        }}>
          <div 
            onClick={() => setActiveModalView('NONE')} 
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              userSelect: 'none',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))'
            }}
          >
            <div style={{ display: 'flex', gap: '4px', marginBottom: '2px' }}>
              {[
                { l: 'N', bg: 'radial-gradient(circle at 30% 30%, #38bdf8, #0284c7 60%, #034975)' },
                { l: 'O', bg: 'radial-gradient(circle at 30% 30%, #f87171, #dc2626 60%, #7f1d1d)' },
                { l: 'V', bg: 'radial-gradient(circle at 30% 30%, #fde047, #eab308 60%, #854d0e)' },
                { l: 'O', bg: 'radial-gradient(circle at 30% 30%, #4ade80, #16a34a 60%, #14532d)' }
              ].map((ball, i) => (
                <div 
                  key={i} 
                  style={{
                    width: '25px',
                    height: '25px',
                    borderRadius: '50%',
                    background: ball.bg,
                    boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.6), inset 2px 2px 4px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '11px',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {ball.l}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              background: 'linear-gradient(180deg, #fef08a 0%, #eab308 50%, #a16207 100%)',
              color: '#3b1806',
              fontSize: '10px',
              fontWeight: '900',
              letterSpacing: '3px',
              padding: '1px 14px',
              borderRadius: '4px',
              border: '1px solid #fef9c3',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              textShadow: '0 1px 0 rgba(255,255,255,0.6)',
              transform: 'skew(-6deg)'
            }}>
              BINGO
            </div>
          </div>

          {!currentUser ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setActiveModalView('LOGIN')} type="button" style={{
                background: 'linear-gradient(180deg, #1e3a8a, #0f172a)', color: '#fff', border: '1px solid #38bdf8', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 0 8px rgba(56, 189, 248, 0.3)'
              }}>ENTRAR</button>
              <button onClick={() => setActiveModalView('REGISTER')} type="button" style={{
                background: 'linear-gradient(180deg, #facc15, #ca8a04)', color: '#1e1b4b', border: '1px solid #fef08a', padding: '6px 12px', fontSize: '12px', fontWeight: '900', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 0 10px rgba(250, 204, 21, 0.4)'
              }}>CRIAR CONTA</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ textAlign: 'right', lineHeight: '1.2', marginRight: '2px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '11px', fontWeight: '500' }}>Olá, <strong style={{color: '#fff'}}>{currentUser.username}</strong></div>
                <div style={{ color: '#facc15', fontSize: '13px', fontWeight: '900', textShadow: '0 0 8px rgba(250, 204, 21, 0.3)' }}>
                  R$ {currentUser.balance.toFixed(2).replace('.', ',')}
                </div>
              </div>

              <button onClick={() => setActiveModalView('DEPOSITAR')} type="button" style={{
                background: 'linear-gradient(180deg, rgba(14, 116, 144, 0.8), rgba(8, 51, 68, 0.9))', color: '#ffffff', border: '1px solid #38bdf8', padding: '7px 9px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 0 10px rgba(56, 189, 248, 0.35)'
              }}>DEPÓSITO</button>

              <button onClick={() => setActiveModalView('SACAR')} type="button" style={{
                background: 'linear-gradient(180deg, #16a34a, #14532d)', color: '#ffffff', border: '1px solid #4ade80', padding: '7px 9px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 0 10px rgba(74, 222, 128, 0.35)'
              }}>SACAR</button>
              
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)} type="button" style={{
                  background: 'linear-gradient(180deg, rgba(14, 116, 144, 0.8), rgba(8, 51, 68, 0.9))', color: '#ffffff', border: '1px solid #38bdf8', padding: '4px 7px', borderRadius: '6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '9px', fontWeight: '800', boxShadow: '0 0 10px rgba(56, 189, 248, 0.35)'
                }}>
                  <Menu size={15} color="#38bdf8" />
                  MENU
                </button>

                {menuOpen && (
                  <div style={{
                    position: 'absolute', top: '120%', right: 0, background: '#0b1938', border: '1px solid #eab308', borderRadius: '8px', zIndex: 1000, width: '165px', boxShadow: '0 8px 24px rgba(0,0,0,0.8)', overflow: 'hidden'
                  }}>
                    <div onClick={() => { setActiveModalView('DEPOSITAR'); setMenuOpen(false); }} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                      <DollarSign size={16} color="#facc15"/> Depósito
                    </div>
                    <div onClick={() => { setActiveModalView('SACAR'); setMenuOpen(false); }} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                      <Wallet size={16} color="#38bdf8"/> Sacar
                    </div>
                    <div onClick={() => { setHistoryModalOpen(true); setMenuOpen(false); }} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                      <Grid size={16} color="#4ade80"/> Extrato
                    </div>
                    <div onClick={() => { setActiveModalView('DADOS'); setMenuOpen(false); }} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                      <User size={16} color="#cbd5e1"/> Dados
                    </div>
                    <div onClick={handleLogout} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', fontSize: '14px', cursor: 'pointer' }}>
                      <LogOut size={16}/> Sair
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* TELA DE ESPERA */}
        {gameState === 'WAITING' && (
          <div className="bds-lobby-view">
            
            <div className="bds-timer-section">
              <button className="bds-round-menu-icon" onClick={() => setRulesModalOpen(true)} type="button"><HelpCircle color="#fde047" size={20} /></button>
              <div className="bds-timer-card">
                <div className="bds-timer-label">Próximo Sorteio</div>
                <div className="bds-timer-digits">{formatTimer(timeRemaining)}</div>
              </div>
            </div>

            <div className="bds-prizes-stack">
              <div className="bds-prize-line"><span className="p-name">Quadra</span><span className="p-val">R$ {prizes.kuadra.toFixed(2).replace('.', ',')}</span></div>
              <div className="bds-prize-line"><span className="p-name">Quina</span><span className="p-val">R$ {prizes.kina.toFixed(2).replace('.', ',')}</span></div>
              <div className="bds-prize-line"><span className="p-name">Bingo</span><span className="p-val">R$ {prizes.keno.toFixed(2).replace('.', ',')}</span></div>
            </div>

            <div className="bds-acumulado-bar">
              <span className="acumulado-Outline">ACUMULADO</span>
              <div className="acumulado-right">
                <span className="acumulado-red-box">R$ {prizes.acumulado.toFixed(2).replace('.', ',')}</span>
                <span className="acumulado-ball-badge">{prizes.bolaAcumulado}</span>
              </div>
            </div>

            <div className="bds-info-trio">
              <div className="bds-info-pill"><div className="pill-title">Sorteio</div><div className="pill-val">#{sorteioNum}</div></div>
              <div className="bds-info-pill"><div className="pill-title">Dia-Hora</div><div className="pill-val">{sorteioHoraInicio}</div></div>
              <div className="bds-info-pill"><div className="pill-title">Doação</div><div className="pill-val">R$ {betAmount.toFixed(2).replace('.', ',')}</div></div>
            </div>

            <div className="bds-halloween-banner">
              <div className="h-banner-title">PARTIDA ESPECIAL DE HALLOWEEN</div>
              <div className="h-banner-sub">+31/10 ÀS 22H00 • R$ 10.000,00 NO BINGO</div>
            </div>

            <div className="bds-quick-qty-bar">
              {[5, 10, 20, 30, 40, 50, 100, 200].map(v => (
                <button key={v} onClick={() => setQtyDirect(v)} type="button" className="bds-qty-chip">{v}</button>
              ))}
            </div>

            <div className="bds-buy-row">
              <div className="bds-stepper">
                <button onClick={() => updateQty(-1)} type="button">-</button>
                <span>{ticketQty}</span>
                <button onClick={() => updateQty(1)} type="button">+</button>
              </div>
              <div className="bds-total-box">R$ {(ticketQty * betAmount).toFixed(2).replace('.', ',')}</div>
              <button className="bds-doar-button" onClick={handleDoarClick} type="button">DOAR</button>
            </div>

            <div className="bds-cartelas-bar">
              <div className="bds-cartela-count-tab">Cartelas: {cards.length}</div>
              <div className="bds-zoom-btns">
                <button onClick={() => setCompactCards(true)} type="button">-</button>
                <button onClick={() => setCompactCards(false)} type="button">+</button>
              </div>
            </div>

            <div className="bds-cards-scroll-area">
              <div className="bds-cards-two-cols">
                {cards.map((c) => (
                  <BingoCard 
                    key={c.id} 
                    id={c.id} 
                    numbers={c.numbers} 
                    drawnNumbers={drawnNumbers} 
                    lastBall={lastBall} 
                    playerName={currentUser ? currentUser.username : 'VISITANTE'} 
                    compact={compactCards} 
                  />
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TELA DE SORTEIO AO VIVO */}
        {(gameState === 'DRAWING' || gameState === 'WINNERS_SUMMARY') && (
          <div className="bds-live-view">
            <div className="bds-live-prizes-row">
              <div className="bds-live-prize-pill"><div className="lp-title">Quadra</div><div className="lp-val">R$ {prizes.kuadra.toFixed(2).replace('.', ',')}</div></div>
              <div className="bds-live-prize-pill"><div className="lp-title">Quina</div><div className="lp-val">R$ {prizes.kina.toFixed(2).replace('.', ',')}</div></div>
              <div className="bds-live-prize-pill"><div className="lp-title">Bingo</div><div className="lp-val">R$ {prizes.keno.toFixed(2).replace('.', ',')}</div></div>
            </div>

            <div className="bds-live-acumulado-row">
              <span className="acumulado-Outline-sm">ACUMULADO</span>
              <span className="acumulado-red-box-sm">R$ {prizes.acumulado.toFixed(2).replace('.', ',')}</span>
              <span className="acumulado-ball-badge-sm">{prizes.bolaAcumulado}</span>
            </div>

            <div className="bds-draw-center">
              <div className="bds-globe-box">
                <div className="bds-globe-circle">
                  {previousBalls[0] && <div className="bds-prev-ball prev-pos-1"><span>{previousBalls[0].toString().padStart(2, '0')}</span></div>}
                  {previousBalls[1] && <div className="bds-prev-ball prev-pos-2"><span>{previousBalls[1].toString().padStart(2, '0')}</span></div>}
                  {previousBalls[2] && <div className="bds-prev-ball prev-pos-3"><span>{previousBalls[2].toString().padStart(2, '0')}</span></div>}
                  {lastBall && <div className="bds-main-ball"><div className="bds-main-ball-inner">{lastBall.toString().padStart(2, '0')}</div></div>}
                </div>
              </div>

              <div className="bds-matrix-90">
                {Array.from({ length: 90 }, (_, i) => i + 1).map(num => {
                  const isCurrent = Number(num) === Number(lastBall);
                  const isCalled = drawnNumbers.some(d => Number(d) === Number(num));
                  let numClass = 'm90-num';
                  if (isCurrent) numClass += ' m90-current';
                  else if (isCalled) numClass += ' m90-called';
                  return <span key={num} className={numClass}>{num.toString().padStart(2, '0')}</span>;
                })}
              </div>
            </div>

            <div className="bds-order-strip">
              <div className="os-col">
                <span className="os-label">Sorteio</span>
                <span className="os-val">#{sorteioNum}</span>
              </div>
              <div className="os-col">
                <span className="os-label">Hora</span>
                <span className="os-val">{sorteioHoraInicio}</span>
              </div>
              <div className="os-col">
                <span className="os-label">Doação</span>
                <span className="os-val">R$ {betAmount.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="bds-ordem-box">
                <span className="os-ordem-text">ORDEM</span>
                <span className="os-ordem-num">{drawnNumbers.length}</span>
              </div>
            </div>

            <div className="bds-live-ranking">
              {leaderboard.map((item, index) => (
                <div key={`${item.id}-${index}`} className={`bds-rank-row ${index === 0 ? 'rank-top-green' : ''} ${currentUser && item.player === currentUser.username ? 'rank-user-row' : ''}`}>
                  <span className="r-id">{item.id}</span>
                  <span className="r-name">{item.player}</span>
                  <div className="r-balls">
                    {item.missingBalls.slice(0, 6).map((b, bi) => (
                      <span key={bi} className={`r-ball-pill ball-color-${bi % 4}`}>{b}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bds-seeking-bar">
              <div className="bds-tab-red">Cartelas: {cards.length}</div>
              <div className="bds-tab-yellow">
                BUSCANDO {formatarNomePremio(currentTarget)}
              </div>
            </div>

            <div className="bds-live-cards-area">
              <div className="bds-cards-two-cols">
                {cards.map((c) => (
                  <BingoCard 
                    key={c.id} 
                    id={c.id} 
                    numbers={c.numbers} 
                    drawnNumbers={drawnNumbers} 
                    lastBall={lastBall} 
                    playerName={c.player} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAIS DIVERSOS */}
        <MatchHistoryModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} historyList={matchHistory} userTransactions={userTransactions} />
        <HowToPlayModal isOpen={rulesModalOpen} onClose={() => setRulesModalOpen(false)} />

        {/* POP-UP DE COMEMORAÇÃO DA PREMIAÇÃO */}
        {celebrationModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e3a8a, #0f172a)', border: '4px solid #facc15', borderRadius: '16px', padding: '30px',
              textAlign: 'center', boxShadow: '0 0 50px rgba(250, 204, 21, 0.8)', animation: 'pulse 1s infinite alternate', maxWidth: '95%', width: '450px'
            }}>
              <h1 style={{ color: '#facc15', fontSize: '32px', margin: '0 0 20px 0', textTransform: 'uppercase', textShadow: '2px 2px 4px #000' }}>
                🎉 BINGO {formatarNomePremio(celebrationModal.title)} 🎉
              </h1>
              
              <p style={{ color: '#e2e8f0', fontSize: '18px', marginBottom: '10px' }}>
                Ganhador{celebrationModal.winners.length > 1 ? 'es' : ''}:
              </p>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
                {celebrationModal.winners.map((w, idx) => (
                  <div key={idx} style={{ background: '#000', padding: '15px', borderRadius: '8px', border: '1px solid #38bdf8', marginBottom: '10px' }}>
                    <div style={{ color: '#38bdf8', fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {w.player}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>
                      Cartela #{w.id} • <span style={{ color: '#4ade80' }}>R$ {celebrationModal.prizePerWinner.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', margin: 0 }}>
                🎵 Comemorando premiação... Aguarde!
              </p>
            </div>
            <style>{`@keyframes pulse { from { transform: scale(1); } to { transform: scale(1.05); } }`}</style>
          </div>
        )}

        {/* QUADRO DE RESUMO FINAL COM TODOS OS GANHADORES */}
        {gameState === 'WINNERS_SUMMARY' && (
           <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
              <div style={{ background: 'linear-gradient(180deg, #0f172a 0%, #060b18 100%)', border: '3px solid #eab308', borderRadius: '14px', padding: '26px', width: '480px', maxWidth: '95%', textAlign: 'center', boxShadow: '0 0 40px rgba(234, 179, 8, 0.45)' }}>
                 <h2 style={{ color: '#facc15', fontSize: '24px', marginBottom: '18px', textTransform: 'uppercase', textShadow: '0 2px 4px #000' }}>
                   🏁 GANHADORES DO SORTEIO #{sorteioNum} 🏁
                 </h2>
                 
                 {['kuadra', 'kina', 'keno'].map((cat) => (
                    <div key={cat} style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '8px', borderLeft: cat==='keno'?'4px solid #facc15':'4px solid #38bdf8', textAlign: 'left' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                         <span style={{ color: cat==='keno'?'#facc15':'#38bdf8', fontWeight: '900', textTransform: 'uppercase', fontSize: '14px' }}>
                           {formatarNomePremio(cat)}
                         </span>
                         <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '13px' }}>
                           R$ {prizes[cat].toFixed(2).replace('.', ',')}
                         </span>
                       </div>
                       
                       {winnersList[cat] && winnersList[cat].length > 0 ? (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                           {winnersList[cat].map((w, idx) => (
                             <div key={idx} style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>
                               🏆 {typeof w === 'object' ? w.player : w} {typeof w === 'object' && w.id ? `(Cartela #${w.id})` : ''}
                               {typeof w === 'object' && w.prize ? <span style={{ color: '#4ade80', marginLeft: '6px' }}>+ R$ {w.prize.toFixed(2).replace('.', ',')}</span> : null}
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div style={{ color: '#94a3b8', fontSize: '13px' }}>Sem ganhador registrado</div>
                       )}
                    </div>
                 ))}
                 
                 <p style={{ color: '#fde047', marginTop: '18px', fontSize: '13px', fontStyle: 'italic', fontWeight: '600' }}>
                   ⏳ Próxima rodada iniciando em 10 segundos...
                 </p>
              </div>
           </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO DE COMPRA */}
        {confirmModal && (
          <div className="bds-modal-backdrop">
            <div className="bds-dialog-box">
              <div className="bds-dialog-header">
                <span>CONFIRMAÇÃO</span>
                <button onClick={() => setConfirmModal(false)} type="button"><X size={20} /></button>
              </div>
              <div className="bds-dialog-body">
                Confirmar doação para {ticketQty} cartelas no valor de R$ {(ticketQty * betAmount).toFixed(2).replace('.', ',')}?
              </div>
              <div className="bds-dialog-actions">
                <button className="btn-dialog-no" onClick={() => setConfirmModal(false)} type="button">Não</button>
                <button className="btn-dialog-yes" onClick={confirmPurchase} type="button">Sim</button>
              </div>
            </div>
          </div>
        )}

        {successModal && (
          <div className="bds-modal-backdrop">
            <div className="bds-dialog-box">
              <div className="bds-dialog-header"><span>CONFIRMAÇÃO</span></div>
              <div className="bds-dialog-body">Você recebeu {lastBoughtQty} cartelas.<br />Bom jogo</div>
              <div className="bds-dialog-actions">
                <button className="btn-dialog-continue" onClick={() => setSuccessModal(false)} type="button">Continuar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE REGISTRO */}
        {activeModalView === 'REGISTER' && (
          <div className="bds-modal-backdrop">
            <div className="auth-form-card">
              <div className="auth-modal-top">
                <h2>CRIAR CONTA</h2>
                <button onClick={() => setActiveModalView('NONE')} type="button"><X size={22}/></button>
              </div>
              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group"><label>CPF *:</label><input type="text" value={regCpf} onChange={e => setRegCpf(e.target.value)} placeholder="000.000.000-00" required /></div>
                <div className="form-group"><label>E-mail *:</label><input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="seu@email.com" required /></div>
                <div className="form-row-phone">
                  <div className="form-group" style={{flex: 1}}><label>Área:</label><input type="text" value="55 - Brasil" readOnly style={{background: '#f1f5f9'}} /></div>
                  <div className="form-group" style={{flex: 2}}><label>Telefone *:</label><input type="text" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="(99) 99999-9999" required /></div>
                </div>
                <div className="form-group"><label>Usuário *:</label><input type="text" value={regUser} onChange={e => setRegUser(e.target.value)} placeholder="Ex: RHONNI 🍀" required /></div>
                <div className="form-group"><label>Senha *:</label><input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="******" required minLength="6" /></div>
                <div className="form-group"><label>Confirmar Senha *:</label><input type="password" value={regPassConfirm} onChange={e => setRegPassConfirm(e.target.value)} placeholder="******" required minLength="6" /></div>
                
                <div className="form-checkbox-row">
                  <input type="checkbox" id="terms" checked={regTerms} onChange={e => setRegTerms(e.target.checked)} />
                  <label htmlFor="terms">Aceito os termos de uso e política de privacidade</label>
                </div>

                <button 
                  type="submit" 
                  style={{
                    width: '100%', padding: '14px', marginTop: '15px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px',
                    textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)'
                  }}
                >
                  CRIAR CONTA
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE LOGIN */}
        {activeModalView === 'LOGIN' && (
          <div className="bds-modal-backdrop">
            <div className="auth-form-card">
              <div className="auth-modal-top">
                <h2>Conecte-se</h2>
                <button onClick={() => setActiveModalView('NONE')} type="button"><X size={22}/></button>
              </div>
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group"><label>E-mail:</label><input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Seu E-mail" required /></div>
                <div className="form-group"><label>Senha:</label><input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="******" required /></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#475569' }}>
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    Lembrar e-mail
                  </label>
                  <span onClick={handleForgotPassword} style={{ color: '#0284c7', cursor: 'pointer', fontWeight: 'bold' }}>
                    Esqueci a senha
                  </span>
                </div>

                <button 
                  type="submit" 
                  style={{
                    width: '100%', padding: '14px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold',
                    letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  ENTRAR
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE DEPÓSITO */}
        <ModalDeposito 
          isOpen={activeModalView === 'DEPOSITAR' && currentUser}
          onClose={() => setActiveModalView('NONE')}
          currentUser={currentUser}
        />

        {/* MODAL DE SAQUE */}
        <ModalSaque 
          isOpen={activeModalView === 'SACAR' && currentUser}
          onClose={() => setActiveModalView('NONE')}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />

      </div>
    </div>
  );
}

export default App;
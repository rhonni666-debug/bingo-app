export default function BettingSlip({ 
   balance, 
   betAmount, 
   setBetAmount, 
   selectedNumbers, 
   onPlaceBet, 
   canBet 
}) {
  return (
    <div className="betting-slip">
      <h3>Painel de Aposta</h3>
      <p>Saldo: <span style={{color: 'var(--primary-color)'}}>R$ {balance.toFixed(2)}</span></p>
      <p>Números Selecionados: {selectedNumbers.length} de 5</p>
      
      <div className="bet-input-group">
        <label>Valor da Aposta (R$)</label>
        <input 
          type="number" 
          value={betAmount} 
          onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
          disabled={!canBet}
        />
      </div>

      <button 
        className="bet-button" 
        onClick={onPlaceBet}
        disabled={!canBet || betAmount <= 0}
      >
        APOSTAR
      </button>
    </div>
  );
}
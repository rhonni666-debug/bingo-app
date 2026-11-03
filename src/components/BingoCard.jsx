import React from 'react';

export default function BingoCard({ id, numbers = [], drawnNumbers = [], lastBall, playerName = "RHONNI", compact = false }) {
  // Organiza os 15 números em 3 linhas de 5 números
  const rows = [
    numbers.slice(0, 5),
    numbers.slice(5, 10),
    numbers.slice(10, 15)
  ];

  // Cria um conjunto de números sorteados convertidos para Number para busca instantânea e segura
  const drawnSet = new Set((drawnNumbers || []).map(n => Number(n)));
  const ultimoSorteado = lastBall !== null && lastBall !== undefined ? Number(lastBall) : null;

  return (
    <div style={{
      background: 'linear-gradient(180deg, #fde047 0%, #eab308 25%, #ca8a04 75%, #854d0e 100%)',
      borderRadius: compact ? '8px' : '12px',
      padding: compact ? '5px' : '8px',
      border: '1.5px solid #fef08a',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.8), inset 0 2px 3px rgba(255, 255, 255, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      marginBottom: '8px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* TOPO: NOME DO JOGADOR EM RELEVO DOURADO */}
      <div style={{
        textAlign: 'center',
        fontWeight: '900',
        fontSize: compact ? '12px' : '15px',
        color: '#422006',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        paddingBottom: compact ? '3px' : '5px',
        textShadow: '0 1px 0 rgba(255, 255, 255, 0.7)'
      }}>
        {playerName}
      </div>

      {/* GRELHA 3 LINHAS x 5 COLUNAS */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '2px' : '3px',
        background: '#040917',
        padding: compact ? '4px' : '6px',
        borderRadius: '8px',
        border: '1.5px solid #713f12',
        boxShadow: 'inset 0 3px 8px rgba(0, 0, 0, 0.95)'
      }}>
        {rows.map((row, rIdx) => (
          <div key={rIdx} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: compact ? '2px' : '3px'
          }}>
            {row.map((num, idx) => {
              const numVal = Number(num);
              const isLast = ultimoSorteado !== null && numVal === ultimoSorteado;
              const isHit = drawnSet.has(numVal);

              let cellStyle = {
                height: compact ? '26px' : '36px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: compact ? '12px' : '15px',
                transition: 'all 0.2s ease'
              };

              if (isLast) {
                // Última bola sorteada (Verde Neon brilhante)
                cellStyle = {
                  ...cellStyle,
                  background: 'radial-gradient(circle, #4ade80 0%, #15803d 100%)',
                  color: '#ffffff',
                  border: '1px solid #bbf7d0',
                  boxShadow: '0 0 12px rgba(74, 222, 128, 0.95)',
                  transform: 'scale(1.06)'
                };
              } else if (isHit) {
                // Número já sorteado (Dourado Marcado)
                cellStyle = {
                  ...cellStyle,
                  background: 'linear-gradient(180deg, #fde047 0%, #ca8a04 100%)',
                  color: '#1e1b4b',
                  border: '1px solid #fef08a',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 0 6px rgba(250, 204, 21, 0.5)'
                };
              } else {
                // Número normal ainda não cantado (Branco Perolado)
                cellStyle = {
                  ...cellStyle,
                  background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
                  color: '#090d16',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 2px 3px rgba(0, 0, 0, 0.5), inset 0 1px 0 #ffffff'
                };
              }

              return (
                <div key={idx} style={cellStyle}>
                  {numVal.toString().padStart(2, '0')}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* RODAPÉ: ID DA CARTELA */}
      <div style={{
        textAlign: 'center',
        paddingTop: compact ? '2px' : '4px',
        fontSize: compact ? '11px' : '13px',
        fontWeight: '900',
        color: '#2e1005',
        letterSpacing: '0.5px',
        textShadow: '0 1px 0 rgba(255, 255, 255, 0.5)'
      }}>
        #{id}
      </div>
    </div>
  );
}
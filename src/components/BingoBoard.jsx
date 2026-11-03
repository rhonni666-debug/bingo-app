import NumberBall from './NumberBall';

export default function BingoBoard({ 
   totalNumbers = 75, 
   selectedNumbers, 
   drawnNumbers, 
   onNumberSelect, 
   isGameActive 
}) {
  const numbers = Array.from({ length: totalNumbers }, (_, i) => i + 1);

  return (
    <div className="bingo-board">
      <div className="bingo-grid">
        {numbers.map((num) => (
          <NumberBall
            key={num}
            number={num}
            isSelected={selectedNumbers.includes(num)}
            isDrawn={drawnNumbers.includes(num)}
            onClick={onNumberSelect}
            disabled={!isGameActive || drawnNumbers.includes(num)}
          />
        ))}
      </div>
    </div>
  );
}
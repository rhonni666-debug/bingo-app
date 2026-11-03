import { motion } from 'framer-motion';

export default function NumberBall({ number, isSelected, isDrawn, onClick, disabled }) {
  const getClasses = () => {
    let classes = "number-ball";
    if (isSelected) classes += " selected";
    if (isDrawn) classes += " drawn";
    if (disabled) classes += " disabled";
    return classes;
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={getClasses()}
      onClick={() => !disabled && onClick(number)}
      disabled={disabled}
    >
      {number}
    </motion.button>
  );
}
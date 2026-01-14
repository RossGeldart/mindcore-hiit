import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ConfettiPiece = ({ x, delay, color }) => {
  return (
    <motion.div
      initial={{ 
        y: -20, 
        x: x, 
        rotate: 0, 
        scale: 0 
      }}
      animate={{ 
        y: ['0vh', '80vh'], 
        x: [x, x + (Math.random() * 100 - 50)],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
        scale: [1, 0.5],
        opacity: [1, 1, 0] 
      }}
      transition={{ 
        duration: 2 + Math.random() * 2, 
        delay: delay,
        ease: "easeOut",
        times: [0, 1]
      }}
      style={{
        position: 'fixed',
        width: '10px',
        height: '10px',
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        zIndex: 100,
        top: 0
      }}
    />
  );
};

const Confetti = ({ count = 50, duration = 3000 }) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    const colors = ['#FFC700', '#FF0000', '#2E3192', '#41BBC7', '#A0303B'];
    const newPieces = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setPieces(newPieces);

    const timer = setTimeout(() => {
      setPieces([]);
    }, duration + 2000);

    return () => clearTimeout(timer);
  }, [count, duration]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </div>
  );
};

export default Confetti;
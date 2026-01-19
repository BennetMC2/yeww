'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle';
}

const COLORS = [
  '#E07A5F', // coral (primary)
  '#FFE8DC', // light coral
  '#81B29A', // green
  '#F2CC8F', // gold
  '#3D405B', // navy
  '#FF6B6B', // red
  '#4ECDC4', // teal
];

export default function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (active) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 8 + 6,
          shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as ConfettiPiece['shape'],
        });
      }
      setPieces(newPieces);
      setIsVisible(true);

      // Clean up after duration
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setPieces([]), 500);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [active, duration]);

  if (!isVisible || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.shape !== 'triangle' ? piece.color : 'transparent',
            borderRadius: piece.shape === 'circle' ? '50%' : '0',
            borderLeft: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : undefined,
            borderRight: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : undefined,
            borderBottom: piece.shape === 'triangle' ? `${piece.size}px solid ${piece.color}` : undefined,
          }}
        />
      ))}
    </div>
  );
}

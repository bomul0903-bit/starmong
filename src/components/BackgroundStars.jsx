import React, { useMemo } from 'react';

const BackgroundStars = React.memo(() => {
  const stars = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.5,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 5}s`,
    })),
  []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            '--twinkle-duration': s.duration,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
});

export default BackgroundStars;

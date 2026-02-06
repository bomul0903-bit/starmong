// ConstellationDrawing.jsx
import React, { useState, useRef, useEffect } from 'react';

const ConstellationDrawing = ({ constellation }) => {
  const canvasRef = useRef(null);
  const [connectedStars, setConnectedStars] = useState([]);
  const [currentStar, setCurrentStar] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    drawCanvas();
  }, [connectedStars]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 배경 (밤하늘)
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 별 그리기
    constellation.stars.forEach(star => {
      const size = Math.max(3, 8 - star.magnitude);
      
      // 별 후광
      const starGradient = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, size * 3
      );
      starGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      starGradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.5)');
      starGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
      
      ctx.fillStyle = starGradient;
      ctx.beginPath();
      ctx.arc(star.x, star.y, size * 3, 0, Math.PI * 2);
      ctx.fill();

      // 별 본체
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
      ctx.fill();

      // 별 이름 (마우스 오버시)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px sans-serif';
      ctx.fillText(star.name, star.x + 10, star.y - 10);
    });

    // 사용자가 그린 선
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 2;
    connectedStars.forEach(([star1Id, star2Id]) => {
      const star1 = constellation.stars.find(s => s.id === star1Id);
      const star2 = constellation.stars.find(s => s.id === star2Id);
      
      ctx.beginPath();
      ctx.moveTo(star1.x, star1.y);
      ctx.lineTo(star2.x, star2.y);
      ctx.stroke();
    });

    // 정답 별자리 (완성시 표시)
    if (isComplete) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.lineWidth = 3;
      constellation.connections.forEach(([id1, id2]) => {
        const star1 = constellation.stars.find(s => s.id === id1);
        const star2 = constellation.stars.find(s => s.id === id2);
        
        ctx.beginPath();
        ctx.moveTo(star1.x, star1.y);
        ctx.lineTo(star2.x, star2.y);
        ctx.stroke();
      });
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 클릭한 위치에 별이 있는지 확인
    const clickedStar = constellation.stars.find(star => {
      const distance = Math.sqrt(
        Math.pow(star.x - x, 2) + Math.pow(star.y - y, 2)
      );
      return distance < 15;
    });

    if (clickedStar) {
      if (!currentStar) {
        setCurrentStar(clickedStar);
      } else {
        // 두 별 연결
        const newConnection = [currentStar.id, clickedStar.id];
        setConnectedStars([...connectedStars, newConnection]);
        setCurrentStar(null);

        // 정답 확인
        checkComplete([...connectedStars, newConnection]);
      }
    }
  };

  const checkComplete = (connections) => {
    if (connections.length === constellation.connections.length) {
      // 간단한 정답 체크 (더 정교한 로직 가능)
      setIsComplete(true);
    }
  };

  const handleReset = () => {
    setConnectedStars([]);
    setCurrentStar(null);
    setIsComplete(false);
  };

  const handleShowAnswer = () => {
    setConnectedStars(constellation.connections);
    setIsComplete(true);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#fff', marginBottom: '10px' }}>
        🌟 {constellation.name} 그리기
      </h1>
      
      <div style={{
        color: '#a0a0a0',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <p>별을 클릭해서 연결해보세요!</p>
        <p style={{ fontSize: '14px' }}>
          계절: {constellation.season} | 난이도: {constellation.difficulty}
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        style={{
          border: '2px solid #4a90e2',
          borderRadius: '10px',
          cursor: 'crosshair',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}
      />

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleReset}
          style={{
            padding: '10px 20px',
            background: '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 다시 시작
        </button>
        
        <button
          onClick={handleShowAnswer}
          style={{
            padding: '10px 20px',
            background: '#f39c12',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          💡 정답 보기
        </button>
      </div>

      {isComplete && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: 'rgba(255, 215, 0, 0.2)',
          borderRadius: '10px',
          color: '#ffd700',
          textAlign: 'center'
        }}>
          <h2>🎉 완성했어요!</h2>
          <p>{constellation.name}를 만들었습니다!</p>
        </div>
      )}
    </div>
  );
};

export default ConstellationDrawing;

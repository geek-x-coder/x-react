import React, { useState, useEffect } from 'react';
import './../App.css';

const SecurityWrapper = ({ children, userInfo={id:'testUser', ip:'127.0.0.1'} }) => {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    // 1. 화면 포커스 감지 이벤트 핸들러
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    const handleVisibility = () => {
      if (document.hidden) setIsBlurred(true);
      else setIsBlurred(false);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // 2. 우클릭 및 단축키(PrtSc, F12 등) 방지
    const preventCapture = (e) => {
      console.log('1111');
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // 개발자 도구
        (e.metaKey && e.shiftKey && e.key === '4') // macOS 스크린샷
      ) {
        alert('보안 정책상 스크린샷 및 개발자 도구 진입이 제한됩니다.');
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', preventCapture);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('keydown', preventCapture);
    };
  }, []);

  // 워터마크 생성 (화면을 가득 채울 만큼 반복)
  const renderWatermark = () => {
    const items = [];
    const text = `${userInfo.id} | ${
      userInfo.ip
    } | ${new Date().toLocaleDateString()}`;
    for (let i = 0; i < 50; i++) {
      items.push(
        <div key={i} className='watermark-text'>
          {text}
        </div>,
      );
    }
    return items;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 워터마크 레이어: Blur 여부와 상관없이 항상 존재하거나 유동적으로 조절 */}
      <div className='watermark-overlay'>{renderWatermark()}</div>

      {/* 실제 콘텐츠 영역 */}
      <div
        style={{
          filter: isBlurred ? 'blur(20px)' : 'none',
          transition: 'filter 0.2s ease-in-out',
          pointerEvents: isBlurred ? 'none' : 'auto',
        }}
      >
        {children}
      </div>

      {/* Blur 되었을 때 나타날 안내 문구 */}
      {isBlurred && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.1)',
            zIndex: 10000,
          }}
        >
          <h2 style={{ color: '#fff', textShadow: '1px 1px 5px #000' }}>
            보안을 위해 콘텐츠가 가려졌습니다.
          </h2>
        </div>
      )}
    </div>
  );
};

export default SecurityWrapper;

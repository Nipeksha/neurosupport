import React, { useEffect, useState } from 'react';
import { AvatarExpression } from '../types';

interface AvatarProps {
  expression: AvatarExpression;
  isSpeaking: boolean;
  isListening: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ expression, isSpeaking, isListening }) => {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  // Blink animation loop
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Lip sync animation
  useEffect(() => {
    let interval: any;
    if (isSpeaking) {
      interval = setInterval(() => {
        setMouthOpen((prev) => !prev);
      }, 150);
    } else {
      setMouthOpen(false);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // --- Style Constants based on "Girl in Suit" Reference ---
  const colors = {
    skin: '#FFDFC4',
    skinShadow: '#E8C0A0',
    hair: '#1A1A2E',
    hairHighlight: '#2E2E4A',
    suit: '#1F2937',
    shirt: '#F9FAFB',
    tie: '#111827',
    lips: '#D9777F',
    blush: '#FFB6C1',
    eyes: '#3E2723'
  };

  // --- Dynamic Facial Features ---

  const renderEyebrows = () => {
    // Default: Friendly
    let dLeft = "M100 135 Q130 125 160 135";
    let dRight = "M240 135 Q270 125 300 135";

    switch (expression) {
      case 'Excited':
        dLeft = "M100 125 Q130 110 160 125";
        dRight = "M240 125 Q270 110 300 125";
        break;
      case 'Sad':
      case 'Worried':
        dLeft = "M100 130 Q130 120 160 140"; // Slanted up inner
        dRight = "M240 140 Q270 120 300 130";
        break;
      case 'Nervous':
        dLeft = "M100 130 Q130 115 160 130"; 
        dRight = "M240 135 Q270 125 300 135"; // Asymmetric
        break;
      case 'Shy':
        dLeft = "M100 140 Q130 140 160 140"; // Flat/low
        dRight = "M240 140 Q270 140 300 140";
        break;
    }

    return (
      <g stroke={colors.hair} strokeWidth="5" fill="none" strokeLinecap="round">
        <path d={dLeft} />
        <path d={dRight} />
      </g>
    );
  };

  const renderEyes = () => {
    // Base eye shape
    if (blink) {
      return (
        <g stroke={colors.hair} strokeWidth="4" strokeLinecap="round">
          <path d="M100 160 Q130 170 160 160" />
          <path d="M240 160 Q270 170 300 160" />
        </g>
      );
    }

    let pupilY = 160;
    let eyeScaleY = 1;

    if (expression === 'Excited') eyeScaleY = 1.1;
    if (expression === 'Sad') { pupilY = 165; }
    if (expression === 'Nervous') { pupilY = 160; } // Shifty look handled by iris position if strictly needed, but simple is robust

    return (
      <g fill="white">
        {/* Sclera */}
        <ellipse cx="130" cy="160" rx="35" ry={25 * eyeScaleY} clipPath="url(#eyeClipLeft)" />
        <ellipse cx="270" cy="160" rx="35" ry={25 * eyeScaleY} clipPath="url(#eyeClipRight)" />
        
        {/* Iris */}
        <circle cx={expression === 'Nervous' ? "135" : "130"} cy={pupilY} r="18" fill={colors.eyes} />
        <circle cx={expression === 'Nervous' ? "275" : "270"} cy={pupilY} r="18" fill={colors.eyes} />
        
        {/* Highlights */}
        <circle cx="120" cy="150" r="6" fill="white" opacity="0.8" />
        <circle cx="260" cy="150" r="6" fill="white" opacity="0.8" />

        {/* Eyelashes */}
        <path d="M95 155 Q130 135 165 155" stroke={colors.hair} strokeWidth="3" fill="none" />
        <path d="M235 155 Q270 135 305 155" stroke={colors.hair} strokeWidth="3" fill="none" />
      </g>
    );
  };

  const renderMouth = () => {
    if (isSpeaking) {
       // Animated speaking mouth
       const ry = mouthOpen ? 20 : 5;
       return <ellipse cx="200" cy="240" rx="25" ry={ry} fill="#5C2E2E" />;
    }

    switch (expression) {
      case 'Friendly': // Soft smile
        return <path d="M160 235 Q200 255 240 235" stroke={colors.lips} strokeWidth="4" fill="none" strokeLinecap="round" />;
      case 'Excited': // Open mouth smile
        return <path d="M160 230 Q200 270 240 230 Z" fill="#5C2E2E" stroke={colors.lips} strokeWidth="2" />;
      case 'Sad': // Frown
        return <path d="M170 250 Q200 230 230 250" stroke={colors.lips} strokeWidth="4" fill="none" strokeLinecap="round" />;
      case 'Nervous': // Asymmetric / wavy
        return <path d="M170 240 Q190 230 210 240 T230 240" stroke={colors.lips} strokeWidth="4" fill="none" strokeLinecap="round" />;
      case 'Shy': // Small tight smile
        return <path d="M180 240 Q200 245 220 240" stroke={colors.lips} strokeWidth="4" fill="none" strokeLinecap="round" />;
      case 'Worried': // Small open O or flat
        return <ellipse cx="200" cy="245" rx="10" ry="8" stroke={colors.lips} strokeWidth="3" fill="none" />;
      default:
        return <path d="M160 235 Q200 255 240 235" stroke={colors.lips} strokeWidth="4" fill="none" strokeLinecap="round" />;
    }
  };

  const renderBlush = () => {
    if (['Shy', 'Excited', 'Friendly'].includes(expression)) {
      const opacity = expression === 'Shy' ? 0.4 : 0.2;
      return (
        <g fill={colors.blush} opacity={opacity} filter="url(#blur)">
          <ellipse cx="110" cy="200" rx="25" ry="15" />
          <ellipse cx="290" cy="200" rx="25" ry="15" />
        </g>
      );
    }
    return null;
  };

  return (
    <div className={`relative w-72 h-72 md:w-96 md:h-96 mx-auto transition-transform duration-500 ${isListening ? 'scale-105' : 'scale-100'}`}>
      <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
        <defs>
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
          </filter>
          <clipPath id="eyeClipLeft">
             <ellipse cx="130" cy="160" rx="35" ry="25" />
          </clipPath>
          <clipPath id="eyeClipRight">
             <ellipse cx="270" cy="160" rx="35" ry="25" />
          </clipPath>
        </defs>

        {/* Back Hair */}
        <path d="M80 100 Q200 60 320 100 L350 400 H50 L80 100" fill={colors.hair} />

        {/* Neck */}
        <rect x="170" y="280" width="60" height="60" fill={colors.skinShadow} />

        {/* Suit Body */}
        <g transform="translate(0, 320)">
            {/* Shoulders */}
            <path d="M50 0 Q100 -20 150 20 L150 80 H250 L250 20 Q300 -20 350 0 V100 H50 Z" fill={colors.suit} />
            {/* White Shirt Collar */}
            <path d="M150 20 L200 80 L250 20 L220 0 L200 10 L180 0 Z" fill={colors.shirt} />
            {/* Tie */}
            <path d="M200 10 L215 30 L200 80 L185 30 Z" fill={colors.tie} />
            {/* Lapels */}
            <path d="M150 20 L160 60 L100 80" stroke="#2D3748" strokeWidth="2" fill="none" />
            <path d="M250 20 L240 60 L300 80" stroke="#2D3748" strokeWidth="2" fill="none" />
        </g>

        {/* Face Shape */}
        <path d="M100 100 Q200 60 300 100 V200 Q300 320 200 340 Q100 320 100 200 V100 Z" fill={colors.skin} />

        {/* Features */}
        {renderBlush()}
        {renderEyes()}
        {renderEyebrows()}
        
        {/* Nose */}
        <path d="M195 190 Q200 210 205 190" stroke={colors.skinShadow} strokeWidth="2" fill="none" />

        {/* Mouth */}
        {renderMouth()}

        {/* Front Hair / Bangs */}
        <path d="M100 100 Q150 160 50 300" stroke={colors.hair} strokeWidth="2" fill="none" />
        <path d="M300 100 Q250 160 350 300" stroke={colors.hair} strokeWidth="2" fill="none" />
        <path d="M100 100 Q200 180 300 100 Q200 80 100 100" fill={colors.hair} />
        {/* Shine on hair */}
        <path d="M140 100 Q200 90 260 100" stroke={colors.hairHighlight} strokeWidth="5" fill="none" opacity="0.5" />

      </svg>
    </div>
  );
};

export default Avatar;
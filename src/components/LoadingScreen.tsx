// src/components/ui/LoadingScreen.tsx
"use client";

import React, { useEffect } from 'react';
import { CheckCircle, Clock, Users, BarChart3 } from 'lucide-react';

// Telegram Logo Component
function TelegramLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

// Функция для добавления CSS стилей
const injectLoadingStyles = () => {
  if (typeof document === 'undefined') return;
  
  const styleId = 'loading-animations-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes loadingPulse {
      0%, 100% { opacity: 0.4; transform: scale(0.95); }
      50% { opacity: 1; transform: scale(1.05); }
    }
    @keyframes loadingRotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes loadingBounce {
      0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
      40%, 43% { transform: translate3d(0, -15px, 0); }
      70% { transform: translate3d(0, -7px, 0); }
      90% { transform: translate3d(0, -2px, 0); }
    }
    @keyframes loadingFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes loadingGlow {
      0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
      50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.6); }
    }
    @keyframes telegramPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    @keyframes telegramSpin {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.05); }
      100% { transform: rotate(360deg) scale(1); }
    }
    @keyframes telegramGlow {
      0%, 100% { 
        box-shadow: 0 0 20px rgba(42, 171, 238, 0.5), 0 0 40px rgba(42, 171, 238, 0.2); 
      }
      50% { 
        box-shadow: 0 0 30px rgba(42, 171, 238, 0.8), 0 0 60px rgba(42, 171, 238, 0.4); 
      }
    }
    @keyframes telegramWave {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      25% { transform: translateY(-5px) rotate(5deg); }
      75% { transform: translateY(5px) rotate(-5deg); }
    }
    @keyframes telegramRipple {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    .loading-pulse { animation: loadingPulse 2s ease-in-out infinite; }
    .loading-rotate { animation: loadingRotate 1s linear infinite; }
    .loading-bounce { animation: loadingBounce 1.4s ease-in-out infinite; }
    .loading-float { animation: loadingFloat 2s ease-in-out infinite; }
    .loading-glow { animation: loadingGlow 2s ease-in-out infinite; }
    .telegram-pulse { animation: telegramPulse 1.5s ease-in-out infinite; }
    .telegram-spin { animation: telegramSpin 2s ease-in-out infinite; }
    .telegram-glow { animation: telegramGlow 2s ease-in-out infinite; }
    .telegram-wave { animation: telegramWave 3s ease-in-out infinite; }
    .telegram-ripple { animation: telegramRipple 1.5s ease-out infinite; }
    .loading-float:nth-child(2) { animation-delay: 0.5s; }
    .loading-float:nth-child(3) { animation-delay: 1s; }
    .telegram-ripple:nth-child(2) { animation-delay: 0.5s; }
    .telegram-ripple:nth-child(3) { animation-delay: 1s; }
  `;
  document.head.appendChild(style);
};

interface LoadingScreenProps {
  variant?: 'default' | 'minimal' | 'detailed' | 'telegram';
  message?: string;
}

export default function LoadingScreen({ 
  variant = 'default', 
  message = 'Загрузка...' 
}: LoadingScreenProps) {
  // Внедряем стили при монтировании компонента
  useEffect(() => {
    injectLoadingStyles();
  }, []);

  if (variant === 'telegram') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center">
          {/* Telegram Logo Animation */}
          <div className="relative mb-8">
            {/* Ripple effects */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-2 border-white/20 rounded-full telegram-ripple"></div>
              <div className="absolute w-32 h-32 border-2 border-white/20 rounded-full telegram-ripple"></div>
              <div className="absolute w-32 h-32 border-2 border-white/20 rounded-full telegram-ripple"></div>
            </div>
            
            {/* Main Telegram Logo */}
            <div className="relative z-10 w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center telegram-pulse telegram-glow">
              <TelegramLogo className="w-12 h-12 text-blue-500 telegram-wave" />
            </div>
          </div>

          {/* Loading Text */}
          <h2 className="text-2xl font-bold text-white mb-2 telegram-wave text-center">
            {/* ! To-DO */}
            Delegator-Controller
          </h2>
          <p className="text-blue-100 text-lg mb-6 text-center">{message}</p>

          {/* Floating dots in Telegram colors */}
          <div className="flex justify-center items-center space-x-2 mb-8">
            <div className="w-3 h-3 bg-white rounded-full loading-float opacity-80"></div>
            <div className="w-3 h-3 bg-white rounded-full loading-float opacity-60"></div>
            <div className="w-3 h-3 bg-white rounded-full loading-float opacity-40"></div>
          </div>

          {/* Progress indicator */}
          <div className="w-64 mx-auto">
            <div className="w-full bg-blue-400/30 rounded-full h-1">
              <div className="bg-white h-1 rounded-full loading-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full loading-rotate"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full loading-pulse"></div>
          </div>
          <p className="text-gray-600 font-medium text-center">{message}</p>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 flex flex-col items-center justify-center">
          {/* Animated logo/icon area */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto relative">
              {/* Outer ring */}
              <div className="absolute inset-0 w-20 h-20 border-4 border-blue-200 rounded-full loading-pulse"></div>
              {/* Spinning ring */}
              <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-blue-600 border-r-blue-400 rounded-full loading-rotate"></div>
              {/* Inner dot */}
              <div className="absolute inset-6 w-8 h-8 bg-blue-600 rounded-full loading-bounce"></div>
            </div>
          </div>

          {/* Loading text */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Система управления задачами
          </h2>
          <p className="text-gray-600 mb-6 text-center">{message}</p>

          {/* Loading steps */}
          <div className="space-y-3 mb-6">
            <LoadingStep icon={<CheckCircle className="h-4 w-4" />} text="Загрузка задач" completed />
            <LoadingStep icon={<Users className="h-4 w-4" />} text="Загрузка пользователей" loading />
            <LoadingStep icon={<BarChart3 className="h-4 w-4" />} text="Загрузка процессов" />
          </div>

          {/* Progress bar */}
          <div className="w-full">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full loading-pulse loading-glow" 
                style={{ width: '65%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center flex flex-col items-center justify-center">
        {/* Main loading animation */}
        <div className="relative mb-6">
          <div className="w-24 h-24 mx-auto relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 w-24 h-24 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-blue-600 rounded-full loading-rotate"></div>
            
            {/* Middle pulsing ring */}
            <div className="absolute inset-2 w-20 h-20 border-2 border-blue-300 rounded-full loading-pulse opacity-40"></div>
            
            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="h-8 w-8 text-blue-600 loading-pulse" />
            </div>
          </div>
        </div>

        {/* Loading text with typing animation */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
          {message}
        </h3>
        <p className="text-gray-500 text-sm text-center mb-4">
          Подготавливаем рабочее пространство
        </p>

        {/* Floating dots animation */}
        <div className="flex justify-center items-center space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full loading-float"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full loading-float"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full loading-float"></div>
        </div>
      </div>
    </div>
  );
}

// Helper component for loading steps
function LoadingStep({ 
  icon, 
  text, 
  completed = false, 
  loading = false 
}: { 
  icon: React.ReactNode; 
  text: string; 
  completed?: boolean; 
  loading?: boolean; 
}) {
  return (
    <div className={`flex items-center justify-center space-x-2 text-sm ${
      completed ? 'text-green-600' : loading ? 'text-blue-600' : 'text-gray-400'
    }`}>
      <div className={`flex items-center justify-center ${loading ? 'loading-rotate' : ''}`}>
        {icon}
      </div>
      <span className="text-center">{text}</span>
      {completed && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
      {loading && <div className="w-2 h-2 bg-blue-500 rounded-full loading-pulse"></div>}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto close
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const configs = {
    success: {
      icon: CheckCircle,
      bg: 'from-success-50 to-success-100',
      border: 'border-success-300',
      iconColor: 'text-success-600',
      textColor: 'text-success-900',
    },
    error: {
      icon: XCircle,
      bg: 'from-error-50 to-error-100',
      border: 'border-error-300',
      iconColor: 'text-error-600',
      textColor: 'text-error-900',
    },
    info: {
      icon: Info,
      bg: 'from-info-50 to-info-100',
      border: 'border-info-300',
      iconColor: 'text-info-600',
      textColor: 'text-info-900',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'from-warning-50 to-warning-100',
      border: 'border-warning-300',
      iconColor: 'text-warning-600',
      textColor: 'text-warning-900',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div
      className={`
        fixed top-4 right-4 z-[9999] max-w-md w-full
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          bg-gradient-to-r ${config.bg}
          border-2 ${config.border}
          rounded-xl shadow-elevated-lg
          p-4 backdrop-blur-sm
          flex items-start gap-3
        `}
      >
        <div className={`p-1 bg-white rounded-lg ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${config.textColor} font-semibold text-sm`}>
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="p-1 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

// Toast Container Component
export function ToastContainer() {
  return <div id="toast-container" className="fixed top-0 right-0 p-4 z-[9999] pointer-events-none"></div>;
}

// Toast Helper Function
let toastId = 0;

export function showToast(message: string, type: ToastType = 'info', duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const id = `toast-${toastId++}`;
  const toastDiv = document.createElement('div');
  toastDiv.id = id;
  toastDiv.style.pointerEvents = 'auto';
  container.appendChild(toastDiv);

  const onClose = () => {
    if (toastDiv.parentNode) {
      toastDiv.parentNode.removeChild(toastDiv);
    }
  };

  // This is a workaround for server-side rendering
  // In production, you would use React.createRoot or React.render
  toastDiv.innerHTML = `
    <div class="fixed top-4 right-4 max-w-md w-full transform transition-all duration-300 ease-out translate-x-0 opacity-100">
      <div class="bg-gradient-to-r ${getToastBg(type)} border-2 ${getToastBorder(type)} rounded-xl shadow-elevated-lg p-4 backdrop-blur-sm flex items-start gap-3">
        <div class="p-1 bg-white rounded-lg ${getToastIconColor(type)}">
          ${getToastIcon(type)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="${getToastTextColor(type)} font-semibold text-sm">${message}</p>
        </div>
        <button onclick="this.closest('#${id}').remove()" class="p-1 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0">
          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  `;

  setTimeout(() => {
    toastDiv.style.opacity = '0';
    toastDiv.style.transform = 'translateX(100%)';
    setTimeout(onClose, 300);
  }, duration);
}

function getToastBg(type: ToastType) {
  const bgs = {
    success: 'from-success-50 to-success-100',
    error: 'from-error-50 to-error-100',
    info: 'from-info-50 to-info-100',
    warning: 'from-warning-50 to-warning-100',
  };
  return bgs[type];
}

function getToastBorder(type: ToastType) {
  const borders = {
    success: 'border-success-300',
    error: 'border-error-300',
    info: 'border-info-300',
    warning: 'border-warning-300',
  };
  return borders[type];
}

function getToastIconColor(type: ToastType) {
  const colors = {
    success: 'text-success-600',
    error: 'text-error-600',
    info: 'text-info-600',
    warning: 'text-warning-600',
  };
  return colors[type];
}

function getToastTextColor(type: ToastType) {
  const colors = {
    success: 'text-success-900',
    error: 'text-error-900',
    info: 'text-info-900',
    warning: 'text-warning-900',
  };
  return colors[type];
}

function getToastIcon(type: ToastType) {
  const icons = {
    success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
  };
  return icons[type];
}

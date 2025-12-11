'use client'

import { ReactNode, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline'; 
import { createPortal } from 'react-dom';

interface ModalProps {
  style?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl'
};

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  style, 
  zIndex = 50, 
  title,
  size = 'lg'
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center px-4 py-6" 
      style={{ zIndex }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-opacity-50 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal container */}
      <div className={`relative w-full ${sizeClasses[size]} mx-auto`}>
        {/* Modal box */}
        <div className={`relative bg-white rounded-lg shadow-xl overflow-hidden ${style || ''}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            <button
              className="ml-auto p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={onClose}
              type="button"
            >
              <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
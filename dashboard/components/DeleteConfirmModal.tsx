'use client';

import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-medium rounded-xl border border-white/10 max-w-sm w-full p-4 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-0.5 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-xs text-text-secondary mb-2">{message}</p>
          {itemName && (
            <div className="glass-subtle rounded-lg p-2 mt-2">
              <p className="text-xs font-medium text-text-primary">{itemName}</p>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg glass-light hover:glass-medium text-text-primary font-medium transition-all hover:scale-105"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all hover:scale-105"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

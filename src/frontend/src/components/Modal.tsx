import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-panel border border-line rounded-card w-[90%] max-w-[520px] max-h-[85vh] overflow-y-auto shadow-card">
        <div className="flex justify-between items-center px-5 py-4 border-b border-line">
          <h3 className="text-[15px] font-bold tracking-[-0.2px] text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-line text-ink-2 grid place-items-center hover:bg-panel-soft cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

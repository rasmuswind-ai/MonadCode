import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-xl w-[90%] max-w-[520px] max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            className="bg-transparent border-none text-dim text-2xl leading-none p-1 cursor-pointer hover:text-text"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

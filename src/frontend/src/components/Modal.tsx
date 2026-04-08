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
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl w-[90%] max-w-[520px] max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center px-5 py-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-stone-300">{title}</h3>
          <button
            className="bg-transparent border-none text-stone-600 text-2xl leading-none p-1 cursor-pointer hover:text-stone-300 transition-colors duration-200"
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

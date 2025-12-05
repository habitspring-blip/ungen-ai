import { ReactNode, MouseEventHandler } from 'react';

interface CTAButtonProps {
  children: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export default function CTAButton({ children, onClick }: CTAButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 rounded-xl bg-black text-white font-medium hover:bg-black/90 active:scale-[.98] transition"
    >
      {children}
    </button>
  )
}

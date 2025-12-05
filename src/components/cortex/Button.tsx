import { ReactNode, ButtonHTMLAttributes } from 'react';

interface CortexButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function CortexButton({ children, ...props }: CortexButtonProps) {
  return (
    <button
      {...props}
      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition"
    >
      {children}
    </button>
  )
}

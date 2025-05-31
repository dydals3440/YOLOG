import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => void
}

export const ActionButton = ({ children, ...props }: Props) => {
  return (
    <button className="rounded p-1 transition-colors hover:bg-selection hover:text-body" {...props}>
      {children}
    </button>
  )
}

import type { ComponentPropsWithoutRef } from 'react'

const IconLink = ({ target = '_blank', children, ...props }: ComponentPropsWithoutRef<'a'>) => {
  return (
    <a
      style={{ '--lv-wait': '1' } as React.CSSProperties}
      className="rounded p-1 transition-colors hover:bg-selection hover:text-body"
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  )
}

export default IconLink

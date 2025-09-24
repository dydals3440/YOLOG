import type { ReactNode } from 'react';

interface HighlightProps {
  children: ReactNode;
  color?: 'yellow' | 'pink' | 'blue' | 'green' | 'orange';
}

const Highlight = ({ children, color = 'yellow' }: HighlightProps) => {
  const colorClasses: Record<string, string> = {
    yellow: '',
    pink: 'pink',
    blue: 'blue',
    green: 'green',
    orange: 'orange'
  };

  return (
    <mark className={colorClasses[color] || ''}>
      {children}
    </mark>
  );
};

export default Highlight;
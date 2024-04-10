import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// bg-blue-500 bg-red-500
// pt-1 pb-1 py-1로 머지함

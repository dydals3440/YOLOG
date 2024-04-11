import { Post } from '@/.velite';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// bg-blue-500 bg-red-500
// pt-1 pb-1 py-1로 머지함

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function sortPosts(posts: Array<Post>) {
  return posts.sort((a, b) => {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return 0;
  });
}

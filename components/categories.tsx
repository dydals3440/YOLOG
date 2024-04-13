'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from './ui/button';

interface CategoriesProps {
  categories: string[];
}

export function Categories({ categories }: CategoriesProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = new URLSearchParams(searchParams);

  const createPageURL = (category: string) => {
    if (category) {
      params.set('category', category);
    }
    return `${pathname}?${params.toString()}`;
  };

  return (
    <ul className='flex gap-5 mt-10'>
      <li key={'ALL'}>
        <Button
          onClick={() => router.push('/notion')}
          variant='outline'
          type='button'
        >
          ALL
        </Button>
      </li>
      {categories.map((category: string) => (
        <li key={category}>
          <Button
            onClick={() => router.push(`/notion?category=${category}`)}
            variant='outline'
            type='button'
          >
            {category}
          </Button>
        </li>
      ))}
    </ul>
  );
}

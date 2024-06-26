import { Calendar } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from './ui/button';
import { cn, formatDate } from '@/lib/utils';

interface NotionPostItemProps {
  id: string;
  slug: string;
  title: string;
  description?: string;
  date: string;
  category?: string;
}

export function NotionPostItem({
  id,
  slug,
  title,
  description,
  date,
  category,
}: NotionPostItemProps) {
  return (
    <article className='flex flex-col gap-2 border-border border-b py-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold'>
          <Link href={`/notion/${id}`}>{title}</Link>
        </h2>
        <div className='max-w-none text-muted-foreground'>{category}</div>
      </div>
      <div className='max-w-none text-muted-foreground'>{description}</div>
      <div className='flex justify-between items-center'>
        <dl>
          <dt className='sr-only'>Published On</dt>
          <dd className='text-sm sm:text-base font-medium flex items-center gap-1'>
            <Calendar className='h-4 w-4' />
            <time dateTime={date}>{formatDate(date)}</time>
          </dd>
        </dl>
        <Link
          href={`/notion/${id}`}
          className={cn(buttonVariants({ variant: 'link' }), 'py-0')}
        >
          더 보기 →
        </Link>
      </div>
    </article>
  );
}

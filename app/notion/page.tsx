import { NotionPostItem } from '@/components/notion-post-item';
import { QueryPagination } from '@/components/query-pagination';

const fetchFromNotion = async () => {
  const res = await fetch('http://localhost:3000/api/notion', {
    cache: 'no-store',
  });
  const data = await res.json();

  return data;
};

const POSTS_PER_PAGE = 5;

interface BlogPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function NotionPage({ searchParams }: BlogPageProps) {
  const data = await fetchFromNotion();
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = Math.ceil(data.length / POSTS_PER_PAGE);
  const displayPosts = data.slice(
    POSTS_PER_PAGE & (currentPage - 1),
    POSTS_PER_PAGE * currentPage
  );

  return (
    <div className='container max-w-6xl py-6 lg:py-10'>
      <div className='flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8'>
        <div className='flex-1 space-y-4'>
          <h1 className='inline-block font-black text-4xl lg:text-5xl'>
            Notion Study
          </h1>
          <p className='text-xl text-muted-foreground'>
            Notion DB에 학습한 내용을 기록하자.
          </p>
        </div>
      </div>
      <hr className='mt-8' />
      {displayPosts?.length > 0 ? (
        <ul className='flex flex-col'>
          {displayPosts.map((post: any) => {
            const { id, slug, date, title, summary, category } = post;

            return (
              <li key={id}>
                <NotionPostItem
                  id={id}
                  slug={slug}
                  date={date}
                  title={title}
                  description={summary}
                  category={category}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p>노션 데이터베이스에 기록한 내용이 없습니다.</p>
      )}
      <QueryPagination totalPages={totalPages} className='justify-end mt-4' />
    </div>
  );
}

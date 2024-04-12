import { NotionPostItem } from '@/components/notion-post-item';

const fetchFromNotion = async () => {
  const res = await fetch('http://localhost:3000/api/notion', {
    cache: 'no-store',
  });
  const data = await res.json();

  return data;
};

export default async function NotionPage() {
  const data = await fetchFromNotion();
  return (
    <div className='container max-w-6xl py-6 lg:py-10'>
      <div className='flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8'>
        <div className='flex-1 space-y-4'>
          <h1 className='inline-block font-black text-4xl lg:text-5xl'>
            Notion Study
          </h1>
          <p className='text-xl text-muted-foreground'>
            노션에서 학습한 내용을 받아오자.
          </p>
        </div>
      </div>
      <hr className='mt-8' />
      {data?.length > 0 ? (
        <ul className='flex flex-col'>
          {data.map((post: any) => {
            const { id, slug, date, title, summary } = post;
            return (
              <li key={id}>
                <NotionPostItem
                  id={id}
                  slug={slug}
                  date={date}
                  title={title}
                  description={summary}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p>노션 데이터베이스에 기록한 내용이 없습니다.</p>
      )}
    </div>
  );
}

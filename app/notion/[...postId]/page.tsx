import { NotionDetailPost } from '@/components/notion-detail-post';
import { Render } from '@9gustin/react-notion-render';
import '@9gustin/react-notion-render/dist/index.css';

const getPost = async (postId: string) => {
  const res = await fetch(
    `http://localhost:3000//api/notion/detail/${postId}`,
    {
      cache: 'no-store',
    }
  );

  return res.json();
};

interface IParams {
  postId: string;
}

export default async function PostPage({ params }: { params: IParams }) {
  const { postId } = params;
  const post = await getPost(postId);
  return (
    <article className='container py-6 prose dark:prose-invert max-w-3xl mx-auto'>
      {/* <NotionDetailPost blocks={post} /> */}
      <Render
        blocks={post}
        useStyles
        emptyBlocks
        slugifyFn={(text) => text.replace(/[^a-zA-Z0-9]/g, '_')}
      />
    </article>
  );
}

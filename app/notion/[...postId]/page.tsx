import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const getPost = async (postId: string) => {
  const res = await fetch(`http://localhost:3000/api/notion/${postId}`, {
    cache: 'no-store',
  });

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
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        children={post.parent}
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <SyntaxHighlighter
                {...rest}
                PreTag='div'
                language={match[1]}
                style={materialDark}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
        }}
      />
    </article>
  );
}

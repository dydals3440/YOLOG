import { ArrowTopIcon, CommentIcon } from '../ui/icons';
import ActionButton from './ActionButton';
import CopyLinkButton from './CopyLinkButton';

const PageActions = () => {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToComments = () => {
    const commentsSection = document.querySelector('.giscus');
    commentsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <ul className='mt-4 flex items-center gap-1 lg:mt-0' data-animate>
      <li className='inline-flex'>
        <CopyLinkButton />
      </li>
      <li className='inline-flex'>
        <ActionButton onClick={handleScrollToComments}>
          <CommentIcon />
          <span className='sr-only'>댓글으로 이동</span>
        </ActionButton>
      </li>
      <li className='inline-flex lg:hidden'>
        <ActionButton onClick={handleScrollToTop}>
          <ArrowTopIcon />
          <span className='sr-only'>상단으로 이동</span>
        </ActionButton>
      </li>
    </ul>
  );
};

export default PageActions;

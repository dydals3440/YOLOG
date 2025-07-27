import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  TwitterXIcon,
  FacebookIcon,
  LinkedinIcon,
  LinkIcon,
} from '@/components/ui/icons';

interface SocialShareProps {
  title: string;
  url: string;
}

type SharePlatform = 'twitter' | 'facebook' | 'linkedin' | 'native';

interface ShareOption {
  platform: SharePlatform;
  icon: React.ReactNode;
  label: string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    platform: 'twitter',
    icon: <TwitterXIcon className='w-5 h-5' />,
    label: 'Twitter에 공유',
  },
  {
    platform: 'facebook',
    icon: <FacebookIcon className='w-5 h-5' />,
    label: 'Facebook에 공유',
  },
  {
    platform: 'linkedin',
    icon: <LinkedinIcon className='w-5 h-5' />,
    label: 'LinkedIn에 공유',
  },
];

const ShareIcon = () => (
  <svg
    className='w-5 h-5'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
    />
  </svg>
);

export const SocialShare = ({ title, url }: SocialShareProps) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const getShareUrl = (platform: Exclude<SharePlatform, 'native'>) => {
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
    };

    return shareUrls[platform];
  };

  const handleNativeShare = async () => {
    if (!('share' in navigator)) return;

    try {
      await navigator.share({ title, url });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const handleShare = async (platform: SharePlatform) => {
    if (platform === 'native') {
      return handleNativeShare();
    }

    window.open(getShareUrl(platform), '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    setIsSharing(true);
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: '링크가 복사되었습니다!',
        description: '클립보드에 저장되었습니다.',
      });
    } catch (err) {
      toast({
        title: '복사 실패',
        description: '링크 복사에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const shareButtonClass =
    'w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors p-0';

  return (
    <div className='flex items-center gap-4 p-4 border rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'>
      <h3 className='text-sm font-bold text-gray-700 dark:text-white'>
        공유하기
      </h3>

      <div className='flex items-center gap-1.5'>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => handleShare('native')}
              className={`${shareButtonClass} text-xs gap-1`}
              title='공유하기'
              aria-label='네이티브 공유'
            >
              <ShareIcon />
            </Button>
            <div className='h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1' />
          </>
        )}

        {SHARE_OPTIONS.map(({ platform, icon, label }) => (
          <Button
            key={platform}
            variant='ghost'
            size='icon'
            onClick={() => handleShare(platform)}
            className={shareButtonClass}
            title={label}
            aria-label={label}
          >
            {icon}
          </Button>
        ))}

        <div className='h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1' />

        <Button
          variant='ghost'
          size='icon'
          onClick={handleCopyLink}
          disabled={isSharing}
          className={shareButtonClass}
          title='링크 복사'
          aria-label='링크 복사'
        >
          <LinkIcon className='w-5 h-5' />
        </Button>
      </div>
    </div>
  );
};

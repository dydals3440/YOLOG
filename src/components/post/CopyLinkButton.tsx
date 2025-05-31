import { useEffect, useState } from 'react'

import { useToast } from '@/hooks/use-toast'

import { CheckIcon, LinkIcon } from '../ui/icons'
import { ActionButton } from './ActionButton'

export const CopyLinkButton = () => {
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setIsCopied(true)
      toast({
        title: '✅ 링크를 복사했습니다!',
      })
    } catch {
      toast({
        title: '❌ 링크 복사에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <ActionButton onClick={handleCopyLink}>
      {isCopied ? <CheckIcon /> : <LinkIcon />}
      <span className="sr-only">링크 복사</span>
    </ActionButton>
  )
}

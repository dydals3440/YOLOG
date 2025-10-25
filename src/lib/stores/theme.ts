import { persistentAtom } from '@nanostores/persistent'
import { onMount } from 'nanostores'

import { changeGiscusTheme } from '@/components/post/GiscusComment'

export const THEME_MAP = {
  light: 'light',
  dark: 'dark',
  system: undefined,
} as const

export type ThemeKey = keyof typeof THEME_MAP
export type ThemeValue = (typeof THEME_MAP)[ThemeKey]

export const STORAGE_THEME_KEY = 'theme' as const

export const themeStore = persistentAtom<ThemeValue>(STORAGE_THEME_KEY, THEME_MAP.system)

const initThemeStoreSubscribe = () => {
  const applyTheme = (theme: ThemeValue) => {
    if (theme === THEME_MAP.dark) {
      changeGiscusTheme('dark')
      document.documentElement.classList.add('dark')
    } else if (theme === THEME_MAP.light) {
      changeGiscusTheme('light')
      document.documentElement.classList.remove('dark')
    }
  }

  let mediaQuery: MediaQueryList | null = null
  let mediaQueryHandler: ((event: MediaQueryListEvent | MediaQueryList) => void) | null = null

  themeStore.subscribe((theme) => {
    // 이전 리스너 정리
    if (mediaQuery && mediaQueryHandler) {
      mediaQuery.removeEventListener('change', mediaQueryHandler)
      mediaQueryHandler = null
    }

    if (theme !== THEME_MAP.system) {
      applyTheme(theme)
      mediaQuery = null
      return
    }

    // 시스템 테마 모드
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQueryHandler = (event: MediaQueryListEvent | MediaQueryList) => {
      applyTheme(event.matches ? THEME_MAP.dark : THEME_MAP.light)
    }

    mediaQuery.addEventListener('change', mediaQueryHandler)
    mediaQueryHandler(mediaQuery)
  })
}

if (typeof window !== 'undefined') {
  onMount(themeStore, initThemeStoreSubscribe)
}

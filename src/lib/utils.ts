import { type ClassValue, clsx } from 'clsx'
import dayjs from 'dayjs'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: Date) => {
  return dayjs(new Date(date)).format('MM/DD')
}

export const isProduction = import.meta.env.PROD

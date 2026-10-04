import { type ClassValue, clsx } from 'clsx'
import { isAxiosError } from 'axios'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data?.error?.message ?? fallback
  }
  return fallback
}

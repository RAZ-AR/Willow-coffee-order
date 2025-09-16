import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTelegramAuth } from './useTelegramAuth'

describe('useTelegramAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.location
    delete (window as any).location
    window.location = {
      search: '',
      href: 'http://localhost:3000'
    } as any
  })

  it('should return test mode ID "0000" when no real Telegram data', () => {
    // Mock no Telegram data
    delete (window as any).Telegram

    const { result } = renderHook(() => useTelegramAuth())

    expect(result.current.currentTgId).toBe('0000')
    expect(result.current.hasRealTgData).toBe(false)
    expect(result.current.isInTelegram).toBe(false)
  })

  it('should return real user ID when Telegram WebApp has user data', () => {
    // Mock real Telegram data
    ;(window as any).Telegram = {
      WebApp: {
        initData: 'user=%7B%22id%22%3A123456789%7D',
        initDataUnsafe: {
          user: { id: 123456789 }
        }
      }
    }

    const { result } = renderHook(() => useTelegramAuth())

    expect(result.current.currentTgId).toBe('123456789')
    expect(result.current.hasRealTgData).toBe(true)
    expect(result.current.tg.initDataUnsafe?.user?.id).toBe(123456789)
  })

  it('should extract user ID from URL parameters', () => {
    window.location.search = '?tgWebAppData=user%3D%257B%2522id%2522%253A987654321%257D'

    const { result } = renderHook(() => useTelegramAuth())

    expect(result.current.hasRealTgData).toBe(true)
    expect(result.current.tgWebAppData).toContain('user')
  })

  it('should detect Telegram environment correctly', () => {
    // Mock being inside Telegram WebView
    Object.defineProperty(window, 'parent', {
      value: {},
      writable: true
    })

    const { result } = renderHook(() => useTelegramAuth())

    expect(result.current.isInTelegram).toBe(true)
  })

  it('should handle debug mode', () => {
    window.location.search = '?debug=1'

    const { result } = renderHook(() => useTelegramAuth())

    // Debug mode should still return test ID
    expect(result.current.currentTgId).toBe('0000')
  })

  it('should handle force mode with Telegram environment', () => {
    window.location.search = '?force=1'
    Object.defineProperty(window, 'parent', {
      value: {},
      writable: true
    })

    const { result } = renderHook(() => useTelegramAuth())

    expect(result.current.hasRealTgData).toBe(true)
  })

  it('should create valid tg object even without real Telegram', () => {
    const { result } = renderHook(() => useTelegramAuth())

    expect(result.current.tg).toBeDefined()
    expect(result.current.tg.initDataUnsafe?.user?.id).toBe(0) // "0000" converted to number
  })

  it('should maintain consistency between calls', () => {
    const { result, rerender } = renderHook(() => useTelegramAuth())

    const firstId = result.current.currentTgId
    rerender()
    const secondId = result.current.currentTgId

    expect(firstId).toBe(secondId)
  })

  it('should log version check information', () => {
    const consoleSpy = vi.spyOn(console, 'log')

    renderHook(() => useTelegramAuth())

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('VERSION CHECK: useTelegramAuth.ts updated')
    )
  })

  it('should never use hardcoded ID 128136200', () => {
    const { result } = renderHook(() => useTelegramAuth())

    expect(result.current.currentTgId).not.toBe('128136200')
    expect(result.current.currentTgId).not.toBe(128136200)
  })
})
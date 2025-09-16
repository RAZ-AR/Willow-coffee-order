import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLoyalty } from './useLoyalty'
import { localStorageMock } from '../test/setup'

// Mock useApi
const mockApi = {
  getStars: vi.fn(),
  register: vi.fn()
}

vi.mock('./useApi', () => ({
  useApi: () => mockApi
}))

describe('useLoyalty', () => {
  const defaultProps = {
    tg: { initData: '', initDataUnsafe: { user: { id: 123456 } } },
    currentTgId: '123456',
    hasRealTgData: true,
    tgWebAppData: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Test Mode (ID 0000)', () => {
    it('should set fixed values for test mode', async () => {
      const { result } = renderHook(() =>
        useLoyalty({
          ...defaultProps,
          currentTgId: '0000'
        })
      )

      await waitFor(() => {
        expect(result.current.isLoadingCard).toBe(false)
      })

      expect(result.current.cardNumber).toBe('0000')
      expect(result.current.stars).toBe(0)
      expect(mockApi.getStars).not.toHaveBeenCalled()
    })

    it('should not poll stars in test mode', () => {
      vi.useFakeTimers()

      renderHook(() =>
        useLoyalty({
          ...defaultProps,
          currentTgId: '0000'
        })
      )

      // Fast-forward 20 seconds
      vi.advanceTimersByTime(20000)

      expect(mockApi.getStars).not.toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  describe('Real User Mode', () => {
    it('should check existing card without auto-registration', async () => {
      mockApi.getStars.mockResolvedValue({
        card: '1234',
        stars: 5
      })

      const { result } = renderHook(() => useLoyalty(defaultProps))

      await waitFor(() => {
        expect(result.current.isLoadingCard).toBe(false)
      })

      expect(mockApi.getStars).toHaveBeenCalledTimes(1)
      expect(mockApi.register).not.toHaveBeenCalled()
      expect(result.current.cardNumber).toBe('1234')
      expect(result.current.stars).toBe(5)
    })

    it('should handle no existing card gracefully', async () => {
      mockApi.getStars.mockResolvedValue(null)

      const { result } = renderHook(() => useLoyalty(defaultProps))

      await waitFor(() => {
        expect(result.current.isLoadingCard).toBe(false)
      })

      expect(result.current.cardNumber).toBe('')
      expect(result.current.stars).toBe(0)
    })

    it('should handle API errors gracefully', async () => {
      mockApi.getStars.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useLoyalty(defaultProps))

      await waitFor(() => {
        expect(result.current.isLoadingCard).toBe(false)
      })

      expect(result.current.cardNumber).toBe('')
      expect(result.current.stars).toBe(0)
    })
  })

  describe('localStorage Management', () => {
    it('should save card data to localStorage', async () => {
      mockApi.getStars.mockResolvedValue({
        card: '1234',
        stars: 5
      })

      renderHook(() => useLoyalty(defaultProps))

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('willow_card', '1234')
        expect(localStorageMock.setItem).toHaveBeenCalledWith('willow_stars', '5')
      })
    })

    it('should clear cache when owner changes', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'willow_owner_tg_id') return '999999'
        return null
      })

      renderHook(() => useLoyalty(defaultProps))

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_card')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_stars')
    })

    it('should restore data for same owner', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'willow_owner_tg_id') return '123456'
        if (key === 'willow_card') return '1234'
        if (key === 'willow_stars') return '5'
        return null
      })

      const { result } = renderHook(() => useLoyalty(defaultProps))

      expect(result.current.cardNumber).toBe('1234')
      expect(result.current.stars).toBe(5)
    })

    it('should clear orphaned cards without owner', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'willow_card') return '1234'
        if (key === 'willow_owner_tg_id') return null
        return null
      })

      renderHook(() => useLoyalty(defaultProps))

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_card')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_stars')
    })
  })

  describe('Reset Functionality', () => {
    it('should clear data when reset=1 in URL', () => {
      window.location.search = '?reset=1'

      renderHook(() => useLoyalty(defaultProps))

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_card')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_stars')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_cart')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_owner_tg_id')
    })
  })

  describe('Stars Polling', () => {
    it('should poll for stars updates every 15 seconds', async () => {
      vi.useFakeTimers()

      mockApi.getStars.mockResolvedValue({
        card: '1234',
        stars: 5
      })

      renderHook(() => useLoyalty(defaultProps))

      // Wait for initial load
      await waitFor(() => {
        expect(mockApi.getStars).toHaveBeenCalledTimes(1)
      })

      // Fast-forward 15 seconds
      vi.advanceTimersByTime(15000)

      await waitFor(() => {
        expect(mockApi.getStars).toHaveBeenCalledTimes(2)
      })

      vi.useRealTimers()
    })

    it('should update card and stars when they change', async () => {
      vi.useFakeTimers()

      // Initial response
      mockApi.getStars.mockResolvedValueOnce({
        card: '1234',
        stars: 5
      })

      const { result } = renderHook(() => useLoyalty(defaultProps))

      await waitFor(() => {
        expect(result.current.cardNumber).toBe('1234')
        expect(result.current.stars).toBe(5)
      })

      // Updated response
      mockApi.getStars.mockResolvedValueOnce({
        card: '1234',
        stars: 10
      })

      vi.advanceTimersByTime(15000)

      await waitFor(() => {
        expect(result.current.stars).toBe(10)
      })

      vi.useRealTimers()
    })
  })

  describe('updateStars function', () => {
    it('should update stars and save to localStorage', () => {
      const { result } = renderHook(() => useLoyalty(defaultProps))

      result.current.updateStars(15)

      expect(result.current.stars).toBe(15)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('willow_stars', '15')
    })
  })

  describe('Force localStorage clearing', () => {
    it('should clear all localStorage on every load for debugging', () => {
      renderHook(() => useLoyalty(defaultProps))

      // Check that all keys are cleared
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_card')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_stars')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_owner_tg_id')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test_user_id')
    })
  })
})
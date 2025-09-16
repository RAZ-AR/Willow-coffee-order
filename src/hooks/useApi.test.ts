import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useApi } from './useApi'

// Mock fetch
global.fetch = vi.fn()

describe('useApi', () => {
  const defaultProps = {
    tg: { initData: '', initDataUnsafe: { user: { id: 123456 } } },
    currentTgId: '123456',
    hasRealTgData: true,
    tgWebAppData: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Test Mode (ID 0000)', () => {
    const testProps = {
      ...defaultProps,
      currentTgId: '0000'
    }

    it('should return mock data for test mode register', async () => {
      const { result } = renderHook(() => useApi(testProps))

      const response = await result.current.register()

      expect(response).toEqual({
        ok: true,
        card: '0000',
        stars: 0
      })
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should return mock data for test mode getStars', async () => {
      const { result } = renderHook(() => useApi(testProps))

      const response = await result.current.getStars()

      expect(response).toEqual({
        card: '0000',
        stars: 0
      })
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should return mock data for test mode submitOrder', async () => {
      const { result } = renderHook(() => useApi(testProps))

      const mockOrder = {
        items: [{ id: '1', title: 'Test Coffee', qty: 1, unit_price: 100 }],
        total: 100,
        when: 'now',
        table: '5',
        payment: 'cash'
      }

      const response = await result.current.submitOrder(mockOrder)

      expect(response).toEqual({
        ok: true,
        order_id: expect.stringMatching(/^TEST_ORD_\d+$/),
        card: '0000',
        stars: 0,
        stars_earned: 1
      })
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('Real API Mode', () => {
    it('should call register API with correct user data', async () => {
      const mockResponse = {
        ok: true,
        card: '1234',
        stars: 5
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse
      })

      const { result } = renderHook(() => useApi(defaultProps))

      const response = await result.current.register()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('script.google.com'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"action":"register"')
        })
      )

      expect(response).toEqual(mockResponse)
    })

    it('should call getStars API with correct user data', async () => {
      const mockResponse = {
        card: '1234',
        stars: 10
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse
      })

      const { result } = renderHook(() => useApi(defaultProps))

      const response = await result.current.getStars()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('script.google.com'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"action":"get_stars"')
        })
      )

      expect(response).toEqual(mockResponse)
    })

    it('should submit order with correct data', async () => {
      const mockResponse = {
        ok: true,
        order_id: 'ORD001',
        card: '1234',
        stars: 15,
        stars_earned: 5
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse
      })

      const { result } = renderHook(() => useApi(defaultProps))

      const orderData = {
        items: [{ id: '1', title: 'Espresso', qty: 2, unit_price: 150 }],
        total: 300,
        when: 'now',
        table: '5',
        payment: 'cash'
      }

      const response = await result.current.submitOrder(orderData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('script.google.com'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"action":"submit_order"')
        })
      )

      const requestBody = JSON.parse((fetch as any).mock.calls[0][1].body)
      expect(requestBody.order).toMatchObject({
        items: orderData.items,
        total: orderData.total,
        when: orderData.when,
        table: orderData.table,
        payment: orderData.payment
      })

      expect(response).toEqual(mockResponse)
    })

    it('should handle network errors gracefully', async () => {
      ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useApi(defaultProps))

      const response = await result.current.getStars()

      expect(response).toBeNull()
    })

    it('should handle non-ok HTTP responses', async () => {
      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server Error'
      })

      const { result } = renderHook(() => useApi(defaultProps))

      const response = await result.current.register()

      expect(response).toBeNull()
    })

    it('should handle malformed JSON responses', async () => {
      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'Invalid JSON',
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      const { result } = renderHook(() => useApi(defaultProps))

      const response = await result.current.getStars()

      expect(response).toBeNull()
    })
  })

  describe('User Object Creation', () => {
    it('should create user object from currentTgId when no real Telegram data', () => {
      const propsWithoutTg = {
        tg: null,
        currentTgId: '987654',
        hasRealTgData: false,
        tgWebAppData: null
      }

      const { result } = renderHook(() => useApi(propsWithoutTg))

      // Trigger API call to check user object creation
      result.current.register()

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"id":987654')
        })
      )
    })

    it('should use real Telegram user data when available', () => {
      const propsWithRealTg = {
        tg: {
          initDataUnsafe: {
            user: {
              id: 123456789,
              username: 'testuser',
              first_name: 'Test'
            }
          }
        },
        currentTgId: '123456789',
        hasRealTgData: true,
        tgWebAppData: null
      }

      const { result } = renderHook(() => useApi(propsWithRealTg))

      result.current.register()

      const requestBody = JSON.parse((fetch as any).mock.calls[0][1].body)
      expect(requestBody.user).toMatchObject({
        id: 123456789,
        username: 'testuser',
        first_name: 'Test'
      })
    })
  })

  describe('tgWebAppData parameter', () => {
    it('should include tgWebAppData in API calls when available', () => {
      const propsWithWebAppData = {
        ...defaultProps,
        tgWebAppData: 'user%3D%7B%22id%22%3A123456%7D'
      }

      const { result } = renderHook(() => useApi(propsWithWebAppData))

      result.current.getStars()

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"tgWebAppData"')
        })
      )
    })
  })
})
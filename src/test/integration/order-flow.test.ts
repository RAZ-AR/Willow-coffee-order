import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTelegramAuth } from '../../hooks/useTelegramAuth'
import { useLoyalty } from '../../hooks/useLoyalty'
import { useApi } from '../../hooks/useApi'

// Mock fetch for integration tests
global.fetch = vi.fn()

describe('Order Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset window state
    delete (window as any).Telegram
    window.location.search = ''
  })

  describe('Complete Order Flow - Test Mode', () => {
    it('should handle complete order flow in test mode', async () => {
      // Setup test mode environment
      window.location.search = '?debug=1'

      // Step 1: Telegram Auth should return test ID
      const { result: authResult } = renderHook(() => useTelegramAuth())

      expect(authResult.current.currentTgId).toBe('0000')
      expect(authResult.current.hasRealTgData).toBe(false)

      // Step 2: Loyalty should set test values
      const { result: loyaltyResult } = renderHook(() =>
        useLoyalty({
          tg: authResult.current.tg,
          currentTgId: authResult.current.currentTgId,
          hasRealTgData: authResult.current.hasRealTgData,
          tgWebAppData: null
        })
      )

      await waitFor(() => {
        expect(loyaltyResult.current.isLoadingCard).toBe(false)
      })

      expect(loyaltyResult.current.cardNumber).toBe('0000')
      expect(loyaltyResult.current.stars).toBe(0)

      // Step 3: API should work in test mode
      const { result: apiResult } = renderHook(() =>
        useApi({
          tg: authResult.current.tg,
          currentTgId: authResult.current.currentTgId,
          hasRealTgData: authResult.current.hasRealTgData,
          tgWebAppData: null
        })
      )

      // Step 4: Submit test order
      const orderData = {
        items: [
          { id: '1', title: 'Test Coffee', qty: 1, unit_price: 500 }
        ],
        total: 500,
        when: 'now',
        table: '5',
        payment: 'cash'
      }

      const orderResponse = await apiResult.current.submitOrder(orderData)

      expect(orderResponse).toMatchObject({
        ok: true,
        card: '0000',
        stars: 0,
        stars_earned: 5, // 500 RSD = 5 stars
        order_id: expect.stringMatching(/^TEST_ORD_\d+$/)
      })

      // Verify no real API calls were made
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('Complete Order Flow - Real User', () => {
    it('should handle complete order flow for real user', async () => {
      // Setup real Telegram environment
      ;(window as any).Telegram = {
        WebApp: {
          initData: 'user=%7B%22id%22%3A123456789%7D',
          initDataUnsafe: {
            user: { id: 123456789, username: 'testuser', first_name: 'Test' }
          }
        }
      }

      // Mock API responses
      const mockRegisterResponse = {
        ok: true,
        card: '1234',
        stars: 0
      }

      const mockOrderResponse = {
        ok: true,
        order_id: 'ORD001',
        card: '1234',
        stars: 5,
        stars_earned: 5
      }

      ;(fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRegisterResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOrderResponse
        })

      // Step 1: Telegram Auth
      const { result: authResult } = renderHook(() => useTelegramAuth())

      expect(authResult.current.currentTgId).toBe('123456789')
      expect(authResult.current.hasRealTgData).toBe(true)

      // Step 2: Loyalty check (should find existing card)
      const { result: loyaltyResult } = renderHook(() =>
        useLoyalty({
          tg: authResult.current.tg,
          currentTgId: authResult.current.currentTgId,
          hasRealTgData: authResult.current.hasRealTgData,
          tgWebAppData: null
        })
      )

      await waitFor(() => {
        expect(loyaltyResult.current.isLoadingCard).toBe(false)
      })

      // Should have called getStars API
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('script.google.com'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"action":"stars"')
        })
      )

      // Step 3: Submit order
      const { result: apiResult } = renderHook(() =>
        useApi({
          tg: authResult.current.tg,
          currentTgId: authResult.current.currentTgId,
          hasRealTgData: authResult.current.hasRealTgData,
          tgWebAppData: null
        })
      )

      const orderData = {
        items: [
          { id: '1', title: 'Espresso', qty: 1, unit_price: 500 }
        ],
        total: 500,
        when: 'now',
        table: '3',
        payment: 'card'
      }

      const orderResponse = await apiResult.current.submitOrder(orderData)

      expect(orderResponse).toEqual(mockOrderResponse)

      // Verify order API was called with correct data
      const orderCall = (fetch as any).mock.calls.find((call: any) =>
        call[1].body.includes('"action":"order"')
      )
      expect(orderCall).toBeDefined()

      const requestBody = JSON.parse(orderCall[1].body)
      expect(requestBody.user.id).toBe(123456789)
      expect(requestBody.total).toBe(500)
      expect(requestBody.items[0].title).toBe('Espresso')
    })
  })

  describe('User Switching Flow', () => {
    it('should handle switching between different users', async () => {
      // Mock localStorage
      const mockLocalStorage = new Map()
      const localStorageMock = {
        getItem: vi.fn((key) => mockLocalStorage.get(key) || null),
        setItem: vi.fn((key, value) => mockLocalStorage.set(key, value)),
        removeItem: vi.fn((key) => mockLocalStorage.delete(key)),
        clear: vi.fn(() => mockLocalStorage.clear())
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })

      // User 1: Setup
      ;(window as any).Telegram = {
        WebApp: {
          initDataUnsafe: { user: { id: 111111 } }
        }
      }

      const { result: auth1 } = renderHook(() => useTelegramAuth())
      expect(auth1.current.currentTgId).toBe('111111')

      // Mock API response for user 1
      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ card: '1111', stars: 5 })
      })

      const { result: loyalty1 } = renderHook(() =>
        useLoyalty({
          tg: auth1.current.tg,
          currentTgId: auth1.current.currentTgId,
          hasRealTgData: true,
          tgWebAppData: null
        })
      )

      await waitFor(() => {
        expect(loyalty1.current.cardNumber).toBe('1111')
        expect(loyalty1.current.stars).toBe(5)
      })

      // User 2: Switch
      ;(window as any).Telegram = {
        WebApp: {
          initDataUnsafe: { user: { id: 222222 } }
        }
      }

      const { result: auth2 } = renderHook(() => useTelegramAuth())
      expect(auth2.current.currentTgId).toBe('222222')

      // Mock API response for user 2
      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ card: '2222', stars: 10 })
      })

      const { result: loyalty2 } = renderHook(() =>
        useLoyalty({
          tg: auth2.current.tg,
          currentTgId: auth2.current.currentTgId,
          hasRealTgData: true,
          tgWebAppData: null
        })
      )

      await waitFor(() => {
        expect(loyalty2.current.cardNumber).toBe('2222')
        expect(loyalty2.current.stars).toBe(10)
      })

      // Verify localStorage was cleared when switching users
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_card')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('willow_stars')
    })
  })

  describe('Error Handling Integration', () => {
    it('should gracefully handle API failures during order flow', async () => {
      // Setup real user
      ;(window as any).Telegram = {
        WebApp: {
          initDataUnsafe: { user: { id: 123456 } }
        }
      }

      const { result: authResult } = renderHook(() => useTelegramAuth())

      // Mock API failure
      ;(fetch as any).mockRejectedValue(new Error('Network error'))

      const { result: loyaltyResult } = renderHook(() =>
        useLoyalty({
          tg: authResult.current.tg,
          currentTgId: authResult.current.currentTgId,
          hasRealTgData: true,
          tgWebAppData: null
        })
      )

      await waitFor(() => {
        expect(loyaltyResult.current.isLoadingCard).toBe(false)
      })

      // Should handle error gracefully
      expect(loyaltyResult.current.cardNumber).toBe('')
      expect(loyaltyResult.current.stars).toBe(0)

      // API should also handle errors
      const { result: apiResult } = renderHook(() =>
        useApi({
          tg: authResult.current.tg,
          currentTgId: authResult.current.currentTgId,
          hasRealTgData: true,
          tgWebAppData: null
        })
      )

      const orderResponse = await apiResult.current.submitOrder({
        items: [],
        total: 0,
        when: 'now',
        table: '',
        payment: 'cash'
      })

      expect(orderResponse).toBeNull()
    })
  })

  describe('Stars Calculation Integration', () => {
    it('should correctly calculate and award stars', async () => {
      // Test different order amounts
      const testCases = [
        { amount: 100, expectedStars: 1 },
        { amount: 500, expectedStars: 5 },
        { amount: 1000, expectedStars: 10 },
        { amount: 99, expectedStars: 0 },   // Below 100 threshold
        { amount: 550, expectedStars: 5 }   // Rounds down
      ]

      for (const testCase of testCases) {
        // Setup test mode
        const { result: authResult } = renderHook(() => useTelegramAuth())
        const { result: apiResult } = renderHook(() =>
          useApi({
            tg: authResult.current.tg,
            currentTgId: '0000', // Test mode
            hasRealTgData: false,
            tgWebAppData: null
          })
        )

        const orderData = {
          items: [{ id: '1', title: 'Test Item', qty: 1, unit_price: testCase.amount }],
          total: testCase.amount,
          when: 'now',
          table: '1',
          payment: 'cash'
        }

        const response = await apiResult.current.submitOrder(orderData)

        expect(response?.stars_earned).toBe(testCase.expectedStars)
      }
    })
  })
})
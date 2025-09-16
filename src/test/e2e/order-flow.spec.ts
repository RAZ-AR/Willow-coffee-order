import { test, expect } from '@playwright/test'

test.describe('Willow Coffee Order Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state
    await page.goto('/?debug=1&reset=1')
    await page.waitForLoadState('networkidle')
  })

  test('should display test mode card in header', async ({ page }) => {
    // Check that test mode card is displayed
    await expect(page.locator('[data-testid="loyalty-header"]')).toContainText('#0000')
    await expect(page.locator('[data-testid="loyalty-header"]')).toContainText('⭐ 0')
  })

  test('should complete full order flow in test mode', async ({ page }) => {
    // Verify we're in test mode
    await expect(page.locator('[data-testid="loyalty-header"]')).toContainText('#0000')

    // Navigate to menu (if not already there)
    const menuItems = page.locator('[data-testid="menu-item"]')
    await expect(menuItems.first()).toBeVisible()

    // Add first item to cart
    await menuItems.first().locator('[data-testid="add-to-cart"]').click()

    // Check cart has item
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    await expect(cartCounter).toContainText('1')

    // Go to cart
    await page.locator('[data-testid="cart-button"]').click()

    // Fill order form
    await page.locator('[data-testid="order-when-now"]').click()
    await page.locator('[data-testid="order-table"]').fill('5')
    await page.locator('[data-testid="order-payment-cash"]').click()

    // Submit order
    await page.locator('[data-testid="submit-order"]').click()

    // Check success message
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-success"]')).toContainText('TEST_ORD_')
  })

  test('should handle empty cart gracefully', async ({ page }) => {
    // Try to go to cart when empty
    await page.locator('[data-testid="cart-button"]').click()

    // Should show empty cart message
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible()

    // Submit button should be disabled
    await expect(page.locator('[data-testid="submit-order"]')).toBeDisabled()
  })

  test('should calculate total correctly', async ({ page }) => {
    // Add multiple items
    const menuItems = page.locator('[data-testid="menu-item"]')

    // Get price of first item
    const firstItemPrice = await menuItems.first().locator('[data-testid="item-price"]').textContent()
    const price1 = parseInt(firstItemPrice?.replace(/\D/g, '') || '0')

    // Add first item twice
    await menuItems.first().locator('[data-testid="add-to-cart"]').click()
    await menuItems.first().locator('[data-testid="add-to-cart"]').click()

    // Add second item once
    const secondItemPrice = await menuItems.nth(1).locator('[data-testid="item-price"]').textContent()
    const price2 = parseInt(secondItemPrice?.replace(/\D/g, '') || '0')
    await menuItems.nth(1).locator('[data-testid="add-to-cart"]').click()

    // Check cart counter
    await expect(page.locator('[data-testid="cart-counter"]')).toContainText('3')

    // Go to cart and check total
    await page.locator('[data-testid="cart-button"]').click()

    const expectedTotal = (price1 * 2) + price2
    await expect(page.locator('[data-testid="cart-total"]')).toContainText(expectedTotal.toString())
  })

  test('should show correct stars calculation in test mode', async ({ page }) => {
    // Add expensive item (500+ RSD to get stars)
    const menuItems = page.locator('[data-testid="menu-item"]')

    // Find item with price >= 500 RSD
    let expensiveItemFound = false
    const itemCount = await menuItems.count()

    for (let i = 0; i < itemCount; i++) {
      const priceText = await menuItems.nth(i).locator('[data-testid="item-price"]').textContent()
      const price = parseInt(priceText?.replace(/\D/g, '') || '0')

      if (price >= 500) {
        await menuItems.nth(i).locator('[data-testid="add-to-cart"]').click()
        expensiveItemFound = true
        break
      }
    }

    if (!expensiveItemFound) {
      // Add multiple cheaper items to reach 500+
      for (let i = 0; i < 3; i++) {
        await menuItems.first().locator('[data-testid="add-to-cart"]').click()
      }
    }

    // Complete order
    await page.locator('[data-testid="cart-button"]').click()
    await page.locator('[data-testid="order-when-now"]').click()
    await page.locator('[data-testid="order-table"]').fill('3')
    await page.locator('[data-testid="order-payment-card"]').click()
    await page.locator('[data-testid="submit-order"]').click()

    // Check that stars earned is shown in success message
    await expect(page.locator('[data-testid="order-success"]')).toContainText('⭐')
  })

  test('should handle different payment methods', async ({ page }) => {
    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().locator('[data-testid="add-to-cart"]').click()
    await page.locator('[data-testid="cart-button"]').click()

    // Fill form with card payment
    await page.locator('[data-testid="order-when-now"]').click()
    await page.locator('[data-testid="order-table"]').fill('1')
    await page.locator('[data-testid="order-payment-card"]').click()

    // Verify card payment is selected
    await expect(page.locator('[data-testid="order-payment-card"]')).toBeChecked()

    // Switch to cash
    await page.locator('[data-testid="order-payment-cash"]').click()
    await expect(page.locator('[data-testid="order-payment-cash"]')).toBeChecked()

    // Submit order
    await page.locator('[data-testid="submit-order"]').click()
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible()
  })

  test('should handle different timing options', async ({ page }) => {
    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().locator('[data-testid="add-to-cart"]').click()
    await page.locator('[data-testid="cart-button"]').click()

    // Test "now" option
    await page.locator('[data-testid="order-when-now"]').click()
    await expect(page.locator('[data-testid="order-table"]')).toBeVisible()

    // Test "later" option
    await page.locator('[data-testid="order-when-later"]').click()
    await expect(page.locator('[data-testid="order-table"]')).not.toBeVisible()

    // Complete order with later option
    await page.locator('[data-testid="order-payment-cash"]').click()
    await page.locator('[data-testid="submit-order"]').click()
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().locator('[data-testid="add-to-cart"]').click()
    await page.locator('[data-testid="cart-button"]').click()

    // Try to submit without filling required fields
    await page.locator('[data-testid="submit-order"]').click()

    // Should show validation errors or button should remain disabled
    // This depends on implementation - check if submit button is disabled
    const submitButton = page.locator('[data-testid="submit-order"]')
    const isDisabled = await submitButton.isDisabled()

    if (!isDisabled) {
      // If not disabled, there should be validation messages
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
    }
  })

  test('should persist cart items during navigation', async ({ page }) => {
    // Add items to cart
    await page.locator('[data-testid="menu-item"]').first().locator('[data-testid="add-to-cart"]').click()
    await page.locator('[data-testid="menu-item"]').nth(1).locator('[data-testid="add-to-cart"]').click()

    // Check cart counter
    await expect(page.locator('[data-testid="cart-counter"]')).toContainText('2')

    // Navigate away and back (if there's navigation)
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Cart should still have items (if localStorage is working)
    await expect(page.locator('[data-testid="cart-counter"]')).toContainText('2')
  })

  test('should handle localStorage reset', async ({ page }) => {
    // Add item to cart
    await page.locator('[data-testid="menu-item"]').first().locator('[data-testid="add-to-cart"]').click()
    await expect(page.locator('[data-testid="cart-counter"]')).toContainText('1')

    // Navigate with reset flag
    await page.goto('/?debug=1&reset=1')
    await page.waitForLoadState('networkidle')

    // Cart should be empty
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    await expect(cartCounter).not.toBeVisible()
  })
})
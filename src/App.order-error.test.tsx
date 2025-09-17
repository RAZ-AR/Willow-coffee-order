import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const submitOrderMock = vi.fn();
const clearCartMock = vi.fn();
const updateStarsMock = vi.fn();

vi.mock('./hooks', () => {
  const mockMenuItem = {
    id: 'coffee-1',
    category: 'Coffee',
    title_en: 'Americano',
    title_sr: 'Americano',
    title_ru: 'Американо',
    price: 450,
  };

  return {
    useTelegramAuth: () => ({
      tg: null,
      currentTgId: '123',
      hasRealTgData: true,
      isInTelegram: true,
    }),
    useMenu: () => ({
      menu: [mockMenuItem],
      ads: [],
      loading: false,
      error: null,
    }),
    useLanguage: () => ({
      lang: 'en',
      setLang: vi.fn(),
    }),
    useLoyalty: () => ({
      cardNumber: '1234',
      stars: 5,
      updateStars: updateStarsMock,
      isLoadingCard: false,
      lastRegisterResp: null,
      lastStarsResp: null,
    }),
    useCart: () => ({
      cart: { 'coffee-1': 1 },
      cartCount: 1,
      total: 450,
      add: vi.fn(),
      remove: vi.fn(),
      clear: clearCartMock,
    }),
    useApi: () => ({
      submitOrder: submitOrderMock,
    }),
  };
});

import App from './App';

describe('App order submission error handling', () => {
  const renderAndOpenCart = async () => {
    const user = userEvent.setup();
    render(<App />);

    const openCartButton = await screen.findByRole('button', { name: /Open cart/i });
    await user.click(openCartButton);

    await screen.findByRole('button', { name: /Checkout/i });

    return user;
  };

  beforeEach(() => {
    submitOrderMock.mockReset();
    clearCartMock.mockClear();
    updateStarsMock.mockClear();
    window.history.replaceState(null, '', '/');
  });

  it('keeps the cart open and shows an error when submitOrder returns null', async () => {
    submitOrderMock.mockResolvedValueOnce(null);

    const user = await renderAndOpenCart();

    const checkoutButton = await screen.findByRole('button', { name: /Checkout/i });
    await user.click(checkoutButton);

    expect(submitOrderMock).toHaveBeenCalledTimes(1);
    expect(clearCartMock).not.toHaveBeenCalled();

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent("We couldn't submit your order. Please try again.");

    expect(screen.getByRole('button', { name: /Checkout/i })).toBeInTheDocument();
  });

  it('surface server error message and keeps loyalty data when ok is false', async () => {
    submitOrderMock.mockResolvedValueOnce({ ok: false, error: 'Server unavailable' });

    const user = await renderAndOpenCart();

    const checkoutButton = await screen.findByRole('button', { name: /Checkout/i });
    await user.click(checkoutButton);

    expect(submitOrderMock).toHaveBeenCalledTimes(1);
    expect(clearCartMock).not.toHaveBeenCalled();
    expect(updateStarsMock).not.toHaveBeenCalled();

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('Server unavailable');
  });
});

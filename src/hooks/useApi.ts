import { useCallback } from 'react';
import { BACKEND_URL } from '../constants';
import { postJSON } from '../utils';
import type { RegisterResponse, StarsResponse, OrderResponse, OrderRequest, TelegramUser } from '../types';

interface UseApiParams {
  tg: any;
  currentTgId: string | null;
  hasRealTgData: boolean;
  tgWebAppData?: string | null;
}

export const useApi = ({ tg, currentTgId, hasRealTgData, tgWebAppData }: UseApiParams) => {
  const register = useCallback(async (): Promise<RegisterResponse | null> => {
    if (!currentTgId) {
      console.log('❌ No currentTgId - skipping registration');
      return null;
    }

    // Тестовый режим - возвращаем мок данные
    if (currentTgId === "0000") {
      console.log('🧪 Test mode - returning mock registration data');
      return {
        ok: true,
        card: "0000",
        stars: 0
      };
    }

    if (!BACKEND_URL) return null;

    console.log('✅ Proceeding with registration for user:', currentTgId);
    
    // Создаем user объект из currentTgId если его нет
    let user = tg?.initDataUnsafe?.user || null;
    if (!user && currentTgId) {
      user = { id: Number(currentTgId) };
      console.log('✅ Created user object from currentTgId:', user);
    }

    const payload = {
      action: "register",
      initData: tg?.initData || tgWebAppData || null,
      user: user,
      ts: Date.now(),
    };
    
    console.log('📤 Sending to backend:', payload);
    
    try {
      const resp = await postJSON<RegisterResponse>(BACKEND_URL, payload);
      return resp;
    } catch (error) {
      console.error('Registration error:', error);
      return { error: "network_or_cors" } as any;
    }
  }, [BACKEND_URL, currentTgId, tg, tgWebAppData]);

  const getStars = useCallback(async (): Promise<StarsResponse | null> => {
    if (!currentTgId) {
      return null;
    }

    // Тестовый режим - возвращаем мок данные
    if (currentTgId === "0000") {
      console.log('🧪 Test mode - returning mock stars data');
      return {
        card: "0000",
        stars: 0
      };
    }

    if (!BACKEND_URL) {
      return null;
    }

    // Создаем user объект из currentTgId если его нет
    let user = tg?.initDataUnsafe?.user || null;
    if (!user && currentTgId) {
      user = { id: Number(currentTgId) };
    }

    try {
      const resp = await postJSON<StarsResponse>(BACKEND_URL, {
        action: "get_stars",
        initData: tg?.initData || tgWebAppData || null,
        user: user,
      });
      return resp;
    } catch (error) {
      console.error('Get stars error:', error);
      return null;
    }
  }, [BACKEND_URL, currentTgId, tg, tgWebAppData]);

  const submitOrder = useCallback(async (orderData: Omit<OrderRequest, 'action' | 'initData' | 'user'>): Promise<OrderResponse | null> => {
    if (!currentTgId) {
      console.log('❌ Submit order blocked - missing currentTgId');
      return null;
    }

    // Тестовый режим - возвращаем мок данные
    if (currentTgId === "0000") {
      console.log('🧪 Test mode - returning mock order data');
      const starsEarned = Math.floor((orderData.total || 0) / 100);
      return {
        ok: true,
        order_id: `TEST_ORD_${Date.now()}`,
        card: "0000",
        stars: 0,
        stars_earned: starsEarned
      };
    }

    if (!BACKEND_URL) {
      console.log('❌ Submit order blocked - missing BACKEND_URL');
      return null;
    }

    // Создаем user объект из currentTgId если его нет
    let user = tg?.initDataUnsafe?.user || null;
    if (!user && currentTgId) {
      user = { id: Number(currentTgId) };
    }

    const payload = {
      order: orderData,
      action: "submit_order",
      initData: tg?.initData || tgWebAppData || null,
      user: user,
    };

    console.log('📦 Submitting order:', payload);

    try {
      const resp = await postJSON<OrderResponse>(BACKEND_URL, payload);
      console.log('📦 Order response:', resp);
      return resp;
    } catch (error) {
      console.error('Submit order error:', error);
      return null;
    }
  }, [BACKEND_URL, currentTgId, tg, tgWebAppData]);

  return {
    register,
    getStars,
    submitOrder
  };
};
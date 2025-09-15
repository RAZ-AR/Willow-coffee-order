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
    if (!BACKEND_URL) return null;
    
    // Регистрируем если есть currentTgId (стабильный подход)
    if (!currentTgId) {
      console.log('❌ No currentTgId - skipping registration');
      return null;
    }
    
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
    if (!BACKEND_URL || !currentTgId) {
      return null;
    }

    // Создаем user объект из currentTgId если его нет
    let user = tg?.initDataUnsafe?.user || null;
    if (!user && currentTgId) {
      user = { id: Number(currentTgId) };
    }

    try {
      const resp = await postJSON<StarsResponse>(BACKEND_URL, {
        action: "stars",
        initData: tg?.initData || tgWebAppData || null,
        user: user,
      });
      return resp;
    } catch (error) {
      console.error('Get stars error:', error);
      return { error: "network_or_cors" } as any;
    }
  }, [BACKEND_URL, currentTgId, tg, tgWebAppData]);

  const submitOrder = useCallback(async (orderData: Omit<OrderRequest, 'action' | 'initData' | 'user'>): Promise<OrderResponse | null> => {
    if (!BACKEND_URL || !currentTgId) {
      console.log('❌ Submit order blocked - missing BACKEND_URL or currentTgId:', { BACKEND_URL: !!BACKEND_URL, currentTgId });
      return null;
    }

    // Создаем user объект из currentTgId если его нет
    let user = tg?.initDataUnsafe?.user || null;
    if (!user && currentTgId) {
      user = { id: Number(currentTgId) };
    }

    const payload = {
      ...orderData,
      action: "order",
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
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
    
    // Только если есть реальные данные Telegram - регистрируем  
    if (!hasRealTgData) {
      console.log('❌ No real Telegram data - skipping registration');
      return null;
    }
    
    // Если нет currentTgId и нет данных - не регистрируем
    if (!currentTgId && !tg?.initData && !tg?.initDataUnsafe?.user?.id && !tgWebAppData) {
      console.log('❌ No user data available - skipping registration');
      return null;
    }
    
    console.log('✅ Proceeding with registration for user:', currentTgId);
    
    try {
      const resp = await postJSON<RegisterResponse>(BACKEND_URL, {
        action: "register",
        initData: tg?.initData || tgWebAppData || null,
        user: tg?.initDataUnsafe?.user || null,
        ts: Date.now(),
      });
      return resp;
    } catch (error) {
      console.error('Registration error:', error);
      return { error: "network_or_cors" } as any;
    }
  }, [BACKEND_URL, hasRealTgData, currentTgId, tg, tgWebAppData]);

  const getStars = useCallback(async (): Promise<StarsResponse | null> => {
    if (!BACKEND_URL || !hasRealTgData || (!currentTgId && !tg?.initData)) {
      return null;
    }

    try {
      const resp = await postJSON<StarsResponse>(BACKEND_URL, {
        action: "stars",
        initData: tg?.initData || tgWebAppData || null,
        user: tg?.initDataUnsafe?.user || null,
      });
      return resp;
    } catch (error) {
      console.error('Get stars error:', error);
      return { error: "network_or_cors" } as any;
    }
  }, [BACKEND_URL, hasRealTgData, currentTgId, tg, tgWebAppData]);

  const submitOrder = useCallback(async (orderData: Omit<OrderRequest, 'action' | 'initData' | 'user'>): Promise<OrderResponse | null> => {
    if (!BACKEND_URL || !currentTgId) return null;

    try {
      const resp = await postJSON<OrderResponse>(BACKEND_URL, {
        ...orderData,
        action: "order",
        initData: tg?.initData || tgWebAppData || null,
        user: tg?.initDataUnsafe?.user || null,
      });
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
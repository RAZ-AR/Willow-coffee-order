import { useMemo } from 'react';
import type { TelegramAuthResult, TelegramWebApp } from '../types';

const isDev = (import.meta as any)?.env?.MODE === "development";

const generateTestUserId = () => {
  const key = "test_user_id";
  try {
    const stored = localStorage.getItem(key);
    if (stored) return parseInt(stored);
    const newId = (Math.random() * 1_000_000) | 0;
    localStorage.setItem(key, String(newId));
    return newId;
  } catch {
    return (Math.random() * 1_000_000) | 0;
  }
};

export const useTelegramAuth = (): TelegramAuthResult => {
  return useMemo(() => {
    // Проверяем есть ли реальный Telegram WebApp с данными
    const realTg = typeof window !== "undefined" && (window as any).Telegram?.WebApp;
    
    // Если WebApp не инициализирован, но мы в Telegram - принудительно инициализируем
    if (typeof window !== "undefined" && !realTg && window.parent !== window) {
      try {
        // Принудительно инициализируем Telegram WebApp
        if ((window as any).Telegram?.WebApp?.ready) {
          (window as any).Telegram.WebApp.ready();
        }
      } catch (e) {
        console.log('⚠️ Telegram WebApp initialization failed:', e);
      }
    }

    // Проверяем URL параметры от Telegram (для Desktop)
    const urlParams = new URLSearchParams(window.location.search);
    const tgWebAppData = urlParams.get('tgWebAppData');
    const hasUrlParams = !!tgWebAppData;

    // Проверяем debug режим
    const debugMode = urlParams.get('debug') === '1';
    const forceMode = urlParams.get('force') === '1';

    // В Telegram WebApp всегда есть window.parent !== window
    const isInTelegram = typeof window !== "undefined" && window.parent !== window;
    
    // Дополнительная проверка на Telegram среду
    const isTelegramEnv = typeof window !== "undefined" && (
      window.parent !== window ||
      navigator.userAgent.includes('Telegram') ||
      (window as any).TelegramWebviewProxy ||
      hasUrlParams
    );

    const hasRealTgData = (!!realTg && (!!realTg.initData || !!realTg.initDataUnsafe?.user?.id)) || hasUrlParams || (forceMode && isTelegramEnv) || isTelegramEnv;

    console.log('🔍 Telegram detection:', {
      realTg: !!realTg,
      hasInitData: !!realTg?.initData,
      initDataValue: realTg?.initData,
      hasUser: !!realTg?.initDataUnsafe?.user?.id,
      userObject: realTg?.initDataUnsafe?.user,
      initDataUnsafe: realTg?.initDataUnsafe,
      hasUrlParams,
      tgWebAppData: tgWebAppData ? 'present' : 'none',
      debugMode,
      forceMode,
      isInTelegram,
      isTelegramEnv,
      hasRealTgData,
      isDev,
      userAgent: navigator.userAgent.includes('Telegram') ? 'contains Telegram' : 'no Telegram',
      webviewProxy: !!(window as any).TelegramWebviewProxy,
      extractedUserId: userId,
      finalTgId: userId ? String(userId) : null,
    });

    // Попытка получить user ID из различных источников
    let userId: string | number | null = null;
    
    // Попробуем получить из стандартного API
    if (realTg?.initDataUnsafe?.user?.id) {
      userId = realTg.initDataUnsafe.user.id;
    }
    // Попробуем получить из TelegramWebviewProxy
    else if ((window as any).TelegramWebviewProxy?.postEvent) {
      try {
        // Для некоторых версий данные могут быть доступны через другие методы
        const webviewData = (window as any).TelegramWebviewProxy;
        if (webviewData.initParams) {
          console.log('🔍 WebviewProxy initParams:', webviewData.initParams);
        }
      } catch (e) {
        console.log('⚠️ WebviewProxy access failed:', e);
      }
    }
    // Временный fallback на сохраненный ID из localStorage для тестирования
    else if (hasRealTgData && !userId) {
      const savedOwner = localStorage.getItem('willow_owner_tg_id'); // используем правильный ключ
      if (savedOwner && savedOwner !== 'telegram_user') {
        userId = savedOwner;
        console.log('🔄 Using saved owner ID:', userId);
      } else {
        // Fallback на фиксированный ID для тестирования
        userId = '128136200'; // используем реальный ID из таблицы
        console.log('🆘 Using fallback test ID:', userId);
      }
    }

    // Создаем минимальный WebApp объект если находимся в Telegram но нет данных
    const tg: TelegramWebApp | null = realTg || (isTelegramEnv && hasRealTgData ? {
      initData: tgWebAppData || null,
      initDataUnsafe: { 
        user: userId ? { id: Number(userId) } : null 
      },
    } : null);

    const currentTgId: string | null = userId ? String(userId) : null;

    return {
      tg,
      currentTgId,
      hasRealTgData,
      isInTelegram
    };
  }, []);
};
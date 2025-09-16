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

    // Определяем уникальный ID пользователя
    let userId: string | number;

    // Сначала пробуем получить реальный ID из Telegram API
    if (realTg?.initDataUnsafe?.user?.id) {
      userId = realTg.initDataUnsafe.user.id;
      console.log('✅ Got real Telegram user ID:', userId);
    } else if (hasUrlParams && tgWebAppData) {
      // Попробуем извлечь ID из URL параметров
      try {
        const params = new URLSearchParams(tgWebAppData);
        const user = JSON.parse(params.get('user') || '{}');
        if (user.id) {
          userId = user.id;
          console.log('✅ Got user ID from URL params:', userId);
        } else {
          userId = generateTestUserId();
          console.log('🔄 Generated test user ID:', userId);
        }
      } catch (e) {
        userId = generateTestUserId();
        console.log('🔄 Generated test user ID (URL parse failed):', userId);
      }
    } else {
      // В dev режиме или для тестирования - фиксированный тестовый ID
      userId = "0000";
      console.log('🧪 Using test mode ID:', userId);
      console.log('🔥 VERSION CHECK: useTelegramAuth.ts updated at 15.09.2025 17:45');
    }

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
      windowTelegram: (window as any).Telegram,
      extractedUserId: userId,
      finalTgId: userId ? String(userId) : null,
    });

    // КРИТИЧЕСКАЯ ОТЛАДКА: показываем откуда взялся ID
    console.log('🚨 CRITICAL DEBUG - User ID source analysis:');
    console.log('  - realTg exists:', !!realTg);
    console.log('  - realTg.initDataUnsafe.user.id:', realTg?.initDataUnsafe?.user?.id);
    console.log('  - hasUrlParams:', hasUrlParams);
    console.log('  - tgWebAppData:', tgWebAppData);
    console.log('  - Final userId:', userId);
    console.log('  - Is hardcoded 128136200:', userId === '128136200' || userId === 128136200);

    if (userId === '128136200' || userId === 128136200) {
      console.error('❌❌❌ STILL USING HARDCODED ID 128136200! CODE NOT UPDATED! ❌❌❌');
    } else {
      console.log('✅✅✅ Using dynamic ID - code is updated!');
    }

    // Всегда создаем валидный tg объект с правильным user ID
    const tg: TelegramWebApp = realTg || {
      initData: tgWebAppData || null,
      initDataUnsafe: { 
        user: { id: Number(userId) }
      },
    };

    const currentTgId: string = String(userId);

    return {
      tg,
      currentTgId,
      hasRealTgData,
      isInTelegram
    };
  }, []);
};
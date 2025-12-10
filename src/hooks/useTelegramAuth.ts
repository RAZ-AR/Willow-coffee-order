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
    let userId: string | number | null = null;

    // Способ 1: Из initDataUnsafe
    if (realTg?.initDataUnsafe?.user?.id) {
      userId = realTg.initDataUnsafe.user.id;
      console.log('✅ Got real Telegram user ID from initDataUnsafe:', userId);
    }

    // Способ 2: Парсинг initData строки
    if (!userId && realTg?.initData) {
      try {
        const initDataParams = new URLSearchParams(realTg.initData);
        const userJson = initDataParams.get('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          if (user.id) {
            userId = user.id;
            console.log('✅ Got real Telegram user ID from initData string:', userId);
          }
        }
      } catch (e) {
        console.log('⚠️ Failed to parse initData:', e);
      }
    }

    // Способ 3: Из URL параметров (для Desktop)
    if (!userId && hasUrlParams && tgWebAppData) {
      try {
        const params = new URLSearchParams(tgWebAppData);
        const user = JSON.parse(params.get('user') || '{}');
        if (user.id) {
          userId = user.id;
          console.log('✅ Got user ID from URL params:', userId);
        }
      } catch (e) {
        console.log('⚠️ Failed to parse URL params:', e);
      }
    }

    // Способ 4: Проверяем window.Telegram.WebApp напрямую
    if (!userId && typeof window !== 'undefined') {
      try {
        const tgWebApp = (window as any).Telegram?.WebApp;
        if (tgWebApp) {
          // Пробуем разные варианты
          const possibleIds = [
            tgWebApp.initDataUnsafe?.user?.id,
            tgWebApp.WebAppUser?.id,
            tgWebApp.user?.id,
          ];

          for (const id of possibleIds) {
            if (id) {
              userId = id;
              console.log('✅ Got user ID from window.Telegram.WebApp:', userId);
              break;
            }
          }
        }
      } catch (e) {
        console.log('⚠️ Failed to get ID from window.Telegram:', e);
      }
    }

    // Если ничего не нашли - используем fallback
    if (!userId) {
      userId = generateTestUserId();
      console.log('🔄 Using generated/stored user ID:', userId);
      console.log('⚠️ No real Telegram data detected - using fallback ID');
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
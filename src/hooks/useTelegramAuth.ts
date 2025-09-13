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

    // Проверяем URL параметры от Telegram (для Desktop)
    const urlParams = new URLSearchParams(window.location.search);
    const tgWebAppData = urlParams.get('tgWebAppData');
    const hasUrlParams = !!tgWebAppData;

    // Проверяем debug режим
    const debugMode = urlParams.get('debug') === '1';
    const forceMode = urlParams.get('force') === '1';

    // В Telegram WebApp всегда есть window.parent !== window
    const isInTelegram = typeof window !== "undefined" && window.parent !== window;

    const hasRealTgData = (!!realTg && (!!realTg.initData || !!realTg.initDataUnsafe?.user?.id)) || hasUrlParams || (forceMode && isInTelegram);

    console.log('🔍 Telegram detection:', {
      realTg: !!realTg,
      hasInitData: !!realTg?.initData,
      hasUser: !!realTg?.initDataUnsafe?.user?.id,
      hasUrlParams,
      tgWebAppData: tgWebAppData ? 'present' : 'none',
      debugMode,
      forceMode,
      isInTelegram,
      hasRealTgData,
      isDev,
      userAgent: navigator.userAgent.includes('Telegram') ? 'contains Telegram' : 'no Telegram',
    });

    // Создаем минимальный WebApp объект если находимся в Telegram но нет данных
    const tg: TelegramWebApp | null = realTg || (isInTelegram && hasRealTgData ? {
      initData: tgWebAppData || null,
      initDataUnsafe: { user: null },
    } : null);

    const currentTgId: string | null = tg?.initDataUnsafe?.user?.id
      ? String(tg.initDataUnsafe.user.id)
      : (hasRealTgData ? "telegram_user" : null); // Fallback для случаев когда данные есть, но user.id нет

    return {
      tg,
      currentTgId,
      hasRealTgData,
      isInTelegram
    };
  }, []);
};
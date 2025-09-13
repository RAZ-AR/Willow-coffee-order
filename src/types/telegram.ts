export interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name: string;
      username?: string;
      last_name?: string;
      language_code?: string;
    };
    [key: string]: any;
  };
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  [key: string]: any;
}

export interface TelegramWindow extends Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}

export interface TelegramAuthResult {
  tg: TelegramWebApp | null;
  currentTgId: string | null;
  hasRealTgData: boolean;
  isInTelegram: boolean;
}
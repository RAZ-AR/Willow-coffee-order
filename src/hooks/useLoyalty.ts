import { useState, useEffect, useCallback } from 'react';
import { LS_KEYS } from '../constants';
import { toNumber } from '../utils';
import { useApi } from './useApi';

interface UseLoyaltyParams {
  tg: any;
  currentTgId: string | null;
  hasRealTgData: boolean;
  tgWebAppData?: string | null;
}

export const useLoyalty = ({ tg, currentTgId, hasRealTgData, tgWebAppData }: UseLoyaltyParams) => {
  // НЕ показываем из LS сразу - ждем ответ с сервера для правильного пользователя
  const [cardNumber, setCardNumber] = useState<string>("");
  const [stars, setStars] = useState<number>(0);
  const [isLoadingCard, setIsLoadingCard] = useState<boolean>(true);

  // Принудительная очистка кеша при каждой загрузке компонента
  useEffect(() => {
    const savedCard = localStorage.getItem(LS_KEYS.card);
    const savedOwner = localStorage.getItem(LS_KEYS.owner);

    // Если есть сохраненная карта, но нет владельца или владелец неизвестен - очищаем
    if (savedCard && (!savedOwner || !currentTgId)) {
      console.log('🧹 Aggressive cache clear - removing orphaned card data');
      localStorage.removeItem(LS_KEYS.card);
      localStorage.removeItem(LS_KEYS.stars);
      localStorage.removeItem(LS_KEYS.owner);
    }
  }, [currentTgId]);
  const [lastRegisterResp, setLastRegisterResp] = useState<any>(null);
  const [lastStarsResp, setLastStarsResp] = useState<any>(null);

  const api = useApi({ tg, currentTgId, hasRealTgData, tgWebAppData });

  // Очистка по флагу ?reset=1 ИЛИ автоматическая очистка кеша карт
  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const shouldReset = qs.has("reset") && qs.get("reset") === "1";

      // Принудительная очистка старых карт для избежания показа неправильных номеров
      const savedOwner = localStorage.getItem(LS_KEYS.owner);
      const savedCard = localStorage.getItem(LS_KEYS.card);

      if (shouldReset) {
        console.log('🧹 Reset flag detected - clearing all local data');
        localStorage.removeItem(LS_KEYS.card);
        localStorage.removeItem(LS_KEYS.stars);
        localStorage.removeItem(LS_KEYS.cart);
        localStorage.removeItem(LS_KEYS.owner);
        setCardNumber("");
        setStars(0);
      } else if (savedCard && !savedOwner) {
        // Если есть карта, но нет owner - очищаем карту
        console.log('🧹 Found orphaned card without owner - clearing');
        localStorage.removeItem(LS_KEYS.card);
        localStorage.removeItem(LS_KEYS.stars);
        setCardNumber("");
        setStars(0);
      }

      console.log('💾 Initial localStorage state:', {
        card: localStorage.getItem(LS_KEYS.card),
        stars: localStorage.getItem(LS_KEYS.stars),
        owner: localStorage.getItem(LS_KEYS.owner),
      });
    } catch {}
  }, []);

  // Смена владельца → сброс локалки, загрузка данных правильного пользователя
  useEffect(() => {
    if (!currentTgId) return;

    const owner = localStorage.getItem(LS_KEYS.owner);

    if (owner && owner !== currentTgId) {
      console.log('🔄 Owner changed from', owner, 'to', currentTgId, '- clearing cache');
      localStorage.removeItem(LS_KEYS.card);
      localStorage.removeItem(LS_KEYS.stars);
      setCardNumber("");
      setStars(0);
      localStorage.setItem(LS_KEYS.owner, currentTgId);
    } else if (!owner) {
      console.log('🆕 Setting owner to', currentTgId);
      localStorage.setItem(LS_KEYS.owner, currentTgId);
    } else if (owner === currentTgId) {
      // Тот же владелец - восстанавливаем из LS
      const savedCard = localStorage.getItem(LS_KEYS.card);
      const savedStars = localStorage.getItem(LS_KEYS.stars);

      if (savedCard && /^\d{4}$/.test(savedCard)) {
        console.log('🔄 Restoring saved card for same owner:', savedCard);
        setCardNumber(savedCard);
        setStars(toNumber(savedStars, 0));
      }
    }
  }, [currentTgId]);

  // Регистрация один раз при загрузке
  useEffect(() => {
    let aborted = false;

    const tryRegister = async () => {
      console.log('🎯 useLoyalty: Attempting registration...', { currentTgId, hasRealTgData });
      const resp = await api.register();
      console.log('🎯 useLoyalty: Registration response:', resp);
      setLastRegisterResp(resp);

      if (aborted || !resp) {
        console.log('❌ useLoyalty: Registration aborted or no response');
        setIsLoadingCard(false);
        return;
      }

      if (resp?.card) {
        const cardStr = String(resp.card);
        console.log('✅ useLoyalty: Got card number:', cardStr);
        console.log('💾 useLoyalty: Saving card to localStorage');
        setCardNumber(cardStr);
        localStorage.setItem(LS_KEYS.card, cardStr);

        // Проверим что сохранилось
        const saved = localStorage.getItem(LS_KEYS.card);
        console.log('✔️ useLoyalty: Card saved successfully:', saved);
      }

      if (typeof resp?.stars === "number") {
        console.log('✅ useLoyalty: Got stars:', resp.stars);
        setStars(resp.stars);
        localStorage.setItem(LS_KEYS.stars, String(resp.stars));
      }

      setIsLoadingCard(false);
    };

    if (currentTgId && !aborted) {
      tryRegister();
    }

    return () => {
      aborted = true;
    };
  }, [currentTgId]); // Убрал api из dependencies чтобы избежать лишних перезапусков

  // Пуллинг card/stars каждые 15s
  useEffect(() => {
    if (!hasRealTgData || (!currentTgId && !tg?.initData)) return;
    
    const interval = setInterval(async () => {
      try {
        const resp = await api.getStars();
        setLastStarsResp(resp);
        if (!resp) return;

        if (resp?.card && resp.card !== cardNumber) {
          console.log('🔄 Card updated from', cardNumber, 'to', resp.card);
          setCardNumber(String(resp.card));
          localStorage.setItem(LS_KEYS.card, String(resp.card));
        }
        if (typeof resp?.stars === "number" && resp.stars !== stars) {
          setStars(resp.stars);
          localStorage.setItem(LS_KEYS.stars, String(resp.stars));
        }
      } catch (error) {
        setLastStarsResp({ error: "network_or_cors" });
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [currentTgId, cardNumber, stars, hasRealTgData, tg, api]);

  const updateStars = useCallback((newStars: number) => {
    setStars(newStars);
    localStorage.setItem(LS_KEYS.stars, String(newStars));
  }, []);

  return {
    cardNumber,
    stars,
    isLoadingCard,
    lastRegisterResp,
    lastStarsResp,
    updateStars
  };
};

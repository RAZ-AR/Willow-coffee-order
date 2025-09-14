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
  // Показываем из LS сразу — UI мгновенно с номером/звёздами
  const [cardNumber, setCardNumber] = useState<string>(
    () => localStorage.getItem(LS_KEYS.card) || "",
  );
  const [stars, setStars] = useState<number>(() =>
    toNumber(localStorage.getItem(LS_KEYS.stars), 0),
  );
  const [isLoadingCard, setIsLoadingCard] = useState<boolean>(hasRealTgData);
  const [lastRegisterResp, setLastRegisterResp] = useState<any>(null);
  const [lastStarsResp, setLastStarsResp] = useState<any>(null);

  const api = useApi({ tg, currentTgId, hasRealTgData, tgWebAppData });

  // Одноразовый сброс локального состояния по флагу ?reset=1
  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const shouldReset = qs.has("reset") && qs.get("reset") === "1";
      if (shouldReset) {
        console.log('🧹 Reset flag detected - clearing all local data');
        localStorage.removeItem(LS_KEYS.card);
        localStorage.removeItem(LS_KEYS.stars);
        localStorage.removeItem(LS_KEYS.cart);
        localStorage.removeItem(LS_KEYS.owner);
        setCardNumber("");
        setStars(0);
      } else {
        console.log('💾 Initial localStorage state:', {
          card: localStorage.getItem(LS_KEYS.card),
          stars: localStorage.getItem(LS_KEYS.stars),
          owner: localStorage.getItem(LS_KEYS.owner),
        });
      }
    } catch {}
  }, []);

  // Смена владельца → сброс локалки
  useEffect(() => {
    const owner = localStorage.getItem(LS_KEYS.owner);
    if (currentTgId && owner && owner !== currentTgId) {
      console.log('🔄 Owner changed from', owner, 'to', currentTgId, '- clearing cache');
      localStorage.removeItem(LS_KEYS.card);
      localStorage.removeItem(LS_KEYS.stars);
      setCardNumber("");
      setStars(0);
      localStorage.setItem(LS_KEYS.owner, currentTgId);
    } else if (currentTgId && !owner) {
      console.log('🆕 Setting owner to', currentTgId);
      localStorage.setItem(LS_KEYS.owner, currentTgId);
    }
  }, [currentTgId]);

  // Агрессивный register (3 быстрых попытки)
  useEffect(() => {
    let aborted = false;
    let currentCard = "";

    const tryOnce = async () => {
      console.log('🎯 useLoyalty: Attempting registration...', { currentTgId, hasRealTgData });
      const resp = await api.register();
      console.log('🎯 useLoyalty: Registration response:', resp);
      setLastRegisterResp(resp);
      if (aborted || !resp) {
        console.log('❌ useLoyalty: Registration aborted or no response');
        return null;
      }
      
      if (resp?.card) {
        const cardStr = String(resp.card);
        console.log('✅ useLoyalty: Got card number:', cardStr);
        setCardNumber(cardStr);
        localStorage.setItem(LS_KEYS.card, cardStr);
        currentCard = cardStr;
      } else {
        console.log('❌ useLoyalty: No card in response');
      }
      
      if (typeof resp?.stars === "number") {
        console.log('✅ useLoyalty: Got stars:', resp.stars);
        setStars(resp.stars);
        localStorage.setItem(LS_KEYS.stars, String(resp.stars));
      } else {
        console.log('❌ useLoyalty: No stars in response');
      }
      
      setIsLoadingCard(false);
      return resp?.card || null;
    };

    (async () => {
      const firstCard = await tryOnce();
      if (firstCard && /^\d{4}$/.test(String(firstCard))) {
        return; // Успешно получили карту с первого раза
      }

      for (let i = 0; i < 3; i++) {
        if (aborted) break;
        if (currentCard && /^\d{4}$/.test(currentCard)) break;
        await new Promise((r) => setTimeout(r, 1000));
        const card = await tryOnce();
        if (card && /^\d{4}$/.test(String(card))) {
          break;
        }
      }
    })();

    return () => {
      aborted = true;
    };
  }, [currentTgId, api]);

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
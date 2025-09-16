import { useState, useEffect, useCallback } from 'react';
import { LS_KEYS } from '../constants';
import { toNumber } from '../utils';
import { useApi } from './useApi';
export const useLoyalty = ({ tg, currentTgId, hasRealTgData, tgWebAppData }) => {
    // НЕ показываем из LS сразу - ждем ответ с сервера для правильного пользователя
    const [cardNumber, setCardNumber] = useState("");
    const [stars, setStars] = useState(0);
    const [isLoadingCard, setIsLoadingCard] = useState(true);
    // ВРЕМЕННО: Полная очистка кеша при каждой загрузке для отладки
    useEffect(() => {
        console.log('🧹 TEMP: Force clearing ALL localStorage for debugging');
        console.log('🔥 VERSION CHECK: useLoyalty.ts updated at 15.09.2025 17:25');
        console.log('🔍 Current localStorage before clear:', {
            card: localStorage.getItem(LS_KEYS.card),
            stars: localStorage.getItem(LS_KEYS.stars),
            owner: localStorage.getItem(LS_KEYS.owner),
            test_user_id: localStorage.getItem('test_user_id')
        });
        // Полная очистка ВСЕХ ключей приложения
        Object.values(LS_KEYS).forEach(key => localStorage.removeItem(key));
        localStorage.removeItem('test_user_id');
        console.log('✅ localStorage cleared completely');
    }, []);
    const [lastRegisterResp, setLastRegisterResp] = useState(null);
    const [lastStarsResp, setLastStarsResp] = useState(null);
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
            }
            else if (savedCard && !savedOwner) {
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
        }
        catch { }
    }, []);
    // Смена владельца → сброс локалки, загрузка данных правильного пользователя
    useEffect(() => {
        if (!currentTgId)
            return;
        const owner = localStorage.getItem(LS_KEYS.owner);
        if (owner && owner !== currentTgId) {
            console.log('🔄 Owner changed from', owner, 'to', currentTgId, '- clearing cache');
            localStorage.removeItem(LS_KEYS.card);
            localStorage.removeItem(LS_KEYS.stars);
            setCardNumber("");
            setStars(0);
            localStorage.setItem(LS_KEYS.owner, currentTgId);
        }
        else if (!owner) {
            console.log('🆕 Setting owner to', currentTgId);
            localStorage.setItem(LS_KEYS.owner, currentTgId);
        }
        else if (owner === currentTgId) {
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
    // Проверяем существующую карту без автоматической регистрации
    useEffect(() => {
        let aborted = false;
        const checkExistingCard = async () => {
            console.log('🔍 useLoyalty: Checking existing card...', { currentTgId, hasRealTgData });
            // Тестовый режим - устанавливаем фиксированные значения
            if (currentTgId === "0000") {
                console.log('🧪 useLoyalty: Test mode - setting fixed values');
                setCardNumber("0000");
                setStars(0);
                setIsLoadingCard(false);
                return;
            }
            try {
                const resp = await api.getStars();
                console.log('🔍 useLoyalty: Card check response:', resp);
                setLastRegisterResp(resp);
                if (aborted || !resp) {
                    console.log('❌ useLoyalty: Card check aborted or no response');
                    setIsLoadingCard(false);
                    return;
                }
                if (resp?.card) {
                    const cardStr = String(resp.card);
                    console.log('✅ useLoyalty: Found existing card:', cardStr);
                    setCardNumber(cardStr);
                    localStorage.setItem(LS_KEYS.card, cardStr);
                }
                if (typeof resp?.stars === "number") {
                    console.log('✅ useLoyalty: Got stars:', resp.stars);
                    setStars(resp.stars);
                    localStorage.setItem(LS_KEYS.stars, String(resp.stars));
                }
            }
            catch (error) {
                console.log('❌ useLoyalty: Error checking card:', error);
            }
            setIsLoadingCard(false);
        };
        if (currentTgId && !aborted) {
            checkExistingCard();
        }
        return () => {
            aborted = true;
        };
    }, [currentTgId]); // Убрал api из dependencies чтобы избежать лишних перезапусков
    // Пуллинг card/stars каждые 15s (только для реальных пользователей)
    useEffect(() => {
        if (!hasRealTgData || (!currentTgId && !tg?.initData) || currentTgId === "0000")
            return;
        const interval = setInterval(async () => {
            try {
                const resp = await api.getStars();
                setLastStarsResp(resp);
                if (!resp)
                    return;
                if (resp?.card && resp.card !== cardNumber) {
                    console.log('🔄 Card updated from', cardNumber, 'to', resp.card);
                    setCardNumber(String(resp.card));
                    localStorage.setItem(LS_KEYS.card, String(resp.card));
                }
                if (typeof resp?.stars === "number" && resp.stars !== stars) {
                    setStars(resp.stars);
                    localStorage.setItem(LS_KEYS.stars, String(resp.stars));
                }
            }
            catch (error) {
                setLastStarsResp({ error: "network_or_cors" });
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [currentTgId, cardNumber, stars, hasRealTgData, tg, api]);
    const updateStars = useCallback((newStars) => {
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

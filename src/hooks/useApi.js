import { useCallback } from 'react';
import { postJSON } from '../utils';
export const useApi = ({ tg, currentTgId, hasRealTgData }) => {
    const register = useCallback(async () => {
        if (!currentTgId) {
            console.log('❌ No currentTgId - skipping registration');
            return null;
        }
        // Тестовый режим - возвращаем мок данные
        if (currentTgId === "0000") {
            console.log('🧪 Test mode - returning mock registration data');
            return {
                ok: true,
                card: "0000",
                stars: 0
            };
        }
        console.log('✅ Proceeding with registration for user:', currentTgId);
        // Создаем user объект
        let user = tg?.initDataUnsafe?.user || null;
        if (!user && currentTgId) {
            user = {
                id: Number(currentTgId),
                first_name: 'User',
                username: '',
                language_code: 'en'
            };
            console.log('✅ Created user object from currentTgId:', user);
        }
        const payload = {
            user: user
        };
        console.log('📤 Sending to /api/register:', payload);
        try {
            const resp = await postJSON('/api/register', payload);
            return resp;
        }
        catch (error) {
            console.error('Registration error:', error);
            return { error: "network_or_cors" };
        }
    }, [currentTgId, tg]);
    const getStars = useCallback(async () => {
        if (!currentTgId) {
            return null;
        }
        // Тестовый режим
        if (currentTgId === "0000") {
            console.log('🧪 Test mode - returning mock stars data');
            return {
                ok: true,
                card: "0000",
                stars: 0
            };
        }
        // Создаем user объект
        let user = tg?.initDataUnsafe?.user || null;
        if (!user && currentTgId) {
            user = {
                id: Number(currentTgId)
            };
        }
        try {
            const resp = await postJSON('/api/stars', {
                user: user
            });
            return resp;
        }
        catch (error) {
            console.error('Get stars error:', error);
            return null;
        }
    }, [currentTgId, tg]);
    const submitOrder = useCallback(async (orderData) => {
        if (!currentTgId) {
            console.log('❌ Submit order blocked - missing currentTgId');
            return null;
        }
        // Тестовый режим
        if (currentTgId === "0000") {
            console.log('🧪 Test mode - returning mock order confirmation');
            return {
                ok: true,
                order_id: `o_test_${Date.now()}`,
                card: "0000",
                stars: 5,
                stars_earned: 2
            };
        }
        // Создаем user объект
        let user = tg?.initDataUnsafe?.user || null;
        if (!user && currentTgId) {
            user = {
                id: Number(currentTgId),
                first_name: 'User',
                username: '',
                language_code: 'en'
            };
        }
        const payload = {
            user: user,
            ...orderData
        };
        console.log('📤 Sending order to /api/order:', payload);
        try {
            const resp = await postJSON('/api/order', payload);
            return resp;
        }
        catch (error) {
            console.error('Order submission error:', error);
            return null;
        }
    }, [currentTgId, tg]);
    return {
        register,
        getStars,
        submitOrder
    };
};
export default useApi;

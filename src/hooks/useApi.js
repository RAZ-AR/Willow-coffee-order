import { useCallback } from 'react';
import { postJSON } from '../utils';
export const useApi = ({ tg, currentTgId, hasRealTgData }) => {
    const register = useCallback(async () => {
        if (!currentTgId) {
            console.log('❌ No currentTgId - skipping registration');
            return null;
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
            action: 'register',
            user: user
        };
        console.log('📤 Sending register request:', payload);
        try {
            const resp = await postJSON('', payload);
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
        // Создаем user объект
        let user = tg?.initDataUnsafe?.user || null;
        if (!user && currentTgId) {
            user = {
                id: Number(currentTgId)
            };
        }
        try {
            const resp = await postJSON('', {
                action: 'stars',
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
            action: 'order',
            user: user,
            ...orderData
        };
        console.log('📤 Sending order request:', payload);
        try {
            const resp = await postJSON('', payload);
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

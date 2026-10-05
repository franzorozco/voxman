import client from '../client';

export const checkCashRegisterStatus = async () => {
    const { data } = await client.get('/pos/cash-register/status');
    return data;
};

export const openCashRegister = async (payload) => {
    const { data } = await client.post('/pos/cash-register/open', payload);
    return data;
};

export const closeCashRegister = async (payload) => {
    const { data } = await client.post('/pos/cash-register/close', payload);
    return data;
};

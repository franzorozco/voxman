import client from '../client';

export const processPosCheckout = async (payload) => {
    const { data } = await client.post('/pos/checkout', payload);
    return data;
};

import client from '../client';

export const getPosProducts = async (params) => {
    const { data } = await client.get('/pos/products', { params });
    return data;
};

export const searchPosProductByBarcode = async (barcode, branch_id) => {
    const { data } = await client.get('/pos/products/search', {
        params: { barcode, branch_id }
    });
    return data;
};

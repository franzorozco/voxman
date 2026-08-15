import client from '../client';

const BASE_URL="v1/admin/shop-shorts";
/**
 * Fetch active shop shorts for the storefront
 */
export const getActiveShorts = () => client.get(`${BASE_URL}`);

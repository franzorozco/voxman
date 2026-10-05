import api from "../client";

const BASE_URL = "/v1/admin/guests";

export const searchGuests = (query) => 
    api.get(`${BASE_URL}/search`, { params: { q: query } });

export const getGuestHistory = (id) => 
    api.get(`${BASE_URL}/${id}/history`);

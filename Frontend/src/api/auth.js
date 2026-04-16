import api from "./client";

export const registerUser = (data) => api.post("/register", data);

export const loginUser = (data) => api.post("/login", data);
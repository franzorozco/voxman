import api from "../client";

const BASE_URL = "/v1/admin/finance";

// Dashboard
export const getFinanceDashboard = (params) => 
    api.get(`${BASE_URL}/dashboard`, { params });

export const getOwnerLedger = (ownerId) => 
    api.get(`${BASE_URL}/owners/${ownerId}/ledger`);

// Expenses
export const getExpenses = (params) => 
    api.get(`${BASE_URL}/expenses`, { params });

export const getExpenseById = (id) => 
    api.get(`${BASE_URL}/expenses/${id}`);

export const createExpense = (data) => 
    api.post(`${BASE_URL}/expenses`, data);

export const updateExpense = (id, data) => 
    api.put(`${BASE_URL}/expenses/${id}`, data);

export const deleteExpense = (id) => 
    api.delete(`${BASE_URL}/expenses/${id}`);

export const payExpenseSplit = (splitId, data) =>
    api.post(`${BASE_URL}/expenses/splits/${splitId}/pay`, data);

export const archiveExpense = (id) =>
    api.post(`${BASE_URL}/expenses/${id}/archive`);

export const annulExpense = (id) =>
    api.post(`${BASE_URL}/expenses/${id}/annul`);

// Owner Payments
export const getOwnerPayments = (params) => 
    api.get(`${BASE_URL}/owner-payments`, { params });

export const getOwnerPaymentById = (id) => 
    api.get(`${BASE_URL}/owner-payments/${id}`);

export const createOwnerPayment = (data) => 
    api.post(`${BASE_URL}/owner-payments`, data);

export const updateOwnerPayment = (id, data) => 
    api.put(`${BASE_URL}/owner-payments/${id}`, data);

export const deleteOwnerPayment = (id) => 
    api.delete(`${BASE_URL}/owner-payments/${id}`);

export const archiveOwnerPayment = (id) =>
    api.post(`${BASE_URL}/owner-payments/${id}/archive`);

export const annulOwnerPayment = (id) =>
    api.post(`${BASE_URL}/owner-payments/${id}/annul`);

export const transferOwnerFunds = (data) =>
    api.post(`${BASE_URL}/owner-payments/transfer`, data);

// CashFlow
export const getCashFlow = () => 
    api.get(`/v1/admin/cashflow`);

export const transferCash = (data) => 
    api.post(`/v1/admin/cashflow/transfer`, data);

export const openCashRegister = (data) => 
    api.post(`/v1/admin/cashflow/register/open`, data);

export const closeCashRegister = (data) => 
    api.post(`/v1/admin/cashflow/register/close`, data);

export const addTreasuryAdjustment = (data) => 
    api.post(`/v1/admin/cashflow/adjustment`, data);

// Reports
export const getFinanceReports = (params) =>
    api.get(`${BASE_URL}/reports`, { params });

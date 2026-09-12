import api from "../client";

const BASE = "/v1/admin";

// =======================
// BRANDS
// =======================
export const getBrands = () => api.get(`${BASE}/brands`);
export const createBrand = (data) => api.post(`${BASE}/brands`, data);
export const updateBrand = (id, data) => api.put(`${BASE}/brands/${id}`, data);
export const deleteBrand = (id) => api.delete(`${BASE}/brands/${id}`);

// =======================
// CATEGORIES
// =======================
export const getCategories = () => api.get(`${BASE}/categories`);
export const createCategory = (data) => api.post(`${BASE}/categories`, data);
export const updateCategory = (id, data) => api.put(`${BASE}/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`${BASE}/categories/${id}`);

// =======================
// PRODUCT TYPES
// =======================
export const getProductTypes = () => api.get(`${BASE}/product-types`);
export const createProductType = (data) => api.post(`${BASE}/product-types`, data);
export const updateProductType = (id, data) => api.put(`${BASE}/product-types/${id}`, data);
export const deleteProductType = (id) => api.delete(`${BASE}/product-types/${id}`);

// =======================
// ATTRIBUTES
// =======================
export const getAttributes = () => api.get(`${BASE}/attributes`);
export const createAttribute = (data) => api.post(`${BASE}/attributes`, data);
export const updateAttribute = (id, data) => api.put(`${BASE}/attributes/${id}`, data);
export const deleteAttribute = (id) => api.delete(`${BASE}/attributes/${id}`);

// =======================
// ATTRIBUTE VALUES
// =======================
export const getAttributeValues = () => api.get(`${BASE}/attribute-values`);
export const createAttributeValue = (data) => api.post(`${BASE}/attribute-values`, data);
export const updateAttributeValue = (id, data) => api.put(`${BASE}/attribute-values/${id}`, data);
export const deleteAttributeValue = (id) => api.delete(`${BASE}/attribute-values/${id}`);

// =======================
// SIZES
// =======================
export const getSizes = () => api.get(`${BASE}/sizes`);
export const createSize = (data) => api.post(`${BASE}/sizes`, data);
export const updateSize = (id, data) => api.put(`${BASE}/sizes/${id}`, data);
export const deleteSize = (id) => api.delete(`${BASE}/sizes/${id}`);

// =======================
// FITS
// =======================
export const getFits = () => api.get(`${BASE}/fits`);
export const createFit = (data) => api.post(`${BASE}/fits`, data);
export const updateFit = (id, data) => api.put(`${BASE}/fits/${id}`, data);
export const deleteFit = (id) => api.delete(`${BASE}/fits/${id}`);

// =======================
// MEASUREMENT TYPES
// =======================
export const getMeasurementTypes = () => api.get(`${BASE}/measurement-types`);
export const createMeasurementType = (data) => api.post(`${BASE}/measurement-types`, data);
export const updateMeasurementType = (id, data) => api.put(`${BASE}/measurement-types/${id}`, data);
export const deleteMeasurementType = (id) => api.delete(`${BASE}/measurement-types/${id}`);

// =======================
// PRODUCT TYPE MEASUREMENTS
// =======================
export const getProductTypeMeasurements = () => api.get(`${BASE}/product-type-measurements`);
export const createProductTypeMeasurement = (data) => api.post(`${BASE}/product-type-measurements`, data);
export const updateProductTypeMeasurement = (id, data) => api.put(`${BASE}/product-type-measurements/${id}`, data);
export const deleteProductTypeMeasurement = (id) => api.delete(`${BASE}/product-type-measurements/${id}`);

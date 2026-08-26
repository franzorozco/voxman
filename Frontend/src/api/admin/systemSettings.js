import api from "../client";

export const getSystemSettings = async () => {
  const response = await api.get("/v1/admin/system-settings");
  return response.data;
};

export const updateSystemSetting = async (key, data) => {
  if (data instanceof FormData) {
    data.append("_method", "PUT");
    const response = await api.post(`/v1/admin/system-settings/${key}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }
  const response = await api.put(`/v1/admin/system-settings/${key}`, data);
  return response.data;
};

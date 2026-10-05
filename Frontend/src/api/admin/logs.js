import api from "../client";

export const getAuditLogs = async (page = 1) => {
  return await api.get(`/v1/admin/logs?page=${page}`);
};

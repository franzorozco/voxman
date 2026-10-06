import api from "../client";

export const sendContactMessage = (data) => {
  return api.post("/v1/shop/contact", data);
};

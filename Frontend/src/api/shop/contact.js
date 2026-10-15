import api from "../client";

export const sendContactMessage = (data) => {
  return api.post("/v1/shop/contact", data);
};

export const checkContactEmail = (email) => {
  return api.post("/v1/shop/contact/check-email", { email });
};

// src/services/api.js
import { api } from "../lib/api";

export const trackerAPI = {
  getAll: ()         => api.get("/tracker/"),
  create: (data)     => api.post("/tracker/", data),
  update: (id, data) => api.put(`/tracker/${id}`, data),
  post:   (id)       => api.patch(`/tracker/${id}/post`),
};

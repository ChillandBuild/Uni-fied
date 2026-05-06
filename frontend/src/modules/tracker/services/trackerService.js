// src/modules/tracker/services/trackerService.js
import { trackerAPI } from "../../../services/api";

export async function fetchTrackers() {
  return trackerAPI.getAll();
}

export async function saveTracker(formData, editId) {
  const payload = { ...formData, status: "draft", date: new Date().toISOString().split("T")[0] };
  if (editId) return trackerAPI.update(editId, payload);
  return trackerAPI.create(payload);
}

export async function postTracker(formData, editId) {
  const payload = { ...formData, status: "posted", date: new Date().toISOString().split("T")[0] };
  if (editId) {
    await trackerAPI.update(editId, payload);
    return trackerAPI.post(editId);
  }
  const created = await trackerAPI.create(payload);
  return trackerAPI.post(created._id);
}

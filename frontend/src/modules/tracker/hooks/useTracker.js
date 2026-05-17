// src/modules/tracker/hooks/useTracker.js
import { useState } from "react";
import { fetchTrackers, saveTracker, postTracker } from "../services/trackerService";

const EMPTY = { serial: "", location: "Plant", cylinderStatus: "Filled" };

export function useTracker() {
  const [formData, setFormData] = useState(EMPTY);
  const [entries, setEntries] = useState([]);
  const [editId, setEditId] = useState(null);
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchTrackers();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load records.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async (status) => {
    try {
      if (!formData.serial.trim()) throw new Error("Cylinder serial number is required.");
      setLoading(true);
      setError("");
      if (status === "posted") {
        await postTracker(formData, editId);
      } else {
        await saveTracker(formData, editId);
      }
      await loadRecords();
      setFormData(EMPTY);
      setEditId(null);
      setView("list");
    } catch (err) {
      setError(err.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    if (entry.status === "posted") return;
    setFormData({ serial: entry.serial || "", location: entry.location || "Plant", cylinderStatus: entry.cylinderStatus || "Filled" });
    setEditId(entry._id || entry.id);
    setError("");
    setView("form");
  };

  const handleNewEntry = () => { setFormData(EMPTY); setEditId(null); setError(""); setView("form"); };
  const handleCancel = () => { setFormData(EMPTY); setEditId(null); setError(""); setView("list"); };

  return {
    formData, entries, editId, view, loading, error,
    loadRecords, handleChange, handleSave,
    handleEdit, handleNewEntry, handleCancel,
  };
}

// src/pages/LocationTracker.jsx
import { useEffect } from "react";
import TrackerForm from "../../modules/tracker/components/TrackerForm";
import TrackerTable from "../../modules/tracker/components/TrackerTable";
import { useTracker } from "../../modules/tracker/hooks/useTracker";
import "../../styles/inventory.css";

export default function LocationTracker() {
  const {
    formData, entries, editId, view, loading, error,
    loadRecords, handleChange, handleSave,
    handleEdit, handleNewEntry, handleCancel,
  } = useTracker();

  useEffect(() => { loadRecords(); }, []);

  if (view === "list") {
    return (
      <div className="inv-page">
        <div className="list-header">
          <span className="record-count">{entries.length} Record{entries.length !== 1 ? "s" : ""}</span>
          <button className="btn-new" onClick={handleNewEntry}>+ New Entry</button>
        </div>
        {loading && <p className="loading-text">Loading...</p>}
        <div className="list-card">
          <TrackerTable entries={entries} handleEdit={handleEdit} />
        </div>
      </div>
    );
  }

  return (
    <div className="inv-page">
      <div className="form-topbar">
        <button className="btn-back" onClick={handleCancel}>← Back to Records</button>
      </div>
      <TrackerForm
        formData={formData} handleChange={handleChange}
        handleSave={handleSave} handleCancel={handleCancel}
        loading={loading} error={error}
      />
    </div>
  );
}

// src/modules/tracker/components/TrackerForm.jsx
export default function TrackerForm({ formData, handleChange, handleSave, handleCancel, loading, error }) {
  return (
    <>
      {error && <p className="error-text">{error}</p>}
      <form className="form-card" onSubmit={(e) => e.preventDefault()}>
        <div className="row">
          <div className="field"><label>Serial Number</label>
            <input name="serial" value={formData.serial} onChange={handleChange} placeholder="CYL-0001" />
          </div>
          <div className="field"><label>Location</label>
            <select name="location" value={formData.location} onChange={handleChange}>
              <option value="Plant">Plant</option>
              <option value="Warehouse">Warehouse</option>
              <option value="In Transit">In Transit</option>
              <option value="Customer Site">Customer Site</option>
            </select>
          </div>
          <div className="field"><label>Status</label>
            <select name="cylinderStatus" value={formData.cylinderStatus} onChange={handleChange}>
              <option value="Filled">Filled</option>
              <option value="Empty">Empty</option>
              <option value="In Use">In Use</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-save" onClick={() => handleSave("draft")} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button type="button" className="btn-post" onClick={() => handleSave("posted")} disabled={loading}>
            {loading ? "Posting..." : "Post"}
          </button>
          <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </>
  );
}

// src/modules/tracker/components/TrackerTable.jsx
export default function TrackerTable({ entries, handleEdit }) {
  if (entries.length === 0) {
    return <div className="empty-state"><p>No tracker records yet. Click <strong>+ New Entry</strong> to get started.</p></div>;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>Serial Number</th><th>Location</th><th>Cylinder Status</th>
          <th>Date</th><th>Entry Status</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((h, i) => (
          <tr key={i}>
            <td>{h.serial}</td><td>{h.location}</td><td>{h.cylinderStatus}</td><td>{h.date}</td>
            <td>
              <span className={`badge ${h.status === "posted" ? "badge-posted" : "badge-draft"}`}>
                {h.status === "posted" ? "Posted" : "Draft"}
              </span>
            </td>
            <td>
              {h.status !== "posted" && (
                <button className="btn-edit" onClick={() => handleEdit(h)}>Edit</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

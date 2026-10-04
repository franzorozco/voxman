export default function SoftDeleteModal({
  data,
  formData,
  onClose,
  onRestore,
  onOverwrite
}) {
  if (!data) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">

        <h2>Usuario ya existente (eliminado)</h2>

        <div className="info-box">
          <p><strong>Email:</strong> {data.email}</p>
          <p><strong>Username:</strong> {data.username}</p>
        </div>

        <p>Este usuario fue eliminado anteriormente. ¿Qué deseas hacer?</p>

        <div className="modal-actions">

          <button
            className="btn-secondary"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="btn-warning"
            onClick={() => onOverwrite(formData)}
          >
            Sobrescribir
          </button>

          <button
            className="btn-primary"
            onClick={() => onRestore(formData)}
          >
            Reactivar
          </button>

        </div>
      </div>
    </div>
  );
}
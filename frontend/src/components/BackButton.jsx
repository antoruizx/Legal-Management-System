import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
        color: "#374151",
        marginBottom: "15px",
        padding: 0,
      }}
    >
      ← Volver
    </button>
  );
}
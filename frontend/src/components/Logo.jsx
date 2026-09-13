export default function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3V21" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 7H19" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 7L2 13C2 14.6569 3.34315 16 5 16C6.65685 16 8 14.6569 8 13L5 7Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        <path d="M19 7L16 13C16 14.6569 17.3431 16 19 16C20.6569 16 22 14.6569 22 13L19 7Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 21H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h3 style={{ margin: 0 }}>Legal Management System</h3>
    </div>
  );
}
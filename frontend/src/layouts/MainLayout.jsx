import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { diasDePrueba } from "../utils/prueba";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Estudios en prueba gratis: aviso de cuántos días quedan (pruebaHasta viene en el login)
  const dias = user?.pruebaHasta ? diasDePrueba(user.pruebaHasta) : null;

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="app-content">
          {dias !== null && (
            <div className="alert-banner alert-warning" style={{ marginTop: 0 }}>
              {dias > 0
                ? `Estás usando la prueba gratis de Foja: te ${dias === 1 ? "queda 1 día" : `quedan ${dias} días`}. Para seguir usándolo, contactá a tu asesor.`
                : "Tu prueba gratis de Foja vence hoy. Para seguir usándolo, contactá a tu asesor."}
            </div>
          )}
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import ClienteForm from "./pages/ClienteForm";
import ClienteDetalle from "./pages/ClienteDetalle";
import Expedientes from "./pages/Expedientes";
import ExpedienteForm from "./pages/ExpedienteForm";
import ExpedienteDetalle from "./pages/ExpedienteDetalle";
import Tareas from "./pages/Tareas";
import TareaForm from "./pages/TareaForm";
import TareaDetalle from "./pages/TareaDetalle";
import MiPerfil from "./pages/MiPerfil";
import ConfiguracionUsuarios from "./pages/ConfiguracionUsuarios";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
        <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/nuevo" element={<ClienteForm />} />
            <Route path="/clientes/:id/editar" element={<ClienteForm />} />
            <Route path="/clientes/:id" element={<ClienteDetalle />} />
            <Route path="/expedientes" element={<Expedientes />} />
            <Route path="/expedientes/nuevo" element={<ExpedienteForm />} />
            <Route path="/expedientes/:id/editar" element={<ExpedienteForm />} />
            <Route path="/expedientes/:id" element={<ExpedienteDetalle />} />
            <Route path="/tareas" element={<Tareas />} />
            <Route path="/tareas/nuevo" element={<TareaForm />} />
            <Route path="/tareas/:id/editar" element={<TareaForm />} />
            <Route path="/tareas/:id" element={<TareaDetalle />} />
            <Route path="/mi-perfil" element={<MiPerfil />} />
            <Route path="/configuracion-usuarios" element={<ConfiguracionUsuarios />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
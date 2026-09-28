import { memo } from "react";
import ParticlesBg from "./ParticlesBg";

function LoginHero() {
  return (
    <div className="login-hero">
      <div className="login-orb orb-1" />
      <div className="login-orb orb-2" />
      <div className="login-orb orb-3" />

      <ParticlesBg />

      <div className="login-hero-content">
        <h1>Gestioná tu estudio jurídico en un solo lugar</h1>
        <p>
          Clientes, expedientes y tareas organizados, con vencimientos y estados
          siempre a la vista.
        </p>
        <div className="login-hero-badges">
          <span className="badge badge-success"><span className="badge-dot dot-success"></span>Activo</span>
          <span className="badge badge-info"><span className="badge-dot dot-info"></span>En trámite</span>
          <span className="badge badge-warning"><span className="badge-dot dot-warning"></span>Próxima</span>
          <span className="badge badge-danger"><span className="badge-dot dot-danger"></span>Urgente</span>
        </div>
      </div>
    </div>
  );
}

export default memo(LoginHero);
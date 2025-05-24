import { useState, useEffect } from "react";
import GestionUsuarios from "./GestionUsuarios";

function DashboardAdmin() {
  const [mostrarGestionUsuarios, setMostrarGestionUsuarios] = useState(false);
  const [mostrarGestion, setMostrarGestion] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('tecnico');
  const [mensaje, setMensaje] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [filtro, setFiltro] = useState('');

  

  

  
  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Panel de Administración</h2>
      <p>Bienvenido administrador. Aquí puedes gestionar usuarios, ver reportes, etc.</p>

      <button className="toggle-button" onClick={() => setMostrarGestion(!mostrarGestion)}>
        {mostrarGestion ? "Ocultar Gestión de Usuarios" : "Mostrar Gestión de Usuarios"}
      </button>

      {mostrarGestion && <GestionUsuarios />}
    </div>
  );
}

export default DashboardAdmin;

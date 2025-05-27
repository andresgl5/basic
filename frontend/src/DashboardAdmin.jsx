import { useState, useEffect } from "react";
import GestionUsuarios from "./GestionUsuarios";
import GestionDelegaciones from "./GestionDelegaciones";

function DashboardAdmin() {
  const [mostrarGestionUsuarios, setMostrarGestionUsuarios] = useState(false);
  const [mostrarGestionDelegaciones, setMostrarGestionDelegaciones] = useState(false);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:8000/tecnicos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("No autorizado");
        }
        return res.json();
      })
      .then((data) => setTecnicos(data.tecnicos || []))
      .catch((error) => {
        console.error("Error al obtener técnicos:", error);
      });
  }, []);


  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Panel de Administración</h2>
      <p>Bienvenido administrador. Aquí puedes gestionar usuarios, ver reportes, etc.</p>

      <button className="toggle-button" onClick={() => setMostrarGestionUsuarios(!mostrarGestionUsuarios)}>
        {mostrarGestionUsuarios ? "Ocultar Gestión de Usuarios" : "Mostrar Gestión de Usuarios"}
      </button>
      {mostrarGestionUsuarios && <GestionUsuarios />}

      <button className="toggle-button" onClick={() => setMostrarGestionDelegaciones(!mostrarGestionDelegaciones)}>
        {mostrarGestionDelegaciones ? "Ocultar Gestión de Delegaciones" : "Mostrar Gestión de Delegaciones"}
      </button>
      {mostrarGestionDelegaciones && <GestionDelegaciones tecnicos={usuarios} />}
    </div>
  );
}

export default DashboardAdmin;

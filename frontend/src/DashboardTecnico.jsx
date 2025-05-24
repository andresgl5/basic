import { useState } from "react";

function DashboardTecnico() {
  const [mostrarBuscarClientes, setMostrarBuscarClientes] = useState(false);
  const [razonSocial, setRazonSocial] = useState('');
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [mostrarProyectos, setMostrarProyectos] = useState(false);
  const [filtroDireccion, setFiltroDireccion] = useState("");
  const [filtroProyecto, setFiltroProyecto] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("");


  const handleBuscarClientes = async () => {
    try {
      const res = await fetch(`http://localhost:8000/buscar/?razon_social=${encodeURIComponent(razonSocial)}`);
      if (!res.ok) throw new Error("No se encontró el cliente.");
      const data = await res.json();
      setClientes(data.clientes || []);
      setError(null);
    } catch (err) {
      setClientes([]);
      setError(err.message);
    }
  };

  const obtenerProyectos = async () => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/instalaciones", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error cargando proyectos");
      }

      const data = await res.json();
      setProyectos(data.proyectos);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Panel de Técnico</h2>
      <p>Bienvenido técnico. Aquí puedes buscar clientes y ver los proyectos disponibles.</p>

      <button className="toggle-button" onClick={() => setMostrarBuscarClientes(!mostrarBuscarClientes)}>
        {mostrarBuscarClientes ? "Ocultar Buscar Clientes" : "Buscar Clientes"}
      </button>

      {mostrarBuscarClientes && (
        <div className="buscar-clientes">
          <h3>Buscar Cliente</h3>
          <input
            type="text"
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            placeholder="Introduce la razón social"
          />
          <button onClick={handleBuscarClientes}>Buscar</button>

          {/* Mostrar resultados */}
          {clientes.length > 0 ? (
            <div className="results">
              <h4>Resultados encontrados:</h4>
              <ul>
                {clientes.map((cliente, index) => (
                  <li key={index}>
                    <p><strong>Razón Social:</strong> {cliente.razon_social}</p>
                    <p><strong>Dirección:</strong> {cliente.direccion}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            razonSocial && <p></p>
          )}

          {/* Mensaje de error */}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      )}
      <button
        onClick={() => {
          if (!mostrarProyectos) obtenerProyectos();
          setMostrarProyectos(!mostrarProyectos);
        }}
        className="logout-button button-spacing"
      >
        {mostrarProyectos ? "Ocultar proyectos" : "Ver proyectos disponibles"}
      </button>


      {error && <p className="error-message">{error}</p>}

      
      {mostrarProyectos && (
        <div className="project-list">
          <h3>Proyectos disponibles</h3>
          <input
            type="text"
            placeholder="Proyecto"
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            type="text"
            placeholder="Dirección"
            value={filtroDireccion}
            onChange={(e) => setFiltroDireccion(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
            <option value="">Todos los niveles</option>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Nivel {n}</option>)}
          </select>

          <ul style={{ marginTop: "1rem" }}>
            {proyectos
              .filter(
                (p) =>
                  p.proyecto.toLowerCase().includes(filtroProyecto.toLowerCase()) &&
                  p.direccion.toLowerCase().includes(filtroDireccion.toLowerCase()) &&
                  (filtroNivel === "" || String(p.nivel_seguridad) === filtroNivel)
              )
              .map((p, idx) => (
                <li key={idx}>
                  <strong>{p.proyecto}</strong> — {p.direccion} <span style={{ color: "#888" }}>(Nivel: {p.nivel_seguridad})</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DashboardTecnico;

  
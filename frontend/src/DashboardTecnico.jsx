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
  const [delegaciones, setDelegaciones] = useState([]);
  const [delegacionesAbiertas, setDelegacionesAbiertas] = useState({});
  const [filtroLocalidad, setFiltroLocalidad] = useState("");
  const [filtroRazonSocial, setFiltroRazonSocial] = useState("");

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

  const obtenerDelegaciones = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = JSON.parse(atob(token.split(".")[1]));
      const email = payload.sub;

      const res = await fetch(`http://localhost:8000/mis-delegaciones`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("No se pudieron cargar las delegaciones");
      const data = await res.json();
      setDelegaciones(data.delegaciones || []);
    } catch (err) {
      console.error("Error obteniendo delegaciones:", err);
      setError("No se pudieron cargar las delegaciones");
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

  const proyectosAgrupados = proyectos.reduce((acc, proyecto) => {
    const delegacion = proyecto.delegacion || "Sin delegación";
    if (!acc[delegacion]) acc[delegacion] = [];
    if (
      proyecto.proyecto.toLowerCase().includes(filtroProyecto.toLowerCase()) &&
      proyecto.direccion.toLowerCase().includes(filtroDireccion.toLowerCase()) &&
      proyecto.localidad.toLowerCase().includes(filtroLocalidad.toLowerCase()) &&
      proyecto.razon_social.toLowerCase().includes(filtroRazonSocial.toLowerCase()) &&
      (filtroNivel === "" || String(proyecto.nivel_seguridad) === filtroNivel)
    ) {
      acc[delegacion].push(proyecto);
    }
    return acc;
  }, {});

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Panel de Técnico</h2>
      <p>Bienvenido técnico. Aquí puedes buscar clientes y ver los proyectos disponibles.</p>
      {/*} 
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

          {error && <p className="error-message">{error}</p>}
        </div>
      )}
      */}
      <button
        onClick={() => {
          if (!mostrarProyectos) {
            obtenerDelegaciones();
            obtenerProyectos();
          }
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
            className="filtro-nivel"
            type="text"
            placeholder="Proyecto"
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            className="filtro-nivel"
            type="text"
            placeholder="Dirección"
            value={filtroDireccion}
            onChange={(e) => setFiltroDireccion(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            className="filtro-nivel"
            type="text"
            placeholder="Localidad"
            value={filtroLocalidad}
            onChange={(e) => setFiltroLocalidad(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            className="filtro-nivel"
            type="text"
            placeholder="Razón social"
            value={filtroRazonSocial}
            onChange={(e) => setFiltroRazonSocial(e.target.value)}
            style={{ marginRight: "10px", marginTop: "5px"}}
          />
          <select className="filtro-nivel" value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
            <option value="">Todos los niveles</option>
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>Nivel {n}</option>
            ))}
          </select>

          <div style={{ marginTop: "1rem" }}>
            {delegaciones.length === 0 ? (
              <p>No hay delegaciones asignadas.</p>
            ) : (
              delegaciones.map(delegacion => {
                const proyectosDelegacion = proyectosAgrupados[delegacion] || [];
                return (
                  <div key={delegacion} className="delegacion-group">
                    <button
                      className="toggle-button"
                      onClick={() =>
                        setDelegacionesAbiertas(prev => ({
                          ...prev,
                          [delegacion]: !prev[delegacion],
                        }))
                      }
                    >
                      {delegacionesAbiertas[delegacion] ? "▼" : "▶"} {delegacion} ({proyectosDelegacion.length})
                    </button>
                    {delegacionesAbiertas[delegacion] && (
                      <ul className="delegacion-list">
                        {proyectosDelegacion.length === 0 ? (
                          <li className="result-item">Sin proyectos disponibles</li>
                        ) : (
                          proyectosDelegacion.map((p, idx) => (
                            <li key={idx} className="result-item">
                              <details>
                                <summary>
                                  <strong>{p.proyecto}</strong> — {p.direccion} ({p.localidad})<br />
                                  <em>Nivel: {p.nivel_seguridad}</em>
                                </summary>
                                {!p.detalles ? (
                                  <button
                                    onClick={async () => {
                                      const res = await fetch(`http://localhost:8000/proyectos/${encodeURIComponent(p.proyecto)}/detalles`, {
                                        headers: {
                                          Authorization: `Bearer ${localStorage.getItem("token")}`,
                                        },
                                      });
                                      const data = await res.json();
                                      setProyectos(prev =>
                                        prev.map(proj =>
                                          proj.proyecto === p.proyecto ? { ...proj, detalles: data.detalles } : proj
                                        )
                                      );
                                    }}
                                  >
                                    Cargar detalles
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setProyectos(prev =>
                                          prev.map(proj =>
                                            proj.proyecto === p.proyecto ? { ...proj, detalles: null } : proj
                                          )
                                        );
                                      }}
                                    >
                                      Ocultar detalles
                                    </button>

                                    {p.detalles.length === 0 ? (
                                      <p><em>No hay equipos asociados.</em></p>
                                    ) : (
                                      <ul style={{ marginTop: "0.5rem" }}>
                                        {p.detalles.map((d, i) => (
                                          <li key={i} className="equipo-card">
                                            <div className="equipo-header">
                                              {d.tipo} ({d.estado})
                                            </div>
                                            <div className="equipo-datos">
                                              {d.marca} {d.modelo} — <strong>Serie:</strong> {d.numero_serie}<br />
                                              <strong>IP:</strong> {d.ip} — <strong>MAC:</strong> {d.mac}
                                            </div>
                                            {d.claves.length > 0 ? (
                                              d.claves.map((clave, idx) => (
                                                <div key={idx} className="clave-item">
                                                  <em>Usuario:</em> {clave.usuario} —
                                                  <em> Contraseña:</em> {clave.contrasena} —
                                                  <em> PIN:</em> {clave.pin}
                                                </div>
                                              ))
                                            ) : (
                                              <em>Sin claves asociadas<br /></em>
                                          )}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </>
                                )}
                              </details>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardTecnico;

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
  const [formularioNuevoEquipo, setFormularioNuevoEquipo] = useState({});
  const [editandoEquipo, setEditandoEquipo] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [editandoClaves, setEditandoClaves] = useState(null);
  const [formularioNuevaClave, setFormularioNuevaClave] = useState({});
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


  const tiposEquipoMap = {
    "Grabador": "TE01",
    "Cámara fija": "TE02",
    "Minidomo": "TE03",
    "Domo PTZ": "TE04",
    "Switch": "TE05",
    "Central Intrusión": "TE06",
    "Central Incendio": "TE07",
    "Ordenador": "TE08",
    "Software": "TE09",
    "Otro": "TE10",
  };  

  const handleEditarEquipo = async (e, proyecto, ide) => {
    e.preventDefault();
    const form = e.target;
    const token = localStorage.getItem("token");

    const tipoSeleccionado = form.tipo.value;
    const idte = tiposEquipoMap[tipoSeleccionado];

    const equipoActualizado = {
      idte: idte,
      estado: form.estado.value,
      marca: form.marca.value,
      modelo: form.modelo.value,
      numero_serie: form.numero_serie.value,
      mac: form.mac.value,
      ip: form.ip.value,
    };

    try {
      const res = await fetch(`http://localhost:8000/equipos/${ide}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(equipoActualizado),
      });

      if (!res.ok) throw new Error("Error al actualizar el equipo");

      const detallesRes = await fetch(`http://localhost:8000/proyectos/${encodeURIComponent(proyecto)}/detalles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await detallesRes.json();
      setProyectos(prev =>
        prev.map(proj => (proj.proyecto === proyecto ? { ...proj, detalles: data.detalles } : proj))
      );
      setEditandoEquipo(null);
      setMensaje("Equipo guardado correctamente");

      setTimeout(() => {
        setMensaje("");  
      }, 3000);

    } catch (error) {
      console.error("Error al actualizar equipo:", error);
    }
  };

  const handleCrearEquipo = async (e, proyecto) => {
  e.preventDefault();
  const form = e.target;
  const token = localStorage.getItem("token");

  const tipoSeleccionado = form.tipo.value;
  const idte = tiposEquipoMap[tipoSeleccionado];

  const nuevoEquipo = {
    idp: proyecto,
    idte: idte,  
    estado: form.estado.value,
    marca: form.marca.value,
    modelo: form.modelo.value,
    numero_serie: form.numero_serie.value,
    mac: form.mac.value,
    ip: form.ip.value,
  };

  
  try {
    const res = await fetch(`http://localhost:8000/equipos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(nuevoEquipo),
    });

    if (!res.ok) throw new Error("Error al crear el equipo");

    const detallesRes = await fetch(`http://localhost:8000/proyectos/${encodeURIComponent(proyecto)}/detalles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await detallesRes.json();
    setProyectos(prev =>
      prev.map(proj => (proj.proyecto === proyecto ? { ...proj, detalles: data.detalles } : proj))
    );
    setFormularioNuevoEquipo(prev => ({ ...prev, [proyecto]: false }));
  } catch (error) {
    console.error("Error al crear equipo:", error);
  }
};

const handleEditarClaves = async (e, proyecto, idc) => {
  e.preventDefault();
  const form = e.target;
  const token = localStorage.getItem("token");

  const clavesActualizadas = {
    usuario: form.usuario.value,
    contrasena: form.contrasena.value,
    pin: form.pin.value,
  };

  try {
    const res = await fetch(`http://localhost:8000/claves/${idc}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(clavesActualizadas),
    });

    if (!res.ok) throw new Error("Error al actualizar las claves");

    const detallesRes = await fetch(`http://localhost:8000/proyectos/${encodeURIComponent(proyecto)}/detalles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await detallesRes.json();
    setProyectos(prev =>
      prev.map(proj => (proj.proyecto === proyecto ? { ...proj, detalles: data.detalles } : proj))
    );
    setEditandoClaves(null);
    setMensaje("Clave actualizada correctamente");

    setTimeout(() => {
      setMensaje("");  
    }, 3000);

  } catch (error) {
    console.error("Error al actualizar claves:", error);
  }
};

const handleCrearClave = async (e, proyecto, ide) => {
  e.preventDefault();
  const form = e.target;
  const token = localStorage.getItem("token");

  const nuevaClave = {
    ide: ide,
    usuario: form.usuario.value,
    contrasena: form.contrasena.value,
    pin: form.pin.value,
  };

  try {
    const res = await fetch(`http://localhost:8000/claves`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(nuevaClave),
    });

    if (!res.ok) throw new Error("Error al crear la clave");

    const detallesRes = await fetch(`http://localhost:8000/proyectos/${encodeURIComponent(proyecto)}/detalles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await detallesRes.json();
    setProyectos(prev =>
      prev.map(proj => (proj.proyecto === proyecto ? { ...proj, detalles: data.detalles } : proj))
    );
    setFormularioNuevaClave(prev => ({ ...prev, [ide]: false }));
    setMensaje("Clave creada correctamente");

    setTimeout(() => {
      setMensaje(""); 
    }, 3000);

  } catch (error) {
    console.error("Error al crear clave:", error);
  }
};

const handleEliminarClave = async (proyecto, idc) => {
  const token = localStorage.getItem("token");

  if (!window.confirm("¿Estás seguro de que quieres eliminar esta clave?")) return;

  try {
    const res = await fetch(`http://localhost:8000/claves/${idc}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Error al eliminar la clave");

    const detallesRes = await fetch(`http://localhost:8000/proyectos/${encodeURIComponent(proyecto)}/detalles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await detallesRes.json();
    setProyectos(prev =>
      prev.map(proj => (proj.proyecto === proyecto ? { ...proj, detalles: data.detalles } : proj))
    );
    setEditandoClaves(null);
    setMensaje("Clave eliminada correctamente");

    setTimeout(() => {
      setMensaje("");
    }, 3000);

  } catch (error) {
    console.error("Error al eliminar clave:", error);
  }
};

const handleEliminarEquipo = async (proyecto, ide) => {
  const token = localStorage.getItem("token");

  if (!window.confirm("¿Estás seguro de que quieres eliminar este equipo?")) return;

  try {
    const res = await fetch(`http://localhost:8000/equipos/${ide}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Error al eliminar el equipo");

    const detallesRes = await fetch(`http://localhost:8000/proyectos/${encodeURIComponent(proyecto)}/detalles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await detallesRes.json();
    setProyectos(prev =>
      prev.map(proj => (proj.proyecto === proyecto ? { ...proj, detalles: data.detalles } : proj))
    );
    setMensaje("Equipo eliminado correctamente");

    setTimeout(() => {
      setMensaje("");
    }, 3000);

  } catch (error) {
    console.error("Error al eliminar equipo:", error);
  }
};



  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Panel de Encargado</h2>
      <p>Bienvenido encargado. Aquí puedes buscar clientes y ver/modificar los proyectos disponibles.</p>
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
                                          <button onClick={() => setEditandoEquipo(d)} className="btn-inline">Editar equipo</button>

                                          {editandoEquipo && editandoEquipo.ide === d.ide && (
                                            <form onSubmit={(e) => handleEditarEquipo(e, p.proyecto, d.ide)}>
                                              <select name="tipo" defaultValue={editandoEquipo.tipo} required>
                                                <option value="">Selecciona Tipo</option>
                                                <option value="Grabador">Grabador</option>
                                                <option value="Cámara fija">Cámara fija</option>
                                                <option value="Minidomo">Minidomo</option>
                                                <option value="Domo PTZ">Domo PTZ</option>
                                                <option value="Switch">Switch</option>
                                                <option value="Central Intrusión">Central Intrusión</option>
                                                <option value="Central Incendio">Central Incendio</option>
                                                <option value="Ordenador">Ordenador</option>
                                                <option value="Software">Software</option>
                                                <option value="Otro">Otro</option>
                                              </select>

                                              <select name="estado" defaultValue={editandoEquipo.estado} required>
                                                <option value="">Selecciona Estado</option>
                                                <option value="Activo">Activo</option>
                                                <option value="No Activo">No Activo</option>
                                              </select>

                                              <input type="text" name="marca" defaultValue={editandoEquipo.marca} placeholder="Marca" required />
                                              <input type="text" name="modelo" defaultValue={editandoEquipo.modelo} placeholder="Modelo" required />
                                              <input type="text" name="numero_serie" defaultValue={editandoEquipo.numero_serie} placeholder="Número de Serie" />
                                              <input type="text" name="mac" defaultValue={editandoEquipo.mac} placeholder="MAC" />
                                              <input type="text" name="ip" defaultValue={editandoEquipo.ip} placeholder="IP" /><br />

                                              <button type="submit" style={{ marginRight:"10px"}} className="btn-guardar">Guardar cambios</button>
                                              <button type="button" className="btn-cancelar" onClick={() => setEditandoEquipo(null)}>Cancelar</button>
                                              <button type="button"  className="btn-eliminar" onClick={() => handleEliminarEquipo(p.proyecto, d.ide)}>Eliminar equipo</button>
                                            </form>
                                          )}<br />
                                          {d.claves.length > 0 ? (
                                            d.claves.map((clave, idx) => (
                                              <div key={idx} className="clave-item">
                                                <em>Usuario:</em> {clave.usuario} —
                                                <em> Contraseña:</em> {clave.contrasena} —
                                                <em> PIN:</em> {clave.pin}
                                                <button 
                                                  onClick={() => setEditandoClaves({ equipo: d.ide, claveIndex: idx })}
                                                  className="btn-inline"
                                                >
                                                  Editar clave
                                                </button>

                                                {editandoClaves && editandoClaves.equipo === d.ide && editandoClaves.claveIndex === idx && (
                                                  <form onSubmit={(e) => handleEditarClaves(e, p.proyecto, clave.idc)}>
                                                    <input type="text" name="usuario" defaultValue={clave.usuario} placeholder="Usuario" required />
                                                    <input type="text" name="contrasena" defaultValue={clave.contrasena} placeholder="Contraseña" required />
                                                    <input type="text" name="pin" defaultValue={clave.pin} placeholder="PIN" /><br />
                                                    <button type="submit" style={{ marginRight: "10px" }} className="btn-guardar">Guardar clave</button>
                                                    <button type="button" className="btn-cancelar" onClick={() => setEditandoClaves(null)}>Cancelar</button>
                                                    <button type="button"  className="btn-eliminar" onClick={() => handleEliminarClave(p.proyecto, clave.idc)}>Eliminar clave</button>
                                                  </form>
                                                )}
                                              </div>
                                            ))
                                          ) : (
                                            <em>Sin claves asociadas<br /></em>
                                          )}
                                          <button onClick={() => setFormularioNuevaClave(prev => ({ ...prev, [d.ide]: true }))}>
                                            Añadir nueva clave
                                          </button>

                                          {formularioNuevaClave[d.ide] && (
                                            <form onSubmit={(e) => handleCrearClave(e, p.proyecto, d.ide)}>
                                              <input type="text" name="usuario" placeholder="Usuario" required />
                                              <input type="text" name="contrasena" placeholder="Contraseña" required />
                                              <input type="text" name="pin" placeholder="PIN" /><br />
                                              <button type="submit" style={{ marginRight: "10px" }} className="btn-guardar">Guardar clave</button>
                                              <button type="button" className="btn-cancelar" onClick={() => setFormularioNuevaClave(prev => ({ ...prev, [d.ide]: false }))}>Cancelar</button>
                                            </form>
                                          )}
                                        </li>
                                      ))}
                                      {mensaje && <div className="mensaje-exito">{mensaje}</div>}
                                    </ul>
                                  )}
                                  
                                  {!formularioNuevoEquipo[p.proyecto] ? (
                                    <button onClick={() => setFormularioNuevoEquipo(prev => ({ ...prev, [p.proyecto]: true }))}>
                                      Añadir nuevo equipo
                                    </button>
                                  ) : (
                                    <form onSubmit={(e) => handleCrearEquipo(e, p.proyecto)}>
                                      <select name="tipo" required>
                                        <option value="">Selecciona Tipo</option>
                                        <option value="Grabador">Grabador</option>
                                        <option value="Cámara fija">Cámara fija</option>
                                        <option value="Minidomo">Minidomo</option>
                                        <option value="Domo PTZ">Domo PTZ</option>
                                        <option value="Switch">Switch</option>
                                        <option value="Central Intrusión">Central Intrusión</option>
                                        <option value="Central Incendio">Central Incendio</option>
                                        <option value="Ordenador">Ordenador</option>
                                        <option value="Software">Software</option>
                                        <option value="Otro">Otro</option>
                                      </select>

                                      <select name="estado" required>
                                        <option value="">Selecciona Estado</option>
                                        <option value="Activo">Activo</option>
                                        <option value="No Activo">No Activo</option>
                                      </select>
                                      <input type="text" name="marca" placeholder="Marca" required />
                                      <input type="text" name="modelo" placeholder="Modelo" required />
                                      <input type="text" name="numero_serie" placeholder="Número de Serie" />
                                      <input type="text" name="mac" placeholder="MAC" />
                                      <input type="text" name="ip" placeholder="IP" />
                                      <button type="submit" className="btn-guardar" style={{ marginTop:"3px"}}>Guardar equipo</button>
                                      <button type="button" className="btn-cancelar" onClick={() => setFormularioNuevoEquipo(prev => ({ ...prev, [p.proyecto]: false }))}>Cancelar</button>
                                    </form>
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

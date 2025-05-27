import { useEffect, useState } from "react";

function GestionDelegaciones() {
  const [tecnicos, setTecnicos] = useState([]);
  const [delegaciones, setDelegaciones] = useState([]);
  const [delegacionesAsignadas, setDelegacionesAsignadas] = useState([]);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState("");
  const [delegacionSeleccionada, setDelegacionSeleccionada] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:8000/tecnicos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTecnicos(data.tecnicos || []));

    fetch("http://localhost:8000/delegaciones", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setDelegaciones(data.delegaciones || []));
  }, []);

  useEffect(() => {
    if (!tecnicoSeleccionado) return;

    fetch(`http://localhost:8000/tecnicos/${tecnicoSeleccionado}/delegaciones`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => setDelegacionesAsignadas(data.delegaciones || []));
  }, [tecnicoSeleccionado]);

  const asignarDelegacion = () => {
  if (!delegacionSeleccionada || delegacionesAsignadas.includes(delegacionSeleccionada)) {
    return; 
  }

  fetch(`http://localhost:8000/tecnicos/${tecnicoSeleccionado}/delegaciones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ delegaciones: [delegacionSeleccionada] }),
  }).then(() => {
    setDelegacionesAsignadas([...delegacionesAsignadas, delegacionSeleccionada]);
  });
};


  const eliminarDelegacion = (delegacion) => {
    fetch(`http://localhost:8000/tecnicos/${tecnicoSeleccionado}/delegaciones`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ delegaciones: [delegacion] }),
    }).then(() => {
      setDelegacionesAsignadas(delegacionesAsignadas.filter((d) => d !== delegacion));
    });
  };

  return (
    <div className="gestion-delegaciones-container">
      <h3 className="gestion-delegaciones-title">Gestión de Delegaciones por Técnico</h3>

      <div>
        <label className="gestion-delegaciones-label">Seleccionar técnico:</label>
        <select
          value={tecnicoSeleccionado}
          onChange={(e) => setTecnicoSeleccionado(e.target.value)}
          className="gestion-delegaciones-select"
        >
          <option value="">-- Selecciona --</option>
          {tecnicos.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {tecnicoSeleccionado && (
        <>
          <div style={{ marginTop: "15px" }}>
            <label className="gestion-delegaciones-label">Asignar delegación:</label>
            <select
              value={delegacionSeleccionada}
              onChange={(e) => setDelegacionSeleccionada(e.target.value)}
              className="gestion-delegaciones-select"
            >
              <option value="">-- Selecciona --</option>
              {delegaciones.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button onClick={asignarDelegacion} className="gestion-delegaciones-button">
              Asignar
            </button>
          </div>

          <h4 className="gestion-delegaciones-subtitle">Delegaciones asignadas:</h4>
          <ul className="gestion-delegaciones-list">
            {delegacionesAsignadas.map((d) => (
              <li key={d}>
                {d}
                <button
                  onClick={() => eliminarDelegacion(d)}
                  className="gestion-delegaciones-delete-button"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default GestionDelegaciones;

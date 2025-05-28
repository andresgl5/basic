import { useEffect, useState } from "react";

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const token = localStorage.getItem("token");

  const cargarUsuarios = async () => {
    try {
      const res = await fetch("http://localhost:8000/usuarios", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const actualizarUsuario = async (email, rol, delegacion, nivel) => {
    try {
      const res = await fetch(`http://localhost:8000/usuarios/${email}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rol,
          delegacion,
          nivel_seguridad: nivel,
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar");

      setMensaje(`Usuario ${email} actualizado`);
      cargarUsuarios(); // refrescar
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="gestion-usuarios">
      <h3>Gestión de Usuarios</h3>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}

      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Rol</th>
            <th>Delegación</th>
            <th>Nivel Seguridad</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u, index) => (
            <tr key={index}>
              <td>{u.email}</td>
              <td>
                <select
                  value={u.rol}
                  onChange={(e) =>
                    setUsuarios((prev) =>
                      prev.map((x, i) =>
                        i === index ? { ...x, rol: parseInt(e.target.value) } : x
                      )
                    )
                  }
                >
                  <option value={1}>Técnico</option>
                  <option value={2}>Encargado</option>
                  <option value={3}>Administrador</option>
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={u.delegacion || ""}
                  onChange={(e) =>
                    setUsuarios((prev) =>
                      prev.map((x, i) =>
                        i === index ? { ...x, delegacion: e.target.value } : x
                      )
                    )
                  }
                />
              </td>
              <td>
                <select
                  value={u.nivel_seguridad || 1}
                  onChange={(e) =>
                    setUsuarios((prev) =>
                      prev.map((x, i) =>
                        i === index
                          ? { ...x, nivel_seguridad: parseInt(e.target.value) }
                          : x
                      )
                    )
                  }
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  onClick={() =>
                    actualizarUsuario(
                      u.email,
                      u.rol,
                      u.delegacion,
                      u.nivel_seguridad
                    )
                  }
                >
                  Guardar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GestionUsuarios;

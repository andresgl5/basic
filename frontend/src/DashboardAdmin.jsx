import { useState, useEffect } from "react";

function DashboardAdmin() {
  const [mostrarGestionUsuarios, setMostrarGestionUsuarios] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('tecnico');
  const [mensaje, setMensaje] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [filtro, setFiltro] = useState('');

  const handleGestionUsuarios = () => {
    setMostrarGestionUsuarios(!mostrarGestionUsuarios);
  };

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('http://localhost:8000/usuarios', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await res.json();
      setUsuarios(data.usuarios);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
    }
  };

  useEffect(() => {
    if (mostrarGestionUsuarios) {
      fetchUsuarios();
    }
  }, [mostrarGestionUsuarios]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMensaje('');
  
    try {
      const url = usuarioEditando
        ? `http://localhost:8000/usuarios/${usuarioEditando.id}`
        : 'http://localhost:8000/register';
  
      const method = usuarioEditando ? 'PUT' : 'POST';
  
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email, password, rol })
      });
  
      if (!res.ok) {
        throw new Error("Error al registrar/actualizar usuario");
      }
  
      setMensaje(usuarioEditando ? "Usuario actualizado exitosamente" : "Usuario registrado exitosamente");
      setEmail('');
      setPassword('');
      setRol('tecnico');
      setUsuarioEditando(null);
      fetchUsuarios();
    } catch (err) {
      setMensaje(err.message);
    }
  };
  

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
  
    try {
      const res = await fetch(`http://localhost:8000/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (!res.ok) {
        throw new Error("Error al eliminar usuario");
      }
  
      fetchUsuarios(); // Volver a cargar la lista actualizada
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleEdit = (usuario) => {
    setUsuarioEditando(usuario);
    setEmail(usuario.email);
    setRol(usuario.rol);
  };

  
  return (
    <div>
      <h2>Panel de Administración</h2>
      <p>Bienvenido administrador. Aquí puedes gestionar usuarios, ver reportes, etc.</p>

      <button onClick={handleGestionUsuarios}>
        {mostrarGestionUsuarios ? "Ocultar Gestión de Usuarios" : "Gestionar Usuarios"}
      </button>

      {mostrarGestionUsuarios && (
        <div className="gestion-usuarios">
          <h3>Registrar Nuevo Usuario</h3>
          <form onSubmit={handleRegister}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            /><br />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            /><br />

            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="tecnico">Técnico</option>
              <option value="administrador">Administrador</option>
            </select><br />

            <button type="submit">Registrar Usuario</button>
          </form>

          {mensaje && <p>{mensaje}</p>}

          <h3>Usuarios Registrados</h3>
          <input
            type="text"
            placeholder="Buscar usuario por email..."
            onChange={(e) => setFiltro(e.target.value)}
            value={filtro}
          />

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
            {usuarios
              .filter(usuario => usuario.email.toLowerCase().includes(filtro.toLowerCase()))
              .map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.id}</td>
                  <td>{usuario.email}</td>
                  <td>{usuario.rol}</td>
                  <td>
                    <button onClick={() => handleEdit(usuario)} style={{ backgroundColor: 'orange', color: 'white', marginRight: '10px' }}>Editar</button>
                    <button onClick={() => handleDelete(usuario.id)} style={{ backgroundColor: 'red', color: 'white' }}>Eliminar</button>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DashboardAdmin;

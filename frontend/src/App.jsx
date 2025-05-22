import { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import DashboardAdmin from './DashboardAdmin';
import DashboardTecnico from './DashboardTecnico';

function App() {
  const [razonSocial, setRazonSocial] = useState('');
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);

      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserEmail(payload.sub);
      setUserRole(payload.rol);
    }
  }, []);

  const buscarCliente = async () => {
    try {
      const res = await fetch(`http://localhost:8000/buscar/?razon_social=${encodeURIComponent(razonSocial)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error("No se encontró el cliente.");
      const data = await res.json();
      setClientes(data.clientes || []);
      setError(null);
    } catch (err) {
      setClientes([]);
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={(payload) => {
      setIsAuthenticated(true);
      setUserEmail(payload.sub);
      setUserRole(payload.rol);
    }} />;
  }

  return (
    <div className="container">
      <div className="top-bar" >
        <span className="user-greeting">Hola, {userEmail.split('@')[0]}</span>
        <button className="logout-button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

      {userRole === '3' && <DashboardAdmin />}
      {userRole === '1' && <DashboardTecnico />}

      <h1>Buscar Cliente</h1>
      <div className="search-bar">
        <input
          type="text"
          value={razonSocial}
          onChange={(e) => setRazonSocial(e.target.value)}
          placeholder="Introduce la razón social"
        />
        <button onClick={buscarCliente}>Buscar</button>
      </div>

      {clientes.length > 0 ? (
        <div className="results">
          <h3>Resultados encontrados:</h3>
          <ul>
            {clientes.map((cliente, index) => (
              <li key={index} className="result-item">
                <p><strong>Razón Social:</strong> {cliente.razon_social}</p>
                <p><strong>Dirección:</strong> {cliente.direccion}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        razonSocial && <p className="no-results"></p>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default App;

import { useState } from 'react';
import './App.css';

function App() {
  const [razonSocial, setRazonSocial] = useState('');
  const [clientes, setClientes] = useState([]);  // Ahora es un array de clientes
  const [error, setError] = useState(null);

  const buscarCliente = async () => {
    try {
      const res = await fetch(`http://localhost:8000/buscar/?razon_social=${encodeURIComponent(razonSocial)}`);
      if (!res.ok) throw new Error("No se encontró el cliente.");
      const data = await res.json();
      setClientes(data.clientes || []);  // Guardar la lista de clientes
      setError(null);
    } catch (err) {
      setClientes([]);  // Limpiar los resultados
      setError(err.message);
    }
  };

  return (
    <div className="container">
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

      {/* Mostrar resultados */}
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
        razonSocial && <p className="no-results">No se encontraron clientes.</p>
      )}

      {/* Mensaje de error */}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default App;
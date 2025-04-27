import { useState } from "react";

function DashboardTecnico() {
  const [mostrarBuscarClientes, setMostrarBuscarClientes] = useState(false);
  const [razonSocial, setRazonSocial] = useState('');
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState(null);

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

  return (
    <div>
      <h2>Panel de Técnico</h2>
      <p>Bienvenido técnico. Aquí puedes buscar clientes y registrar trabajos.</p>

      <button onClick={() => setMostrarBuscarClientes(!mostrarBuscarClientes)}>
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
    </div>
  );
}

export default DashboardTecnico;

  
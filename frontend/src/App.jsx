import { useState, useEffect } from "react";
import Login from "./Login";
import Registro from "./Registro";
import DashboardAdmin from "./DashboardAdmin";
import DashboardTecnico from "./DashboardTecnico";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setIsAuthenticated(true);
        setUserEmail(payload.sub);
        setUserRole(payload.rol);
      } catch {
        localStorage.removeItem("token");
      }
    }
  }, []);

  const handleLogin = (payload) => {
    setIsAuthenticated(true);
    setUserEmail(payload.sub);
    setUserRole(payload.rol);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUserEmail("");
    setUserRole("");
  };

  if (!isAuthenticated) {
    return mostrarRegistro ? (
      <Registro onRegistroExitoso={() => setMostrarRegistro(false)} />
    ) : (
      <Login onLogin={handleLogin} onMostrarRegistro={() => setMostrarRegistro(true)} />
    );
  }

  return (
    <div className="App">
      <div className="top-bar">
        <span>Hola, {userEmail.split("@")[0]}</span>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>

      {userRole === "3" ? <DashboardAdmin /> : <DashboardTecnico />}
    </div>
  );
}

export default App;

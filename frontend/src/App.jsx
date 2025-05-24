import { useState, useEffect } from "react";
import "./App.css";
import Login from "./Login";
import Registro from "./Registro";
import Recuperar from "./Recuperar";
import DashboardAdmin from "./DashboardAdmin";
import DashboardTecnico from "./DashboardTecnico";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);

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
    if (mostrarRecuperar) {
      return <Recuperar onVolverLogin={() => setMostrarRecuperar(false)} />;
    }

    if (mostrarRegistro) {
      return (
        <Registro
          onRegistroExitoso={() => setMostrarRegistro(false)}
          onVolverLogin={() => setMostrarRegistro(false)}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onMostrarRegistro={() => setMostrarRegistro(true)}
        onMostrarRecuperar={() => setMostrarRecuperar(true)}
      />
    );
  }

  return (
    <div className="container">
      <div className="top-bar">
        <span className="user-greeting">Hola, {userEmail.split('@')[0]}</span>
        <button className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
      </div>

      {userRole === "3" ? <DashboardAdmin /> : <DashboardTecnico />}
    </div>
  );
}

export default App;

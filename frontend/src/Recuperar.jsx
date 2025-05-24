import { useState, useEffect } from "react";
import "./Login.css";

function Recuperar({ onVolverLogin }) {
  const [paso, setPaso] = useState(0);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [minLongitud, setMinLongitud] = useState(false);
  const [tieneNumero, setTieneNumero] = useState(false);
  const [tieneEspecial, setTieneEspecial] = useState(false);

  useEffect(() => {
    setMinLongitud(nuevaPassword.length >= 12);
    setTieneNumero(/\d/.test(nuevaPassword));
    setTieneEspecial(/[!@#$%^&*(),.?":{}|<>]/.test(nuevaPassword));
  }, [nuevaPassword]);

  const validarPassword = () =>
    minLongitud && tieneNumero && tieneEspecial;

  const enviarCodigo = async (e) => {
    e.preventDefault();
    setMensaje(""); setError("");

    try {
      const res = await fetch("http://localhost:8000/recuperar/inicio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error enviando código");
      }

      setMensaje("Código enviado. Revisa tu correo.");
      setPaso(1);
    } catch (err) {
      setError(err.message);
    }
  };

  const verificarYActualizar = async (e) => {
    e.preventDefault();
    setMensaje(""); setError("");

    if (!validarPassword()) {
      setError("La contraseña no cumple con los requisitos.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/recuperar/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          codigo,
          nueva_password: nuevaPassword
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error actualizando contraseña");
      }

      setMensaje("¡Contraseña actualizada!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Recuperar contraseña</h2>

      {paso === 0 && (
        <form className="login-form" onSubmit={enviarCodigo}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Enviar código</button>
        </form>
      )}

      {paso === 1 && (
        <form className="login-form" onSubmit={verificarYActualizar}>
          <input
            type="text"
            placeholder="Código recibido"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            required
          />

          <div className="password-checklist">
            <p style={{ color: minLongitud ? "green" : "red" }}>
              {minLongitud ? "✔" : "✖"} Al menos 12 caracteres
            </p>
            <p style={{ color: tieneNumero ? "green" : "red" }}>
              {tieneNumero ? "✔" : "✖"} Contiene un número
            </p>
            <p style={{ color: tieneEspecial ? "green" : "red" }}>
              {tieneEspecial ? "✔" : "✖"} Contiene un carácter especial
            </p>
          </div>

          <button type="submit">Actualizar contraseña</button>
        </form>
      )}

      {mensaje && <p className="success-message">{mensaje}</p>}
      {error && <p className="error-message">{error}</p>}

      <button onClick={onVolverLogin}>Volver al inicio de sesión</button>
    </div>
  );
}

export default Recuperar;

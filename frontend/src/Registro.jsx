import { useState, useEffect } from "react";
import "./Login.css";

function Registro({ onRegistroExitoso, onVolverLogin }) {
  const [paso, setPaso] = useState(0);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorConfirm, setErrorConfirm] = useState("");
  
  const [minLongitud, setMinLongitud] = useState(false);
  const [tieneNumero, setTieneNumero] = useState(false);
  const [tieneEspecial, setTieneEspecial] = useState(false);

  const [qrBase64, setQrBase64] = useState("");

  useEffect(() => {
    setMinLongitud(password.length >= 12);
    setTieneNumero(/\d/.test(password));
    setTieneEspecial(/[!@#$%^&*(),.?":{}|<>]/.test(password));
  }, [password]);

  const validarPassword = () => minLongitud && tieneNumero && tieneEspecial;

  const enviarCodigo = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const res = await fetch("http://localhost:8000/registro/inicio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al iniciar registro");
      }

      setMensaje("Código enviado al correo. Revisa tu bandeja de entrada.");
      setPaso(1);
    } catch (err) {
      setMensaje(err.message);
    }
  };

  const verificarYRegistrar = async (e) => {
    e.preventDefault();
    setMensaje("");
    setErrorPassword("");
    setErrorConfirm("");
    setQrBase64("");
  
    if (password !== confirmPassword) {
      setErrorConfirm("Las contraseñas no coinciden");
      return;
    }
  
    if (!validarPassword()) {
      setErrorPassword("La contraseña no cumple con los requisitos.");
      return;
    }
  
    try {
      const res = await fetch("http://localhost:8000/registro/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, codigo }),
      });
  
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al registrar");
      }
  
      const data = await res.json();
      setMensaje(data.mensaje);
      setQrBase64(data.qr_base64); // Guardar QR base64 para mostrar
    } catch (err) {
      setMensaje(err.message);
    }
  };
  

  return (
    <div className="login-container">
      {paso === 0 ? (
        <>
          <h2>Registro - Paso 1</h2>
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
        </>
      ) : (
        <>
          <h2>Registro - Paso 2</h2>
          <form className="login-form" onSubmit={verificarYRegistrar}>
            <input
              type="text"
              placeholder="Código de verificación"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {errorPassword && <p className="error-message">{errorPassword}</p>}

            <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                />
            {errorConfirm && <p className="error-message">{errorConfirm}</p>}

            <div className="password-checklist">
              <p style={{ color: minLongitud ? "green" : "red" }}>
                {minLongitud ? "✔" : "✖"} Al menos 12 caracteres
              </p>
              <p style={{ color: tieneNumero ? "green" : "red" }}>
                {tieneNumero ? "✔" : "✖"} Al menos un número
              </p>
              <p style={{ color: tieneEspecial ? "green" : "red" }}>
                {tieneEspecial ? "✔" : "✖"} Al menos un carácter especial
              </p>
            </div>

            <button type="submit">Finalizar registro</button>
          </form>
        </>
      )}
      <button onClick={onVolverLogin}>
            Volver al inicio de sesión
          </button>
      {mensaje && <p className="error-message">{mensaje}</p>}

      {qrBase64 && (
        <div className="qr-container">
            <p>Escaneá este código con Google Authenticator:</p>
            <img src={`data:image/png;base64,${qrBase64}`} alt="Código QR" />
            <p>Luego usá el código generado para iniciar sesión.</p>
        </div>
      )} 

    </div>
  );
}

export default Registro;

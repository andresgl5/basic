import { useState } from "react";

function Login({ onLogin, onMostrarRegistro }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [codigo2FA, setCodigo2FA] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, codigo_2fa: codigo2FA}),
      });

      if (!res.ok) throw new Error("Credenciales incorrectas");
      const data = await res.json();

      localStorage.setItem("token", data.access_token);
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      onLogin(payload);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar sesión</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input
          type="text"
          placeholder="Código 2FA"
          value={codigo2FA}
          onChange={(e) => setCodigo2FA(e.target.value)}
          required
        />
        <button type="submit">Entrar</button>
        {error && <p className="error-message">{error}</p>}
      </form>
      <button onClick={onMostrarRegistro} className="register-button">
        ¿No tienes cuenta? Registrarse
      </button>
    </div>
  );
}


export default Login;

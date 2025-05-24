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



  

  
  return (
    <div>
      <h2>Panel de Administración</h2>
      <p>Bienvenido administrador. Aquí puedes gestionar usuarios, ver reportes, etc.</p>

      
    </div>
  );
}

export default DashboardAdmin;

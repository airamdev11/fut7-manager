// src/components/LoginForm.jsx
import React, { useState } from "react";
import { auth } from "../lib/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/Dashboard"; // Redirección tras login
    } catch (err) {
        if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
            setError("Correo o contraseña incorrectos.");
          } else {
            setError("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
          }
          
          // Auto-cierre del modal después de 3 segundos
          setTimeout(() => setError(null), 2500);
                  
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Iniciar sesión</h1>
      <label htmlFor="email">Correo:</label>
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label htmlFor="password">Contraseña:</label>
      <input
        type="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit">Entrar</button>

        {error && (
        <div 
            style={{
            position: "fixed",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fff",
            border: "1px solid #ccc",
            padding: "1rem 2rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            zIndex: 1000
        }}>
            <p style={{ color: "red" }}>{error}</p>
            <button onClick={() => setError(null)}>Cerrar</button>
        </div>
        )}
    </form>
  );
};

export default LoginForm;
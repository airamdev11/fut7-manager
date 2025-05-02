import React from "react";
import { auth } from "../lib/firebaseConfig";
import { signOut } from "firebase/auth";

const LogoutButton = () => {
    const handleLogout = async () => {
      try {
        await signOut(auth);
        window.location.href = "/Login";
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    };
  
    return <button onClick={handleLogout}>Cerrar sesión</button>;
  };
  
  export default LogoutButton;

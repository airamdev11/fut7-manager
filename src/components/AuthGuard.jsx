import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebaseConfig";

const AuthGuard = ({ children }) => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "/Login";
      } else {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (checking) return <p>Verificando sesión...</p>;

  return <>{children}</>;
};

export default AuthGuard;

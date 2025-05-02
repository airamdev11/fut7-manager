import React, { useState,useEffect } from "react";
import { db } from "../lib/firebaseConfig";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp
} from "firebase/firestore";

const JornadaForm = ({ torneoSlug }) => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [numeroJornada, setNumeroJornada] = useState(null);

  useEffect(() => {
    const calcularNumero = async () => {
      try {
        const torneoQuery = query(collection(db, "torneos"), where("slug", "==", torneoSlug));
        const torneoSnapshot = await getDocs(torneoQuery);
        if (torneoSnapshot.empty) return;
  
        const torneoId = torneoSnapshot.docs[0].id;
  
        const jornadasRef = collection(db, "torneos", torneoId, "jornadas");
        const existentes = await getDocs(jornadasRef);
        setNumeroJornada(existentes.size + 1);
      } catch (err) {
        console.error("Error al calcular número de jornada:", err.message);
      }
    };
  
    calcularNumero();
  }, [torneoSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Buscar el torneo por slug
      const torneoQuery = query(collection(db, "torneos"), where("slug", "==", torneoSlug));
      const torneoSnapshot = await getDocs(torneoQuery);
      if (torneoSnapshot.empty) throw new Error("Torneo no encontrado");

      const torneoId = torneoSnapshot.docs[0].id;

      // Obtener cantidad de jornadas actuales
      const jornadasRef = collection(db, "torneos", torneoId, "jornadas");
      const existentes = await getDocs(jornadasRef);
      const nuevoNumero = existentes.size + 1;

      // Guardar jornada
      await addDoc(jornadasRef, {
        numero: nuevoNumero,
        fecha_inicio: Timestamp.fromDate(new Date(`${fechaInicio}T12:00:00`)),
        fecha_fin: Timestamp.fromDate(new Date(`${fechaFin}T12:00:00`)),
        slug: `jornada-${nuevoNumero}`,
        creado: Timestamp.now(),
      });

      window.location.href = `/torneos/${torneoSlug}/jornadas`;
    } catch (err) {
      console.error("Error al guardar jornada:", err.message);
    }
  };

  return (
    <div>
      {numeroJornada && (
        <h3 style={{ marginBottom: "1rem" }}>Creando Jornada {numeroJornada}</h3>
      )}
  
      <form onSubmit={handleSubmit}>
        <label>Fecha de inicio:</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          required
        />
  
        <label>Fecha de fin:</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          required
        />
  
        <button type="submit">Guardar jornada</button>
      </form>
    </div>
  );
  
};

export default JornadaForm;

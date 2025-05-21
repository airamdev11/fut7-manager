import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "firebase/firestore";
import { db } from "../lib/firebaseConfig";
import { Timestamp } from "firebase/firestore"; 

const PartidoManualForm = ({ torneoSlug, jornadaSlug }) => {
  const [equipos, setEquipos] = useState([]);
  const [equipoA, setEquipoA] = useState("");
  const [equipoB, setEquipoB] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [cancha, setCancha] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarEquipos = async () => {
      const torneoSnap = await getDocs(query(collection(db, "torneos"), where("slug", "==", torneoSlug)));
      if (torneoSnap.empty) return;
      const torneoId = torneoSnap.docs[0].id;

      const equiposSnap = await getDocs(collection(db, "torneos", torneoId, "equipos"));
      const lista = equiposSnap.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));
      setEquipos(lista);
    };

    cargarEquipos();
  }, [torneoSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (equipoA === equipoB) {
      setError("Los equipos no pueden ser iguales.");
      return;
    }

    try {
      const torneoSnap = await getDocs(query(collection(db, "torneos"), where("slug", "==", torneoSlug)));
      const torneoId = torneoSnap.docs[0].id;

      const jornadaSnap = await getDocs(query(collection(db, "torneos", torneoId, "jornadas"), where("slug", "==", jornadaSlug)));
      const jornadaId = jornadaSnap.docs[0].id;

      // Validar que no exista ya el enfrentamiento en el torneo
      const jornadasSnap = await getDocs(collection(db, "torneos", torneoId, "jornadas"));
      const claveActual = [equipoA, equipoB].sort().join("-");
      let repetido = false;

      for (const jornada of jornadasSnap.docs) {
        const partidosSnap = await getDocs(collection(db, "torneos", torneoId, "jornadas", jornada.id, "partidos"));
        for (const partido of partidosSnap.docs) {
          const data = partido.data();
          const clave = [data.equipo_uno_id, data.equipo_dos_id].sort().join("-");
          if (clave === claveActual) {
            repetido = true;
            break;
          }
        }
        if (repetido) break;
      }

      if (repetido) {
        setError("Estos equipos ya se han enfrentado.");
        return;
      }

      const nombreA = equipos.find(e => e.id === equipoA)?.nombre || "Equipo A";
      const nombreB = equipos.find(e => e.id === equipoB)?.nombre || "Equipo B";

      await addDoc(collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos"), {
        equipo_uno_id: equipoA,
        equipo_dos_id: equipoB,
        equipo_uno_nombre: nombreA,
        equipo_dos_nombre: nombreB,
        goles_equipo_uno: null,
        goles_equipo_dos: null,
        fecha: fecha ? Timestamp.fromDate(new Date(`${fecha}T12:00:00`)) : null,
        hora: hora || null,
        cancha: cancha || "",
      });

      window.location.href = `/torneos/${torneoSlug}/jornadas/${jornadaSlug}`;
    } catch (err) {
      console.error("Error al guardar partido:", err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Equipo A:</label>
      <select value={equipoA} onChange={(e) => setEquipoA(e.target.value)} required>
        <option value="">Seleccionar equipo</option>
        {equipos.map(eq => (
          <option key={eq.id} value={eq.id}>{eq.nombre}</option>
        ))}
      </select>

      <label>Equipo B:</label>
      <select value={equipoB} onChange={(e) => setEquipoB(e.target.value)} required>
        <option value="">Seleccionar equipo</option>
        {equipos.map(eq => (
          <option key={eq.id} value={eq.id}>{eq.nombre}</option>
        ))}
      </select>

      <label>Fecha:</label>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

      <label>Hora:</label>
      <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />

      <label>Cancha:</label>
      <input type="text" value={cancha} onChange={(e) => setCancha(e.target.value)} />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button type="submit">Agregar partido</button>
    </form>
  );
};

export default PartidoManualForm;

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebaseConfig";

const JornadaForm = ({ torneoSlug }) => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [numero, setNumero] = useState(1);

  useEffect(() => {
    const calcularNumeroJornada = async () => {
      const torneoSnap = await getDocs(query(collection(db, "torneos"), where("slug", "==", torneoSlug)));
      if (torneoSnap.empty) return;
      const torneoId = torneoSnap.docs[0].id;

      const jornadasSnap = await getDocs(collection(db, "torneos", torneoId, "jornadas"));
      setNumero(jornadasSnap.size + 1);
    };

    calcularNumeroJornada();
  }, [torneoSlug]);

  const generarClave = (id1, id2) => {
    return [id1, id2].sort().join("-");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Obtener torneo
      const torneoSnap = await getDocs(query(collection(db, "torneos"), where("slug", "==", torneoSlug)));
      if (torneoSnap.empty) throw new Error("Torneo no encontrado");
      const torneoId = torneoSnap.docs[0].id;

      // Crear jornada
      const jornadaRef = await addDoc(collection(db, "torneos", torneoId, "jornadas"), {
        numero,
        slug: `jornada-${numero}`,
        fecha_inicio: Timestamp.fromDate(new Date(`${fechaInicio}T12:00:00`)),
        fecha_fin: Timestamp.fromDate(new Date(`${fechaFin}T12:00:00`)),
        creado: Timestamp.now(),
      });

      const jornadaId = jornadaRef.id;

      // Obtener equipos del torneo
      const equiposSnap = await getDocs(collection(db, "torneos", torneoId, "equipos"));
      const equipos = equiposSnap.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));

      // Obtener partidos ya jugados
      const jornadasSnap = await getDocs(collection(db, "torneos", torneoId, "jornadas"));
      const partidosJugados = new Set();

      for (const jornada of jornadasSnap.docs) {
        const partidosSnap = await getDocs(collection(db, "torneos", torneoId, "jornadas", jornada.id, "partidos"));
        for (const partido of partidosSnap.docs) {
          const data = partido.data();
          const clave = generarClave(data.equipo_uno_id, data.equipo_dos_id);
          partidosJugados.add(clave);
        }
      }

      // Generar combinaciones posibles
      const combinaciones = [];
      for (let i = 0; i < equipos.length; i++) {
        for (let j = i + 1; j < equipos.length; j++) {
          const clave = generarClave(equipos[i].id, equipos[j].id);
          if (!partidosJugados.has(clave)) {
            combinaciones.push({
              equipoA: equipos[i],
              equipoB: equipos[j],
              clave,
            });
          }
        }
      }

      // Evitar usar equipos duplicados en una misma jornada
      const usados = new Set();
      const partidosFinales = [];

      for (const comb of combinaciones) {
        if (!usados.has(comb.equipoA.id) && !usados.has(comb.equipoB.id)) {
          partidosFinales.push(comb);
          usados.add(comb.equipoA.id);
          usados.add(comb.equipoB.id);
        }
      }

      // Guardar partidos en la jornada
      for (const p of partidosFinales) {
        await addDoc(collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos"), {
          equipo_uno_id: p.equipoA.id,
          equipo_dos_id: p.equipoB.id,
          equipo_uno_nombre: p.equipoA.nombre,
          equipo_dos_nombre: p.equipoB.nombre,
          goles_equipo_uno: null,
          goles_equipo_dos: null,
          fecha: null,
          hora: null,
          cancha: "",
        });
      }

      window.location.href = `/torneos/${torneoSlug}/jornadas`;
    } catch (err) {
      console.error("Error al guardar jornada:", err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p>Jornada número: <strong>{numero}</strong></p>

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

      <button type="submit">Guardar jornada y generar partidos</button>
    </form>
  );
};

export default JornadaForm;

import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc
} from "firebase/firestore";
import { db } from "../lib/firebaseConfig";

const TablaGoleadores = ({ torneoSlug }) => {
  const [tabla, setTabla] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarGoleadores = async () => {
      try {
        const torneoSnap = await getDocs(query(collection(db, "torneos"), where("slug", "==", torneoSlug)));
        if (torneoSnap.empty) return;
        const torneoId = torneoSnap.docs[0].id;

        // Obtener todos los equipos del torneo
        const equiposSnap = await getDocs(collection(db, "torneos", torneoId, "equipos"));
        const equipos = equiposSnap.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));

        const goleadores = {};

        // Por cada equipo
        for (const equipo of equipos) {
          // Obtener jugadores
          const jugadoresSnap = await getDocs(collection(db, "torneos", torneoId, "equipos", equipo.id, "jugadores"));
          const jugadores = jugadoresSnap.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));

          // Obtener jornadas
          const jornadasSnap = await getDocs(collection(db, "torneos", torneoId, "jornadas"));
          const jornadas = jornadasSnap.docs.map(j => ({ id: j.id }));

          // Para cada jornada
          for (const jornada of jornadas) {
            // Obtener partidos
            const partidosSnap = await getDocs(collection(db, "torneos", torneoId, "jornadas", jornada.id, "partidos"));
            const partidos = partidosSnap.docs.map(p => ({ id: p.id }));

            // Para cada partido
            for (const partido of partidos) {
              // Obtener eventos
              const eventosSnap = await getDocs(collection(db, "torneos", torneoId, "jornadas", jornada.id, "partidos", partido.id, "eventos"));
              for (const ev of eventosSnap.docs) {
                const evento = ev.data();
                if (evento.tipo === "gol") {
                  const jugadorId = evento.jugador_id;
                  const jugador = jugadores.find(j => j.id === jugadorId);
                  if (jugador) {
                    const clave = `${jugador.id}-${equipo.id}`;
                    if (!goleadores[clave]) {
                      goleadores[clave] = {
                        nombre: jugador.nombre,
                        equipo: equipo.nombre,
                        goles: 0
                      };
                    }
                    goleadores[clave].goles += 1;
                  }
                }
              }
            }
          }
        }

        // Convertir a array y ordenar
        const lista = Object.values(goleadores).sort((a, b) => b.goles - a.goles);
        setTabla(lista);
      } catch (err) {
        console.error("Error al cargar goleadores:", err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarGoleadores();
  }, [torneoSlug]);

  if (loading) return <p>Cargando goleadores...</p>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "center" }}>#</th>
          <th style={{ textAlign: "left" }}>Jugador</th>
          <th style={{ textAlign: "left" }}>Equipo</th>
          <th style={{ textAlign: "center" }}>Goles</th>
        </tr>
      </thead>
      <tbody>
        {tabla.map((j, i) => (
          <tr key={i}>
            <td style={{ textAlign: "center" }}>{i + 1}</td>
            <td>{j.nombre}</td>
            <td>{j.equipo}</td>
            <td style={{ textAlign: "center" }}>{j.goles}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TablaGoleadores;

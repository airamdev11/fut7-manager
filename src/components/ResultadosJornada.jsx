import React, { useEffect, useState } from "react";
import { db } from "../lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

const ResultadosJornada = ({ torneoSlug, jornadaSlug }) => {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPartidos = async () => {
      try {
        const torneoSnap = await getDocs(
          query(collection(db, "torneos"), where("slug", "==", torneoSlug))
        );
        if (torneoSnap.empty) return;
        const torneoId = torneoSnap.docs[0].id;

        const jornadaSnap = await getDocs(
          query(collection(db, "torneos", torneoId, "jornadas"), where("slug", "==", jornadaSlug))
        );
        if (jornadaSnap.empty) return;
        const jornadaId = jornadaSnap.docs[0].id;

        const partidosRef = collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos");
        const partidosSnap = await getDocs(partidosRef);

        const lista = partidosSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            equipo1: data.equipo_uno_nombre,
            equipo2: data.equipo_dos_nombre,
            goles1: data.goles_equipo_uno,
            goles2: data.goles_equipo_dos,
            tieneResultado:
              typeof data.goles_equipo_uno === "number" &&
              typeof data.goles_equipo_dos === "number",
          };
        });

        setPartidos(lista);
      } catch (err) {
        console.error("Error al cargar resultados:", err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarPartidos();
  }, [torneoSlug, jornadaSlug]);

  if (loading) return <p>Cargando resultados...</p>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
      <thead>
        <tr>
          <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem", textAlign: "left" }}>Partido</th>
          <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem", textAlign: "left" }}>Resultado</th>
        </tr>
      </thead>
      <tbody>
        {partidos.map((p) => (
          <tr key={p.id}>
            <td style={{ padding: "0.5rem" }}>
              {p.equipo1} vs {p.equipo2}
            </td>
            <td style={{ padding: "0.5rem" }}>
              {p.tieneResultado ? `${p.goles1} - ${p.goles2}` : <span style={{ color: "gray" }}>PENDIENTE</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ResultadosJornada;

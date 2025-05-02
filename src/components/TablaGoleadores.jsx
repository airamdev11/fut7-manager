import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy
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

        const goleadoresSnap = await getDocs(
          query(collection(db, "torneos", torneoId, "goleadores"), orderBy("goles", "desc"))
        );

        const lista = goleadoresSnap.docs.map(doc => doc.data());
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
            <td>{j.equipo_nombre}</td>
            <td style={{ textAlign: "center" }}>{j.goles}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TablaGoleadores;

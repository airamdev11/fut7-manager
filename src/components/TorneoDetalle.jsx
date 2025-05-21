import React, { useEffect, useState } from "react";
import { db } from "../lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

const TorneoDetalle = ({ torneoId }) => {
  const [torneo, setTorneo] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTorneo = async () => {
      try {
        const q = query(collection(db, "torneos"), where("slug", "==", torneoId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const torneoData = { id: docSnap.id, ...docSnap.data() };
          setTorneo(torneoData);

          // Leer equipos desde la subcolección del torneo
          const equiposRef = collection(db, "torneos", torneoData.id, "equipos");
          const equiposSnapshot = await getDocs(equiposRef);
          const lista = equiposSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setEquipos(lista);
        } else {
          setTorneo(null);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error al obtener torneo o equipos:", err);
        setLoading(false);
      }
    };

    fetchTorneo();
  }, [torneoId]);

  if (loading) return <p>Cargando torneo...</p>;
  if (!torneo) return <p>Torneo no encontrado.</p>;

  return (
    <div>
      <h2>{torneo.nombre}</h2>
      <p>Inicio: {torneo.fecha_inicio.toDate().toLocaleDateString("es-MX")}</p>
      <p>Fin: {torneo.fecha_fin.toDate().toLocaleDateString("es-MX")}</p>
      <p>Estado: {torneo.activo ? "Activo" : "Finalizado"}</p>

      <h3>Equipos participantes</h3>
      <p>Total de equipos inscritos: <strong>{equipos.length}</strong></p>


      <div style={{ marginTop: "1rem" }}>
        <a href={`/torneos/${torneo.slug}/jornadas`}>
          <button>Ver Jornadas</button>
        </a>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <a href={`/torneos/${torneo.slug}/tabla-posiciones`}>
          <button style={{ background: "#4caf50", color: "#fff", padding: "0.5rem 1rem", border: "none", cursor: "pointer" }}>
            Ver Tabla de Posiciones
          </button>
        </a>
      </div>


      <div style={{ marginTop: "1rem" }}>
        <a href={`/torneos/${torneo.slug}/goleadores`}>
          <button style={{ background: "#4caf50", color: "#fff", padding: "0.5rem 1rem", border: "none", cursor: "pointer" }}>
            Ver Tabla de Goleadores
          </button>
        </a>
      </div>




      <a href={`/torneos/${torneo.slug}/nuevo-equipo`}>
        <button>Agregar Equipo</button>
      </a>

      <h3>Equipos participantes</h3>
      {equipos.length === 0 ? (
        <p>No hay equipos registrados aún.</p>
      ) : (
        <ul>
          {equipos.map((eq) => (
            <li key={eq.id} style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
              <a href={`/torneos/${torneo.slug}/equipos/${eq.slug}`} style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>
                {eq.escudo_base64 && (
                  <img
                    src={eq.escudo_base64}
                    alt={`Escudo de ${eq.nombre}`}
                    style={{ width: "50px", height: "50px", marginRight: "1rem", borderRadius: "5px" }}
                  />
                )}
                <span>{eq.nombre}</span>
              </a>
            </li>
          ))}
        </ul>

      )}
    </div>
  );
};

export default TorneoDetalle;
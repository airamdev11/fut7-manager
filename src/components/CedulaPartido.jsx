import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../lib/firebaseConfig";

const CedulaPartido = ({ torneoSlug, jornadaSlug, partidoId }) => {
  const [jugadores1, setJugadores1] = useState([]);
  const [jugadores2, setJugadores2] = useState([]);
  const [goles, setGoles] = useState({});
  const [equipo1, setEquipo1] = useState("");
  const [equipo2, setEquipo2] = useState("");
  const [partidoData, setPartidoData] = useState(null);
  const [torneoId, setTorneoId] = useState("");
  const [jornadaId, setJornadaId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const torneoSnap = await getDocs(query(collection(db, "torneos"), where("slug", "==", torneoSlug)));
        const torneoId = torneoSnap.docs[0].id;
        setTorneoId(torneoId);

        const jornadaSnap = await getDocs(query(collection(db, "torneos", torneoId, "jornadas"), where("slug", "==", jornadaSlug)));
        const jornadaId = jornadaSnap.docs[0].id;
        setJornadaId(jornadaId);

        const partidoRef = doc(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId);
        const partidoSnap = await getDocs(query(collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos"), where("__name__", "==", partidoId)));
        const partidoData = partidoSnap.docs[0].data();
        setPartidoData(partidoData);

        setEquipo1(partidoData.equipo_uno_nombre);
        setEquipo2(partidoData.equipo_dos_nombre);

        const eq1Snap = await getDocs(collection(db, "torneos", torneoId, "equipos", partidoData.equipo_uno_id, "jugadores"));
        const eq2Snap = await getDocs(collection(db, "torneos", torneoId, "equipos", partidoData.equipo_dos_id, "jugadores"));

        setJugadores1(eq1Snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setJugadores2(eq2Snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const eventosSnap = await getDocs(
          collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId, "eventos")
        );

        const conteo = {};
        eventosSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.tipo === "gol") {
            conteo[data.jugador_id] = (conteo[data.jugador_id] || 0) + 1;
          }
        });

        setGoles(conteo);
      } catch (err) {
        console.error("Error al cargar datos:", err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [torneoSlug, jornadaSlug, partidoId]);

  const sumarGol = (jugadorId) => {
    setGoles(prev => ({
      ...prev,
      [jugadorId]: (prev[jugadorId] || 0) + 1,
    }));
  };

  const restarGol = (jugadorId) => {
    setGoles(prev => ({
      ...prev,
      [jugadorId]: Math.max((prev[jugadorId] || 0) - 1, 0),
    }));
  };

  const contarGolesEquipo = (lista) =>
    lista.reduce((acc, jugador) => acc + (goles[jugador.id] || 0), 0);

  const handleGuardar = async () => {
    const confirmado = window.confirm("¿Deseas guardar el resultado?");
    if (!confirmado) return;

    try {
      const golesEq1 = contarGolesEquipo(jugadores1);
      const golesEq2 = contarGolesEquipo(jugadores2);

      const eventosRef = collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId, "eventos");
      const eventosSnap = await getDocs(eventosRef);

      const eventosAnteriores = eventosSnap.docs.map(docu => ({ id: docu.id, ...docu.data() }));

      // Agrupar goles previos por jugador
      const golesPreviosPorJugador = {};
      eventosAnteriores.forEach(ev => {
        if (ev.tipo === "gol") {
          golesPreviosPorJugador[ev.jugador_id] = (golesPreviosPorJugador[ev.jugador_id] || 0) + 1;
        }
      });

      // Eliminar eventos previos
      for (const ev of eventosAnteriores) {
        await deleteDoc(doc(db, eventosRef.path, ev.id));
      }

      // Guardar nuevos eventos
      for (const [jugadorId, cantidad] of Object.entries(goles)) {
        const equipo = jugadores1.find(j => j.id === jugadorId) ? partidoData.equipo_uno_id : partidoData.equipo_dos_id;
        for (let i = 0; i < cantidad; i++) {
          await addDoc(eventosRef, {
            jugador_id: jugadorId,
            equipo_id: equipo,
            tipo: "gol",
          });
        }
      }

      // Actualizar resultado del partido
      const partidoRef = doc(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId);
      await updateDoc(partidoRef, {
        goles_equipo_uno: golesEq1,
        goles_equipo_dos: golesEq2,
      });

      // Actualizar tabla de goleadores
      const goleadoresRef = collection(db, "torneos", torneoId, "goleadores");
      for (const jugadorId of Object.keys({ ...goles, ...golesPreviosPorJugador })) {
        const cantidadNueva = goles[jugadorId] || 0;
        const cantidadAnterior = golesPreviosPorJugador[jugadorId] || 0;

        const jugador = [...jugadores1, ...jugadores2].find(j => j.id === jugadorId);
        const equipoId = jugadores1.find(j => j.id === jugadorId)
          ? partidoData.equipo_uno_id
          : partidoData.equipo_dos_id;
        const equipoNombre = jugadores1.find(j => j.id === jugadorId)
          ? partidoData.equipo_uno_nombre
          : partidoData.equipo_dos_nombre;

        const goleadorQuery = query(goleadoresRef, where("jugador_id", "==", jugadorId));
        const existingSnap = await getDocs(goleadorQuery);

        const diferencia = cantidadNueva - cantidadAnterior;

        if (!existingSnap.empty) {
          const ref = doc(db, goleadoresRef.path, existingSnap.docs[0].id);
          const totalAnterior = existingSnap.docs[0].data().goles;
          const totalNuevo = totalAnterior + diferencia;

          if (totalNuevo <= 0) {
            await deleteDoc(ref);
          } else {
            await updateDoc(ref, { goles: totalNuevo });
          }
        } else if (diferencia > 0) {
          await addDoc(goleadoresRef, {
            jugador_id: jugadorId,
            nombre: jugador?.nombre || "Desconocido",
            equipo_id: equipoId,
            equipo_nombre: equipoNombre,
            goles: diferencia,
          });
        }
      }

      window.location.href = `/torneos/${torneoSlug}/jornadas/${jornadaSlug}`;
    } catch (err) {
      console.error("Error al guardar resultado:", err.message);
    }
  };

  if (loading) return <p>Cargando cédula...</p>;

  return (
    <div>
      <h2>{equipo1} {contarGolesEquipo(jugadores1)} - {contarGolesEquipo(jugadores2)} {equipo2}</h2>

      <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
        <div style={{ flex: 1 }}>
          <h3>{equipo1}</h3>
          {jugadores1.map(j => (
            <div key={j.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span>{j.nombre}</span>
              <div>
                <button onClick={() => restarGol(j.id)}>-</button>
                <span style={{ margin: "0 0.5rem" }}>{goles[j.id] || 0}</span>
                <button onClick={() => sumarGol(j.id)}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <h3>{equipo2}</h3>
          {jugadores2.map(j => (
            <div key={j.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span>{j.nombre}</span>
              <div>
                <button onClick={() => restarGol(j.id)}>-</button>
                <span style={{ margin: "0 0.5rem" }}>{goles[j.id] || 0}</span>
                <button onClick={() => sumarGol(j.id)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleGuardar} style={{ marginTop: "2rem" }}>
        Guardar resultado
      </button>
    </div>
  );
};

export default CedulaPartido;

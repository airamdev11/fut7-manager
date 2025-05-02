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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Obtener torneo y jornada IDs
                const torneoSnap = await getDocs(query(collection(db, "torneos"), where("slug", "==", torneoSlug)));
                const torneoId = torneoSnap.docs[0].id;

                const jornadaSnap = await getDocs(query(collection(db, "torneos", torneoId, "jornadas"), where("slug", "==", jornadaSlug)));
                const jornadaId = jornadaSnap.docs[0].id;

                // Obtener datos del partido
                const partidoRef = doc(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId);
                const partidoSnap = await getDocs(query(collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos"), where("__name__", "==", partidoId)));
                const partidoData = partidoSnap.docs[0].data();

                setEquipo1(partidoData.equipo_uno_nombre);
                setEquipo2(partidoData.equipo_dos_nombre);

                // Cargar jugadores de ambos equipos
                const eq1Snap = await getDocs(collection(db, "torneos", torneoId, "equipos", partidoData.equipo_uno_id, "jugadores"));
                const eq2Snap = await getDocs(collection(db, "torneos", torneoId, "equipos", partidoData.equipo_dos_id, "jugadores"));

                setJugadores1(eq1Snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setJugadores2(eq2Snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Obtener eventos guardados y precargar estado
                const eventosSnap = await getDocs(
                    collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId, "eventos")
                );
                if (!eventosSnap.empty) {
                    const eventos = agruparGoles(eventosSnap.docs);
                    setGoles(eventos);
                }


            } catch (err) {
                console.error("Error al cargar datos:", err.message);
            } finally {
                setLoading(false);
            }
        };

        const agruparGoles = (docs) => {
            const conteo = {};
            docs.forEach(doc => {
                const data = doc.data();
                if (data.tipo === "gol") {
                    conteo[data.jugador_id] = (conteo[data.jugador_id] || 0) + 1;
                }
            });
            return conteo;
        };


        cargarDatos();
    }, [torneoSlug, jornadaSlug, partidoId]);

    const sumarGol = (jugadorId) => {
        setGoles((prev) => ({
            ...prev,
            [jugadorId]: (prev[jugadorId] || 0) + 1,
        }));
    };

    const restarGol = (jugadorId) => {
        setGoles((prev) => ({
            ...prev,
            [jugadorId]: (prev[jugadorId] || 0) - 1,
        }));
    };

    const contarGolesEquipo = (lista) =>
        lista.reduce((acc, jugador) => acc + (goles[jugador.id] || 0), 0);

    const handleGuardar = async () => {
        const confirmado = window.confirm("¿Deseas guardar el resultado?");
        if (!confirmado) return;

        try {
            const torneoSnap = await getDocs(query(collection(db, "torneos"), where("slug", "==", torneoSlug)));
            const torneoId = torneoSnap.docs[0].id;

            const jornadaSnap = await getDocs(query(collection(db, "torneos", torneoId, "jornadas"), where("slug", "==", jornadaSlug)));
            const jornadaId = jornadaSnap.docs[0].id;

            const partidoRef = doc(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId);
            const partidoSnap = await getDocs(query(collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos"), where("__name__", "==", partidoId)));
            const partidoData = partidoSnap.docs[0].data();

            const golesEq1 = contarGolesEquipo(jugadores1);
            const golesEq2 = contarGolesEquipo(jugadores2);

            // Borrar eventos existentes primero
            const eventosRef = collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId, "eventos");
            const eventosSnap = await getDocs(eventosRef);
            for (const docu of eventosSnap.docs) {
                await deleteDoc(doc(db, eventosRef.path, docu.id));
            }


            // Guardar eventos
            for (const [jugadorId, cantidad] of Object.entries(goles)) {
                const equipo = jugadores1.find(j => j.id === jugadorId) ? partidoData.equipo_uno_id : partidoData.equipo_dos_id;
                for (let i = 0; i < cantidad; i++) {
                    await addDoc(collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId, "eventos"), {
                        jugador_id: jugadorId,
                        equipo_id: equipo,
                        tipo: "gol",
                    });
                }
            }

            // Actualizar resultado en partido
            await updateDoc(partidoRef, {
                goles_equipo_uno: golesEq1,
                goles_equipo_dos: golesEq2,
            });

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
                    {jugadores1.map((j) => (
                        <div key={j.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                            <span>{j.nombre}</span>
                            <div>
                                <button onClick={() => restarGol(j.id)}>-</button>
                                <span style={{ marginLeft: "0.5rem", marginRight: "0.5rem" }}>{goles[j.id] || 0}</span>
                                <button onClick={() => sumarGol(j.id)}>+</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ flex: 1 }}>
                    <h3>{equipo2}</h3>
                    {jugadores2.map((j) => (
                        <div key={j.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                            <span>{j.nombre}</span>
                            <div>
                                <button onClick={() => sumarGol(j.id)}>+</button>
                                <span style={{ marginLeft: "0.5rem" }}>{goles[j.id] || 0}</span>
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

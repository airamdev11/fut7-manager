import React, { useEffect, useState } from "react";
import { db } from "../lib/firebaseConfig";
import {
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";

const JugadoresEquipo = ({ torneoSlug, equipoSlug }) => {
    const [jugadores, setJugadores] = useState([]);
    const [equipoNombre, setEquipoNombre] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarJugadores = async () => {
            try {
                // 1. Obtener el torneo por slug
                const torneoQuery = query(collection(db, "torneos"), where("slug", "==", torneoSlug));
                const torneoSnapshot = await getDocs(torneoQuery);
                if (torneoSnapshot.empty) throw new Error("Torneo no encontrado");

                const torneoId = torneoSnapshot.docs[0].id;

                // 2. Buscar el equipo dentro del torneo por su slug
                const equiposRef = collection(db, "torneos", torneoId, "equipos");
                const equipoQuery = query(equiposRef, where("slug", "==", equipoSlug));
                const equipoSnapshot = await getDocs(equipoQuery);
                if (equipoSnapshot.empty) throw new Error("Equipo no encontrado");

                const equipoDoc = equipoSnapshot.docs[0];
                const equipoId = equipoDoc.id;
                setEquipoNombre(equipoDoc.data().nombre);

                // 3. Obtener los jugadores desde la subcolección
                const jugadoresRef = collection(db, "torneos", torneoId, "equipos", equipoId, "jugadores");
                const jugadoresSnapshot = await getDocs(jugadoresRef);

                const lista = jugadoresSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setJugadores(lista);
            } catch (err) {
                console.error("Error cargando jugadores:", err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarJugadores();
    }, [torneoSlug, equipoSlug]);

    if (loading) return <p>Cargando jugadores...</p>;

    return (
        <div>
            <h2>Jugadores de {equipoNombre}</h2>

            <div style={{ marginBottom: "1rem" }}>
                <a href={`/torneos/${torneoSlug}/equipos/${equipoSlug}/nuevo-jugador`}>
                    <button>Agregar jugador</button>
                </a>
            </div>


            {jugadores.length === 0 ? (
                <p>No hay jugadores registrados aún.</p>
            ) : (
                <ul>
                    {jugadores.map((j) => (
                        <li key={j.id}>
                            {j.nombre} #{j.numero}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default JugadoresEquipo;

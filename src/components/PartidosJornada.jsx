import React, { useEffect, useState } from "react";
import { db } from "../lib/firebaseConfig";
import { deleteDoc, doc } from "firebase/firestore";


const handleEliminar = async (partidoId) => {
    const confirmado = window.confirm("¿Seguro que quieres eliminar este partido?");
    if (!confirmado) return;

    try {
        const torneoQuery = query(collection(db, "torneos"), where("slug", "==", torneoSlug));
        const torneoSnapshot = await getDocs(torneoQuery);
        const torneoId = torneoSnapshot.docs[0].id;

        const jornadaQuery = query(collection(db, "torneos", torneoId, "jornadas"), where("slug", "==", jornadaSlug));
        const jornadaSnapshot = await getDocs(jornadaQuery);
        const jornadaId = jornadaSnapshot.docs[0].id;

        const partidoRef = doc(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId);
        await deleteDoc(partidoRef);
        window.location.reload();
    } catch (err) {
        console.error("Error al eliminar partido:", err.message);
    }
};

import {
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";

const PartidosJornada = ({ torneoSlug, jornadaSlug }) => {
    const [partidos, setPartidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jornadaInfo, setJornadaInfo] = useState(null);

    const handleEliminar = async (partidoId) => {
        const confirmado = window.confirm("¿Seguro que quieres eliminar este partido?");
        if (!confirmado) return;

        try {
            const torneoQuery = query(collection(db, "torneos"), where("slug", "==", torneoSlug));
            const torneoSnapshot = await getDocs(torneoQuery);
            const torneoId = torneoSnapshot.docs[0].id;

            const jornadaQuery = query(collection(db, "torneos", torneoId, "jornadas"), where("slug", "==", jornadaSlug));
            const jornadaSnapshot = await getDocs(jornadaQuery);
            const jornadaId = jornadaSnapshot.docs[0].id;

            const partidoRef = doc(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId);
            await deleteDoc(partidoRef);
            window.location.reload();
        } catch (err) {
            console.error("Error al eliminar partido:", err.message);
        }
    };

    useEffect(() => {
        const cargarPartidos = async () => {
            try {
                // Obtener torneo por slug
                const torneoQuery = query(collection(db, "torneos"), where("slug", "==", torneoSlug));
                const torneoSnapshot = await getDocs(torneoQuery);
                if (torneoSnapshot.empty) throw new Error("Torneo no encontrado");
                const torneoId = torneoSnapshot.docs[0].id;

                // Obtener jornada por slug
                const jornadasRef = collection(db, "torneos", torneoId, "jornadas");
                const jornadaQuery = query(jornadasRef, where("slug", "==", jornadaSlug));
                const jornadaSnapshot = await getDocs(jornadaQuery);
                if (jornadaSnapshot.empty) throw new Error("Jornada no encontrada");

                const jornadaDoc = jornadaSnapshot.docs[0];
                const jornadaId = jornadaDoc.id;
                setJornadaInfo(jornadaDoc.data());

                // Obtener partidos
                const partidosRef = collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos");
                const partidosSnapshot = await getDocs(partidosRef);
                const lista = partidosSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setPartidos(lista);
            } catch (err) {
                console.error("Error al cargar partidos:", err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarPartidos();
    }, [torneoSlug, jornadaSlug]);

    if (loading) return <p>Cargando partidos...</p>;

    return (
        <div>
            <h2>{jornadaInfo ? `Jornada ${jornadaInfo.numero}` : "Jornada"}</h2>

            <div style={{ marginBottom: "1rem" }}>
                <a href={`/torneos/${torneoSlug}/jornadas/${jornadaSlug}/nuevo-partido`}>
                    <button>Agregar partido manualmente</button>
                </a>
            </div>





            <div style={{ marginBottom: "1rem" }}>
                <a href={`/torneos/${torneoSlug}/jornadas/${jornadaSlug}/resultados`}>
                    <button style={{ background: "#1976d2", color: "#fff", padding: "0.5rem 1rem", border: "none", cursor: "pointer" }}>
                        Ver Resultados de la Jornada
                    </button>
                </a>
            </div>



            {partidos.length === 0 ? (
                <p>No hay partidos registrados aún.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                    <thead>
                        <tr>
                            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.5rem" }}>Partido</th>
                            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.5rem" }}>Día</th>
                            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.5rem" }}>Cancha</th>
                            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.5rem" }}>Hora</th>
                            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.5rem" }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {partidos.map((p) => {
                            const fechaObj = p.fecha?.toDate ? p.fecha.toDate() : null;
                            const dia = fechaObj ? fechaObj.toLocaleDateString("es-MX", { day: "numeric", month: "long" }) : "No definido";
                            const hora = p.hora || "No definida";


                            return (
                                <tr key={p.id}>
                                    <td style={{ padding: "0.5rem" }}>{p.equipo_uno_nombre} vs {p.equipo_dos_nombre}</td>
                                    <td style={{ padding: "0.5rem" }}>{dia}</td>
                                    <td style={{ padding: "0.5rem" }}>{p.cancha}</td>
                                    <td style={{ padding: "0.5rem" }}>{hora}</td>
                                    <td style={{ padding: "0.5rem" }}>
                                        <a href={`/torneos/${torneoSlug}/jornadas/${jornadaSlug}/editar-partido/${p.id}`}>
                                            <button>Editar</button>
                                        </a>
                                        <button
                                            onClick={() => handleEliminar(p.id)}
                                            style={{ marginLeft: "0.5rem", background: "#f55", color: "#fff", border: "none", padding: "0.3rem 0.6rem", cursor: "pointer" }}
                                        >
                                            Eliminar
                                        </button>
                                        <a href={`/torneos/${torneoSlug}/jornadas/${jornadaSlug}/partidos/${p.id}/evento-partido`}>
                                            <button style={{ marginLeft: "0.5rem", background: "#4caf50", color: "#fff", border: "none", padding: "0.3rem 0.6rem", cursor: "pointer" }}>
                                                Resultado
                                            </button>
                                        </a>

                                    </td>

                                </tr>
                            );
                        })}
                    </tbody>
                </table>

            )}
        </div>
    );
};

export default PartidosJornada;

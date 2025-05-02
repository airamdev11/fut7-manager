import React, { useEffect, useState } from "react";
import { db } from "../lib/firebaseConfig";
import {
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";

const JornadasList = ({ torneoSlug }) => {
    const [jornadas, setJornadas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarJornadas = async () => {
            try {
                // Obtener el ID del torneo a partir del slug
                const torneoQuery = query(collection(db, "torneos"), where("slug", "==", torneoSlug));
                const torneoSnapshot = await getDocs(torneoQuery);
                if (torneoSnapshot.empty) throw new Error("Torneo no encontrado");

                const torneoId = torneoSnapshot.docs[0].id;

                // Obtener las jornadas del torneo
                const jornadasRef = collection(db, "torneos", torneoId, "jornadas");
                const jornadasSnapshot = await getDocs(jornadasRef);

                const lista = jornadasSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setJornadas(lista);
            } catch (err) {
                console.error("Error al cargar jornadas:", err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarJornadas();
    }, [torneoSlug]);

    if (loading) return <p>Cargando jornadas...</p>;

    return (
        <div>
            {jornadas.length === 0 ? (
                <p>No hay jornadas registradas aún.</p>
            ) : (
                <ul>
                    {jornadas.map((j) => (
                        <li key={j.id}>
                            <a href={`/torneos/${torneoSlug}/jornadas/${j.slug}`}>
                                Jornada {j.numero}: {new Date(j.fecha_inicio.seconds * 1000).toLocaleDateString("es-MX")}
                                —
                                {new Date(j.fecha_fin.seconds * 1000).toLocaleDateString("es-MX")}
                            </a>
                        </li>

                    ))}
                </ul>
            )}
        </div>
    );
};

export default JornadasList;

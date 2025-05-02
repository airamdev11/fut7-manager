import React, { useEffect, useState } from "react";
import { db } from "../lib/firebaseConfig";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc
} from "firebase/firestore";

const EditarPartidoForm = ({ torneoSlug, jornadaSlug, partidoId }) => {
    const [partido, setPartido] = useState(null);
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [cancha, setCancha] = useState("");
    const [equipo1, setEquipo1] = useState("");
    const [equipo2, setEquipo2] = useState("");

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const torneoQuery = query(collection(db, "torneos"), where("slug", "==", torneoSlug));
                const torneoSnap = await getDocs(torneoQuery);
                const torneoId = torneoSnap.docs[0].id;

                const jornadaQuery = query(
                    collection(db, "torneos", torneoId, "jornadas"),
                    where("slug", "==", jornadaSlug)
                );
                const jornadaSnap = await getDocs(jornadaQuery);
                const jornadaId = jornadaSnap.docs[0].id;

                const partidoRef = doc(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId);
                const partidoDoc = await getDoc(partidoRef);
                const data = partidoDoc.data();
                setPartido(data);
                setFecha(data.fecha);
                setHora(data.hora);
                setCancha(data.cancha);
                setEquipo1(data.equipo_uno_id);
                setEquipo2(data.equipo_dos_id);

                const equiposSnap = await getDocs(collection(db, "torneos", torneoId, "equipos"));
                const lista = equiposSnap.docs.map((doc) => ({
                    id: doc.id,
                    nombre: doc.data().nombre
                }));
                setEquipos(lista);
            } catch (err) {
                console.error("Error al cargar partido:", err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [torneoSlug, jornadaSlug, partidoId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (equipo1 === equipo2) {
            alert("Los equipos no pueden ser iguales.");
            return;
        }

        try {



            const torneoSnap = await getDocs(query(collection(db, "torneos"), where("slug", "==", torneoSlug)));
            const torneoId = torneoSnap.docs[0].id;

            const jornadaSnap = await getDocs(
                query(collection(db, "torneos", torneoId, "jornadas"), where("slug", "==", jornadaSlug))
            );
            const jornadaId = jornadaSnap.docs[0].id;

            const partidoRef = doc(db, "torneos", torneoId, "jornadas", jornadaId, "partidos", partidoId);

            await updateDoc(partidoRef, {
                fecha,
                hora,
                cancha,
                equipo_uno_id: equipo1,
                equipo_dos_id: equipo2,
                equipo_uno_nombre: equipos.find(eq => eq.id === equipo1)?.nombre || "",
                equipo_dos_nombre: equipos.find(eq => eq.id === equipo2)?.nombre || "",
            });

            window.location.href = `/torneos/${torneoSlug}/jornadas/${jornadaSlug}`;
        } catch (err) {
            console.error("Error al actualizar partido:", err.message);
        }
    };

    if (loading || !partido) return <p>Cargando...</p>;

    return (
        <form onSubmit={handleSubmit}>
            <label>Equipo 1:</label>
            <select value={equipo1} onChange={(e) => setEquipo1(e.target.value)} required>
                <option value="">Selecciona equipo</option>
                {equipos.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                ))}
            </select>

            <label>Equipo 2:</label>
            <select value={equipo2} onChange={(e) => setEquipo2(e.target.value)} required>
                <option value="">Selecciona equipo</option>
                {equipos.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                ))}
            </select>

            <label>Fecha:</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />

            <label>Hora:</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />

            <label>Cancha:</label>
            <input type="text" value={cancha} onChange={(e) => setCancha(e.target.value)} required />

            <button type="submit">Actualizar partido</button>
        </form>
    );
};

export default EditarPartidoForm;

import React, { useState, useEffect } from "react";
import { db } from "../lib/firebaseConfig";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    Timestamp
} from "firebase/firestore";

const PartidoForm = ({ torneoSlug, jornadaSlug }) => {
    const [equipos, setEquipos] = useState([]);
    const [equipo1, setEquipo1] = useState("");
    const [equipo2, setEquipo2] = useState("");
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [cancha, setCancha] = useState("");

    useEffect(() => {
        const cargarEquipos = async () => {
            try {
                const torneoQuery = query(collection(db, "torneos"), where("slug", "==", torneoSlug));
                const torneoSnapshot = await getDocs(torneoQuery);
                if (torneoSnapshot.empty) throw new Error("Torneo no encontrado");

                const torneoId = torneoSnapshot.docs[0].id;

                const equiposSnapshot = await getDocs(collection(db, "torneos", torneoId, "equipos"));
                const lista = equiposSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    nombre: doc.data().nombre
                }));
                setEquipos(lista);
            } catch (err) {
                console.error("Error al cargar equipos:", err.message);
            }
        };

        cargarEquipos();
    }, [torneoSlug]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (equipo1 === equipo2) {
            alert("Los equipos no pueden ser iguales.");
            return;
        }

        try {
            const torneoQuery = query(collection(db, "torneos"), where("slug", "==", torneoSlug));
            const torneoSnapshot = await getDocs(torneoQuery);
            if (torneoSnapshot.empty) throw new Error("Torneo no encontrado");
            const torneoId = torneoSnapshot.docs[0].id;

            const jornadaQuery = query(collection(db, "torneos", torneoId, "jornadas"), where("slug", "==", jornadaSlug));
            const jornadaSnapshot = await getDocs(jornadaQuery);
            if (jornadaSnapshot.empty) throw new Error("Jornada no encontrada");
            const jornadaId = jornadaSnapshot.docs[0].id;

            await addDoc(collection(db, "torneos", torneoId, "jornadas", jornadaId, "partidos"), {
                equipo_uno_id: equipo1,
                equipo_dos_id: equipo2,
                equipo_uno_nombre: equipos.find(eq => eq.id === equipo1)?.nombre || "",
                equipo_dos_nombre: equipos.find(eq => eq.id === equipo2)?.nombre || "",
                fecha,
                hora,
                cancha,
                goles_equipo_uno: null,
                goles_equipo_dos: null,
                creado: Timestamp.now()
            });

            window.location.href = `/torneos/${torneoSlug}/jornadas/${jornadaSlug}`;
        } catch (err) {
            console.error("Error al guardar partido:", err.message);
        }
    };

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

            <button type="submit">Guardar partido</button>
        </form>
    );
};

export default PartidoForm;

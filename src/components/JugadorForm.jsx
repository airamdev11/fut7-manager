import React, { useState } from "react";
import { db } from "../lib/firebaseConfig";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    Timestamp
} from "firebase/firestore";

const JugadorForm = ({ torneoSlug, equipoSlug }) => {
    const [nombre, setNombre] = useState("");
    const [numero, setNumero] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Buscar torneo por slug
            const torneoQuery = query(collection(db, "torneos"), where("slug", "==", torneoSlug));
            const torneoSnapshot = await getDocs(torneoQuery);
            if (torneoSnapshot.empty) throw new Error("Torneo no encontrado");

            const torneoId = torneoSnapshot.docs[0].id;

            // Buscar equipo por slug dentro del torneo
            const equipoQuery = query(
                collection(db, "torneos", torneoId, "equipos"),
                where("slug", "==", equipoSlug)
            );
            const equipoSnapshot = await getDocs(equipoQuery);
            if (equipoSnapshot.empty) throw new Error("Equipo no encontrado");

            const equipoId = equipoSnapshot.docs[0].id;

            // Guardar jugador en la subcolección del equipo
            await addDoc(collection(db, "torneos", torneoId, "equipos", equipoId, "jugadores"), {
                nombre,
                numero: numero ? parseInt(numero) : null,
                creado: Timestamp.now(),
            });

            window.location.href = `/torneos/${torneoSlug}/equipos/${equipoSlug}`;
        } catch (err) {
            console.error("Error al guardar jugador:", err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Agregar jugador</h2>

            <label>Nombre:</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />

            <label>Número:</label>
            <input type="number" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Opcional"/>

            <button type="submit">Guardar jugador</button>
        </form>
    );
};

export default JugadorForm;

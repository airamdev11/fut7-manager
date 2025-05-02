import React, { useState, useEffect } from "react";
import { db } from "../lib/firebaseConfig";
import { updateDoc, doc } from "firebase/firestore";

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";

const TorneoForm = () => {
  const [nombre, setNombre] = useState("");
  const generarSlug = (nombre) =>
    nombre.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [torneos, setTorneos] = useState([]);

  const cargarTorneos = async () => {
    const q = query(collection(db, "torneos"), where("activo", "==", true), orderBy("fecha_inicio", "desc"));
    const snapshot = await getDocs(q);
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTorneos(lista);
  };

  const finalizarTorneo = async (id) => {
    const confirmacion = window.confirm("¿Estás seguro de que deseas finalizar este torneo?");
    if (!confirmacion) return;
  
    const ref = doc(db, "torneos", id);
    await updateDoc(ref, { activo: false });
    cargarTorneos();
  };
  
  

  useEffect(() => {
    cargarTorneos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !fechaInicio || !fechaFin) return;

    try {
        await addDoc(collection(db, "torneos"), {
            nombre,
            slug: generarSlug(nombre),
            fecha_inicio: Timestamp.fromDate(new Date(`${fechaInicio}T12:00:00`)),
            fecha_fin: Timestamp.fromDate(new Date(`${fechaFin}T12:00:00`)),
            creado: Timestamp.now(),
            activo: true // 👈 este nuevo campo
        });          
      setNombre("");
      setFechaInicio("");
      setFechaFin("");
      cargarTorneos(); // recargar lista
    } catch (err) {
      console.error("Error al guardar torneo:", err);
    }
  };

  return (
    <div>
      <h2>Registrar nuevo torneo</h2>
      <form onSubmit={handleSubmit}>
        <label>Nombre del torneo:</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />

        <label>Fecha de inicio:</label>
        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />

        <label>Fecha de fin:</label>
        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />

        <button type="submit">Guardar</button>
      </form>

      <h3>Torneos registrados</h3>
      <ul>
        {torneos.map((torneo) => (
          <li key={torneo.id}>
          <a href={`/torneos/${torneo.slug}`} style={{ fontWeight: "bold", textDecoration: "none" }}>
            {torneo.nombre}
          </a>{" "}
          ({torneo.fecha_inicio.toDate().toLocaleDateString()} - {torneo.fecha_fin.toDate().toLocaleDateString()})
          {" "}
          {torneo.activo ? (
            <button onClick={() => finalizarTorneo(torneo.id)} style={{ marginLeft: "1rem" }}>
              Finalizar Torneo
            </button>
          ) : (
            <span style={{ color: "gray", marginLeft: "1rem" }}>Finalizado</span>
          )}
        </li>
        
        ))}
      </ul>
    </div>
  );
};

export default TorneoForm;

import React, { useState } from "react";
import { db } from "../lib/firebaseConfig";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs
} from "firebase/firestore";

const EquipoForm = ({ torneoId }) => {
  const [nombre, setNombre] = useState("");
  const [escudoBase64, setEscudoBase64] = useState(null);

  const generarSlug = (nombre) =>
    nombre.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEscudoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Buscar el ID real del torneo usando el slug
      const torneoQuery = query(
        collection(db, "torneos"),
        where("slug", "==", torneoId)
      );
      const torneoSnapshot = await getDocs(torneoQuery);

      if (torneoSnapshot.empty) {
        console.error("Torneo no encontrado con slug:", torneoId);
        return;
      }

      const torneoDoc = torneoSnapshot.docs[0];
      const torneoRealId = torneoDoc.id;

      // Guardar el equipo en la subcolección del torneo
      const equiposRef = collection(db, "torneos", torneoRealId, "equipos");
      await addDoc(equiposRef, {
        nombre,
        escudo_base64: escudoBase64,
        slug: generarSlug(nombre),
        creado: Timestamp.now(),
      });

      window.location.href = `/torneos/${torneoId}`;
    } catch (err) {
      console.error("Error al crear equipo:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Registrar equipo</h2>

      <label>Nombre del equipo:</label>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />

      <label>Escudo (imagen):</label>
      <input type="file" accept="image/*" onChange={handleFileChange} required />

      {escudoBase64 && (
        <div style={{ marginTop: "1rem" }}>
          <p>Vista previa del escudo:</p>
          <img src={escudoBase64} alt="Escudo" style={{ width: "100px" }} />
        </div>
      )}

      <button type="submit">Guardar equipo</button>
    </form>
  );
};

export default EquipoForm;

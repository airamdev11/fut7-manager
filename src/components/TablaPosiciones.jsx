import React, { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { db } from "../lib/firebaseConfig";

const TablaPosiciones = ({ torneoSlug }) => {
    const [tabla, setTabla] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calcularPosiciones = async () => {
            try {
                const torneoSnap = await getDocs(query(collection(db, "torneos"), where("slug", "==", torneoSlug)));
                if (torneoSnap.empty) return;
                const torneoId = torneoSnap.docs[0].id;

                // 1. Obtener jornadas del torneo
                const jornadasSnap = await getDocs(collection(db, "torneos", torneoId, "jornadas"));
                const jornadas = jornadasSnap.docs.map(j => ({ id: j.id }));

                const partidos = [];

                // 2. Recolectar todos los partidos con resultado
                for (const jornada of jornadas) {
                    const partidosSnap = await getDocs(collection(db, "torneos", torneoId, "jornadas", jornada.id, "partidos"));
                    partidosSnap.docs.forEach(doc => {
                        const data = doc.data();
                        if (
                            typeof data.goles_equipo_uno === "number" &&
                            typeof data.goles_equipo_dos === "number"
                        ) {
                            partidos.push({
                                equipo1_id: data.equipo_uno_id,
                                equipo2_id: data.equipo_dos_id,
                                equipo1_nombre: data.equipo_uno_nombre,
                                equipo2_nombre: data.equipo_dos_nombre,
                                gf1: data.goles_equipo_uno,
                                gf2: data.goles_equipo_dos,
                            });
                        }
                    });
                }

                // 3. Calcular estadísticas por equipo
                const stats = {};

                for (const p of partidos) {
                    const equipos = [
                        {
                            id: p.equipo1_id,
                            nombre: p.equipo1_nombre,
                            gf: p.gf1,
                            gc: p.gf2,
                            resultado: p.gf1 > p.gf2 ? "G" : p.gf1 < p.gf2 ? "P" : "E",
                        },
                        {
                            id: p.equipo2_id,
                            nombre: p.equipo2_nombre,
                            gf: p.gf2,
                            gc: p.gf1,
                            resultado: p.gf2 > p.gf1 ? "G" : p.gf2 < p.gf1 ? "P" : "E",
                        },
                    ];

                    for (const eq of equipos) {
                        if (!stats[eq.id]) {
                            stats[eq.id] = {
                                Equipo: eq.nombre,
                                JJ: 0, JG: 0, JE: 0, JP: 0,
                                GF: 0, GC: 0, DF: 0, PTS: 0,
                            };
                        }

                        stats[eq.id].JJ += 1;
                        stats[eq.id].GF += eq.gf;
                        stats[eq.id].GC += eq.gc;

                        if (eq.resultado === "G") stats[eq.id].JG += 1;
                        if (eq.resultado === "E") stats[eq.id].JE += 1;
                        if (eq.resultado === "P") stats[eq.id].JP += 1;
                    }
                }

                // 4. Calcular DF y PTS
                Object.values(stats).forEach(s => {
                    s.DF = s.GF - s.GC;
                    s.PTS = s.JG * 3 + s.JE;
                });

                // 5. Convertir en array y ordenar
                const lista = Object.values(stats).sort((a, b) => {
                    if (b.PTS !== a.PTS) return b.PTS - a.PTS;
                    if (b.DF !== a.DF) return b.DF - a.DF;
                    return b.GF - a.GF;
                });

                setTabla(lista);
            } catch (err) {
                console.error("Error al calcular tabla:", err.message);
            } finally {
                setLoading(false);
            }
        };

        calcularPosiciones();
    }, [torneoSlug]);

    if (loading) return <p>Cargando tabla de posiciones...</p>;

    return (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
            <thead>
                <tr>
                    <th style={{ textAlign: "center" }}>#</th>
                    <th style={{ padding: "0.5rem", borderBottom: "1px solid #ccc", textAlign: "left" }}>Equipo</th>
                    <th style={{ textAlign: "center" }}>JJ</th><th style={{ textAlign: "center" }}>JG</th><th style={{ textAlign: "center" }}>JE</th><th style={{ textAlign: "center" }}>JP</th>
                    <th style={{ textAlign: "center" }}>GF</th><th style={{ textAlign: "center" }}>GC</th><th style={{ textAlign: "center" }}>DF</th><th style={{ textAlign: "center" }}>PTS</th>
                </tr>
            </thead>
            <tbody>
                {tabla.map((eq, i) => (
                    <tr key={i}>
                        <td style={{ textAlign: "center" }}>{i + 1}</td>
                        <td style={{ padding: "0.5rem" }}>{eq.Equipo}</td>
                        <td style={{ textAlign: "center" }}>{eq.JJ}</td>
                        <td style={{ textAlign: "center" }}>{eq.JG}</td>
                        <td style={{ textAlign: "center" }}>{eq.JE}</td>
                        <td style={{ textAlign: "center" }}>{eq.JP}</td>
                        <td style={{ textAlign: "center" }}>{eq.GF}</td>
                        <td style={{ textAlign: "center" }}>{eq.GC}</td>
                        <td style={{ textAlign: "center" }}>{eq.DF}</td>
                        <td style={{ textAlign: "center"}}>{eq.PTS}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TablaPosiciones;

import React from "react";
import LogoutButton from "./LogoutButton.jsx";


const Navbar = () => {
    return (
        <nav style={{ background: "#1e1e1e", padding: "1rem", color: "#fff" }}>
            <ul style={{ listStyle: "none", display: "flex", gap: "1rem", margin: 0 }}>
                <li><a href="/Dashboard" style={{ color: "#fff", textDecoration: "none" }}>Dashboard</a></li>
                <li><a href="/Torneos" style={{ color: "#fff", textDecoration: "none" }}>Torneos</a></li>
                <li><LogoutButton /></li>
            </ul>

        </nav>
    );
};

export default Navbar;



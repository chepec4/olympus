const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 10000;
const SITE = "https://olympusbiblioteca.com";
const API = "https://dashboard.olympusbiblioteca.com/api";

// 🧠 GESTOR DE SESIÓN (Singleton)
const session = {
    cookies: "",
    xsrf: "",
    lastRefresh: 0,
    async refresh() {
        try {
            const res = await axios.get(SITE, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
            });
            const setCookies = res.headers["set-cookie"] || [];
            this.cookies = setCookies.map(c => c.split(";")[0]).join("; ");
            const match = this.cookies.match(/XSRF-TOKEN=([^;]+)/);
            this.xsrf = match ? decodeURIComponent(match[1]) : "";
            this.lastRefresh = Date.now();
            console.log("🔥 Sesión renovada con éxito");
        } catch (e) {
            console.error("❌ Error renovando sesión:", e.message);
        }
    },
    async getHeaders() {
        if (!this.xsrf || (Date.now() - this.lastRefresh > 15 * 60 * 1000)) {
            await this.refresh();
        }
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": SITE,
            "X-XSRF-TOKEN": this.xsrf,
            "Cookie": this.cookies
        };
    }
};

// 🧩 NORMALIZADOR UNIVERSAL (Anti-Error .map)
function normalize(data) {
    let raw = [];
    // Caso 1: Estructura anidada de Laravel (series.data)
    if (data?.series?.data) raw = data.series.data;
    // Caso 2: Estructura plana (data)
    else if (data?.data) raw = data.data;
    // Caso 3: Array directo
    else if (Array.isArray(data)) raw = data;
    // Caso 4: Objeto con llaves numéricas (El asesino del .map)
    else if (data && typeof data === 'object') raw = Object.values(data);

    // Forzar Array final o lista vacía
    return Array.isArray(raw) ? raw : [];
}

// 📚 ENDPOINT: SERIES
app.get("/series", async (req, res) => {
    try {
        const headers = await session.getHeaders();
        const response = await axios.get(`${API}/series`, {
            params: {
                type: "comic",
                page: req.query.page || 1,
                direction: "desc",
                limit: 20
            },
            headers
        });

        const rawData = normalize(response.data);
        
        const clean = rawData.map(m => ({
            name: m.name || m.title || "Manga",
            slug: m.slug,
            cover: m.cover?.startsWith('http') ? m.cover : `https://dashboard.olympusbiblioteca.com/storage/covers/${m.cover}`
        })).filter(m => m.slug); // Eliminar basura sin slug

        res.json({ data: clean });

    } catch (err) {
        if (err.response?.status === 419) {
            await session.refresh(); // Forzar refresh si Laravel nos echa
            return res.status(500).json({ error: "Sesión expirada, reintenta en 2 segundos" });
        }
        res.status(500).json({ error: err.message });
    }
});

// 🏠 RUTA DE SALUD
app.get("/", (req, res) => res.send("🏛️ Imperio Proxy Olympus: Activo"));

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 El Norte ha sido conquistado en el puerto ${PORT}`);
});

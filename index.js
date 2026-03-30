const express = require('express');
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const app = express();

const PORT = process.env.PORT || 3000;
const jar = new CookieJar();
const client = wrapper(axios.create({ 
    jar, 
    withCredentials: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://olympusbiblioteca.com/',
        'Origin': 'https://olympusbiblioteca.com',
        'X-Requested-With': 'XMLHttpRequest'
    }
}));

// FUNCIÓN DE CALENTAMIENTO (WARMUP)
async function ensureSession() {
    try {
        // Primero "tocamos" la web para que Cloudflare nos vea
        await client.get('https://olympusbiblioteca.com/');
        // Luego intentamos el endpoint de usuario para capturar el XSRF-TOKEN
        await client.get('https://dashboard.olympusbiblioteca.com/api/user');
    } catch (e) {
        // Ignoramos el error 401, lo que nos importa son las cookies que nos dejó
    }
}

app.get('/series', async (req, res) => {
    try {
        await ensureSession(); // Paso vital
        const page = req.query.page || 1;
        const response = await client.get(`https://dashboard.olympusbiblioteca.com/api/series?type=comic&page=${page}&limit=20`);
        
        // Manejamos la estructura flexible de Olympus
        const raw = response.data.series ? response.data.series.data : response.data.data;
        
        const cleanData = raw.map(m => ({
            name: m.name,
            slug: m.slug,
            id: m.id, // Importante para los capítulos
            cover: m.cover.startsWith('http') ? m.cover : `https://dashboard.olympusbiblioteca.com/storage/covers/${m.cover}`
        }));

        res.json({ data: cleanData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Olympus rechazó la conexión", details: err.message });
    }
});

// Agregamos el endpoint para detalles para que no de error después
app.get('/series/:slug', async (req, res) => {
    try {
        await ensureSession();
        const { slug } = req.params;
        const response = await client.get(`https://dashboard.olympusbiblioteca.com/api/series/${slug}?type=comic`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: "Error en detalles" });
    }
});

app.listen(PORT, () => console.log(`🔥 Imperio Proxy en puerto ${PORT}`));
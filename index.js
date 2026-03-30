const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

const PORT = process.env.PORT || 3000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// 1. Endpoint para la lista de mangas
app.get('/series', async (req, res) => {
    try {
        const page = req.query.page || 1;
        // Llamamos a la API de Olympus fingiendo ser un navegador
        const response = await axios.get(`https://dashboard.olympusbiblioteca.com/api/series?type=comic&page=${page}`, {
            headers: { 
                "User-Agent": UA,
                "Referer": "https://olympusbiblioteca.com/",
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        // Limpiamos los datos para que Kotatsu no se confunda
        const raw = response.data.series ? response.data.series.data : response.data.data;
        const cleanData = raw.map(m => ({
            name: m.name,
            slug: m.slug,
            cover: m.cover.startsWith('http') ? m.cover : `https://dashboard.olympusbiblioteca.com/storage/covers/${m.cover}`
        }));

        res.json({ data: cleanData });
    } catch (err) {
        res.status(500).json({ error: "Error conectando con Olympus" });
    }
});

app.listen(PORT, () => console.log(`🚀 Proxy corriendo en puerto ${PORT}`));
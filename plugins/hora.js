import fetch from 'node-fetch'

const handler = async (m, { conn, args, command }) => {
    // Si el comando es .hora japon, toma "japon". Si es .tokyo, toma "tokyo".
    let query = command.toLowerCase() === 'hora' ? args.join(' ') : command;
    
    if (!query || query === 'hora') {
        return conn.sendMessage(m.chat, { text: '📍 Escribe el nombre de una ciudad.\nEjemplo: `.hora parís` o `.tokyo`' }, { quoted: m });
    }

    try {
        // 1. Buscamos la ciudad en el mapa mundial (Nominatim API)
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
            headers: { 'User-Agent': 'Bot-Vidal-Time' }
        });
        const geoData = await geoRes.json();

        if (!geoData || geoData.length === 0) throw 'Ciudad no encontrada';

        const { lat, lon, display_name } = geoData[0];

        // 2. Obtenemos la zona horaria basada en las coordenadas
        const tzRes = await fetch(`https://timeapi.io/api/Time/current/coordinate?latitude=${lat}&longitude=${lon}`);
        const tzData = await tzRes.json();

        if (!tzData.timeZone) throw 'Error al obtener zona horaria';

        const opciones = {
            timeZone: tzData.timeZone,
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };

        const formateador = new Intl.DateTimeFormat('es-MX', opciones);
        const fechaYHora = formateador.format(new Date());

        let mensaje = `⏰ *RELOJ MUNDIAL*\n\n` +
                      `📍 *Lugar:* ${display_name.split(',')[0]}\n` +
                      `🗺️ *Región:* ${tzData.timeZone}\n` +
                      `📅 *Datos:* ${fechaYHora}\n\n` +
                      `> 🌍 Buscador global activado`;

        await conn.sendMessage(m.chat, { text: mensaje }, { quoted: m });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(m.chat, { 
            text: `❌ No pude encontrar la hora para: *${query}*.\nIntenta ser más específico (ej: .hora Bogota, Colombia)` 
        }, { quoted: m });
    }
}

// Ahora el comando 'hora' acepta cualquier texto, y puedes dejar tus ciudades favoritas como accesos directos
handler.command = /^(hora|time|fecha|tokyo|madrid|mexico|london|paris|seoul|roma|berlin)$/i 
export default handler;
let handler = async (m, { conn, texto }) => {
    let lugar = texto.replace(/^\.[a-z]+\s*/i, '').trim().toLowerCase();

    let zonas = {
        "monterrey": "America/Monterrey",
        "mexico": "America/Mexico_City",
        "cdmx": "America/Mexico_City",
        "bogota": "America/Bogota",
        "madrid": "Europe/Madrid",
        "buenos aires": "America/Argentina/Buenos_Aires",
        "lima": "America/Lima",
        "santiago": "America/Santiago",
        "tokio": "Asia/Tokyo"
    };

    let zonaFinal = zonas[lugar] || (lugar ? lugar : 'America/Monterrey');

    try {
        const opciones = {
            timeZone: zonaFinal,
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };

        // Forzamos el idioma a español de México 'es-MX'
        const formateador = new Intl.DateTimeFormat('es-MX', opciones);
        const fechaYHora = formateador.format(new Date());

        let mensaje = `⏰ *INFORME DE TIEMPO*\n\n` +
                      `📍 *Lugar:* ${zonaFinal.split('/').pop().replace('_', ' ')}\n` +
                      `📅 *Fecha:* ${fechaYHora}\n\n` +
                      `> 🌏 Consulta: .hora [ciudad]`;

        await conn.sendMessage(m.chat, { text: mensaje }, { quoted: m });

    } catch (e) {
        await conn.sendMessage(m.chat, { 
            text: `❌ No reconozco el lugar: *${lugar}*\nPrueba con: .hora monterrey o .hora America/New_York` 
        }, { quoted: m });
    }
}

handler.command = /^(hora|fecha|time)$/i 
export default handler;
const handler = async (m, { conn, args }) => {
    // Categoría por defecto 'waifu', o la que escriba el usuario (ej: neko, husbando, kitsune)
    let categoria = args[0] ? args[0].toLowerCase() : 'waifu';
    
    const url = `https://nekos.best/api/v2/${categoria}`;

    try {
        const res = await fetch(url);

        // Si la categoría no existe o falla, usamos 'waifu' por defecto como respaldo
        if (!res.ok) {
            const resDefault = await fetch('https://nekos.best/api/v2/waifu');
            const dataDefault = await resDefault.json();
            const item = dataDefault.results[0];

            return await conn.sendMessage(m.chat, {
                image: { url: item.url },
                caption: `✨ Categoría no encontrada. Aquí tienes una waifu al azar.\n🔗 Fuente: ${item.source_url || 'Nekos.best'}`
            }, { quoted: m });
        }

        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            return m.reply("❌ No se encontró ninguna imagen con esa categoría.");
        }

        const item = data.results[0];
        const imagenUrl = item.url;
        const sourceUrl = item.source_url || 'Nekos.best';

        await conn.sendMessage(m.chat, {
            image: { url: imagenUrl },
            caption: `✨ **Pinterest / Nekos.best**\n🔍 Categoría: *${categoria}*\n🔗 Fuente: ${sourceUrl}`
        }, { quoted: m });

    } catch (error) {
        console.error("Error en pinterest.js con nekos.best:", error);
        return m.reply("❌ Hubo un error al conectar con el servidor de imágenes.");
    }
};

handler.command = /^(pinterest|pin)$/i;

export default handler;
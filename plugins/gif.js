const GIPHY_KEY = "8Ds1f1yAVoH6EY3wig3pSj7m2BbP3YrU";

const handler = async (m, { conn, args, command }) => {

    const query = args.join(" ").trim();

    if (!query) {
        return m.reply(`💡 Uso:\n.${command} [nombre]\n\nEjemplo:\n.${command} megumin`);
    }

    try {
        await m.reply(`🔎 Buscando GIFs de *${query}* en Giphy...`);

        const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=pg-13`;

        const res = await fetch(url);
        const json = await res.json();

        if (!json.data || json.data.length === 0) {
            return m.reply(`❌ No encontré GIFs para *${query}*`);
        }

        // 🎲 random GIF
        const random = json.data[Math.floor(Math.random() * json.data.length)];

        // 🎥 Forzamos a obtener la versión MP4 limpia de Giphy para que WhatsApp no dé error
        const videoUrl = random.images?.original?.mp4 || random.images?.downsized_small?.mp4;

        if (!videoUrl) {
            return m.reply("❌ No se pudo obtener un formato de video compatible.");
        }

        // 🎬 Enviamos como video corto reproducible Y descargable
        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: `✨ Resultado: *${query}*`
        }, { quoted: m });

    } catch (err) {
        console.log(err);
        m.reply("❌ Error al procesar el video corto.");
    }
};

handler.command = /^gif$/i;

export default handler;
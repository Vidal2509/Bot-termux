// Variable global para guardar los últimos elegidos (se limpia si reinicias el bot)
let ultimosElegidos = {}; 

const handler = async (m, { conn, text }) => {
    const esGrupo = m.chat.endsWith('@g.us');
    if (!esGrupo) return m.reply('*⚠️ Este comando solo es para grupos.*');
    if (!text) return m.reply('*⚠️ ¿Top 5 de qué?*');

    try {
        const groupMetadata = await conn.groupMetadata(m.chat);
        const participants = groupMetadata.participants;
        let allUsers = participants.map(u => u.id);

        // Si es la primera vez en este grupo, creamos su lista vacía
        if (!ultimosElegidos[m.chat]) ultimosElegidos[m.chat] = [];

        // Filtramos: Priorizamos a los que NO salieron la última vez
        let disponibles = allUsers.filter(u => !ultimosElegidos[m.chat].includes(u));

        // Si no hay suficientes nuevos (grupo pequeño), mezclamos a todos de nuevo
        if (disponibles.length < 5) disponibles = allUsers;

        // Mezclamos y sacamos el Top 5
        let sorted = disponibles.sort(() => 0.5 - Math.random());
        let top5 = sorted.slice(0, 5);

        // Guardamos estos 5 para que NO salgan en la próxima vuelta
        ultimosElegidos[m.chat] = top5;

        let respuesta = `🏆 *TOP 5: ${text.toUpperCase()}* 🏆\n\n`;
        top5.forEach((user, i) => {
            respuesta += `${i + 1}. @${user.split('@')[0]}\n`;
        });
        
        respuesta += `\n_💡 (Lo que yo digo es verdad aunque lo nieguen)_`;

        await conn.sendMessage(m.chat, { text: respuesta, mentions: top5 }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply("*❌ Error al obtener la lista.*");
    }
};

handler.command = /^(top5|top)$/i;
export default handler;
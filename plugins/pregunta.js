const handler = async (m, { conn, command, text, usedPrefix }) => {
    // Validación: Si el usuario no escribe nada después del comando
    if (!text) return m.reply(`🔎 *Uso correcto:* ${usedPrefix + command} ¿Hoy será un buen día?`);

    // Banco de respuestas variadas (Sí, No y sinónimos)
    const respuestas = [
        // Sinónimos de SÍ
        "Sí, definitivamente. ✅",
        "Por supuesto. ✨",
        "Claro que sí. 👍",
        "Totalmente de acuerdo. 😎",
        "Mis fuentes dicen que sí. 🔮",
        "¡Obvio! 💯",
        
        // Sinónimos de NO
        "No, para nada. ❌",
        "Claro que no. 👎",
        "Definitivamente no. 🥶",
        "No lo creo. 🤨",
        "Mis fuentes dicen que no. 📉",
        "¡Ni lo pienses! 🙅‍♂️",

        // Respuestas neutrales/misteriosas (Opcionales, por si quieres darle más juego)
        "Es un misterio... 🌀",
        "Pregúntame más tarde. 💤",
        "No estoy muy seguro de eso. 🤔"
    ];

    // Seleccionar una respuesta al azar
    const respuestaAzar = respuestas[Math.floor(Math.random() * respuestas.length)];

    // Enviar la respuesta con el formato de letra que querías
    const txt = `🔮 **PREGUNTA:** _${text}_\n\n🤖 **RESPUESTA:** \`\`\`${respuestaAzar}\`\`\``;

    // En lugar de enviar la mención normal, le pasamos al mensaje los JIDs que detecte en el chat
await conn.sendMessage(m.chat, { 
    text: txt, 
    mentions: m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [] 
}, { quoted: m });
};

handler.command = /^(pregunta|ask)$/i;

export default handler;
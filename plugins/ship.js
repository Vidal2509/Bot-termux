const handler = async (m, { conn, text }) => {
    // Extraemos las menciones del mensaje (los @usuario)
    let targets = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    if (targets.length < 2) return m.reply('*⚠️ Etiqueta a dos personas para calcular su amor!*\n\nEjemplo: .ship @usuario1 @usuario2');

    let user1 = targets[0];
    let user2 = targets[1];
    
    let love = Math.floor(Math.random() * 101); // De 0 a 100
    let mensaje = `❤️ *MEDIDOR DE AMOR* ❤️\n\n`;
    mensaje += `👥 *Pareja:* @${user1.split('@')[0]} x @${user2.split('@')[0]}\n`;
    mensaje += `✨ *Compatibilidad:* ${love}%\n\n`;
    
    if (love >= 90) {
        mensaje += "🔥 *¡Boda a la vista!* Están destinados a estar juntos por siempre.";
    } else if (love >= 70) {
        mensaje += "😍 *¡Hay mucha química!* Deberían intentar algo más que una amistad.";
    } else if (love >= 50) {
        mensaje += "⚖️ *Hay potencial,* pero necesitan ponerse de acuerdo.";
    } else if (love >= 30) {
        mensaje += "😅 *Zona de amigos.* Se llevan bien, pero nada más.";
    } else {
        mensaje += "💔 *Ni lo intenten.* El destino dice que mejor sigan caminos separados.";
    }
    
    // Enviamos con menciones para que se vea el nombre con @ en azul
    await conn.sendMessage(m.chat, { 
        text: mensaje, 
        mentions: [user1, user2] 
    }, { quoted: m });
};

handler.command = /^(ship|amor)$/i;
export default handler;
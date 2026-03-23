const handler = async (m, { conn, text, command }) => {
    if (!text) return m.reply(`*⚠️ ¿Qué quieres medir?*\nEjemplo: .${command} feo @usuario`);

    // Obtener ID del bot de forma segura desde tu index
    const botId = conn.user && conn.user.id ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : '';

    // Extraer quién envió el mensaje según tu estructura de Baileys
    const emisor = m.key.participant || m.key.remoteJid;

    // Obtener el ID del mencionado desde el mensaje original
    const menciones = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const citado = m.message?.extendedTextMessage?.contextInfo?.participant;

    // Selección de objetivo (Mención > Respuesta > Emisor)
    let target = emisor;
    if (menciones.length > 0) {
        target = menciones[0];
    } else if (citado) {
        target = citado;
    }

    // Bloqueo si el objetivo es el bot
    if (target.split('@')[0] === botId.split('@')[0]) {
        return m.reply('❌ No puedes medir nada en mí. Mi nivel de perfección rompe tu barrita. 💅');
    }

    let porcentaje = Math.floor(Math.random() * 101);
    let barra = '█'.repeat(Math.floor(porcentaje / 10)) + '░'.repeat(10 - Math.floor(porcentaje / 10));
    
    // Limpiar texto
    let loQueMide = text.replace(/@\d+/g, '').trim();
    if (!loQueMide) loQueMide = "eso";

    // Extraer número para el Para:
    let numero = target.split('@')[0];

    let respuesta = `📊 *MEDIDOR DE ${loQueMide.toUpperCase()}* 📊\n\n`;
    respuesta += `*Para:* @${numero}\n`;
    respuesta += `*Resultado:* [${barra}] ${porcentaje}%\n\n`;
    
   let rango = "";
    if (porcentaje >= 100) rango = "🌌 Nivel: *Entidad Ancestral*";
    else if (porcentaje >= 95) rango = "🏆 Nivel: *Leyenda Definitiva*";
    else if (porcentaje >= 85) rango = "👑 Nivel: *Semidiós del Código*";
    else if (porcentaje >= 75) rango = "🎖️ Nivel: *Maestro Experto*";
    else if (porcentaje >= 60) rango = "⚔️ Nivel: *Guerrero de Élite*";
    else if (porcentaje >= 50) rango = "⚡ Nivel: *Usuario Avanzado*";
    else if (porcentaje >= 40) rango = "✨ Nivel: *Usuario Promedio*";
    else if (porcentaje >= 25) rango = "🛡️ Nivel: *Aprendiz Constante*";
    else if (porcentaje >= 10) rango = "🌱 Nivel: *Novato*";
    else if (porcentaje >= 1)  rango = "🥚 Nivel: *Recién Nacido*";
    else rango = "🚫 Nivel: *Inexistente*";

    respuesta += rango;

    // Usar sendMessage con menciones para que se vea el nombre
    await conn.sendMessage(m.chat, { 
        text: respuesta, 
        mentions: [target] 
    }, { quoted: m });
};

handler.command = /^(medidor|medir|test|cuanto)$/i;

export default handler;
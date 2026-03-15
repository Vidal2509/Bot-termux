const handler = async (m, { conn, usedPrefix }) => {
    let name = m.pushName || 'Usuario'
    let textoMenu = `👋 ¡Hola, *${name}*!

Este es el menú de *${global.wm || 'Bot del admin'}*

💍 *SISTEMA DE WAIFUS:*
- *${usedPrefix}matrimonio [nombre]* (Intenta casarte con una waifu)
- *${usedPrefix}harem* (Mira tu lista de esposas actuales)
- *${usedPrefix}buscar [nombre]* (Mira si una waifu tiene dueño)
- *${usedPrefix}robar [nombre]* (Intenta quitarle una waifu a alguien 😈)

🎮 *JUEGOS:*
- *${usedPrefix}suerte* (En mantenimiento 🛠️)
- *${usedPrefix}medir [texto] @usuario* (Mide qué tan feo, pro o gay es alguien)

🎨 *CREATIVIDAD:*
- *${usedPrefix}s [texto]* (Crea sticker con texto inteligente)

📥 *DESCARGAS:*
- *${usedPrefix}video [link]* (TikTok, Shorts, Reels)
- *${usedPrefix}mp3 [link]* (Música de YouTube o TikTok)

⏰ *RELOJ MUNDIAL:*
- *${usedPrefix}hora [ciudad]* (Cualquier ciudad del mundo)
- *${usedPrefix}tokyo* (Acceso rápido a Japón)

🛠️ *SISTEMA:*
- *${usedPrefix}hola* (Saludo del bot)
- *${usedPrefix}menu* (Muestra esta lista)`

    await conn.sendMessage(m.chat, { 
        text: textoMenu 
    }, { quoted: m })
}

handler.command = /^(menu|help|ayuda)$/i 

export default handler
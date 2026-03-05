const handler = async (m, { conn }) => {
    let name = m.pushName || 'Usuario'
    let textoMenu = `👋 ¡Hola, *${name}*!

Este es el menú de *${global.wm || 'Bot de Vidal'}*

🎨 *CREATIVIDAD:*
- *.s [texto]* (Crea sticker con texto inteligente)

📥 *DESCARGAS:*
- *.video [link]* (TikTok, Shorts, Reels)
- *.mp3 [link]* (Música de YouTube o TikTok)

⏰ *RELOJ MUNDIAL:*
- *.hora [ciudad]* (Busca cualquier ciudad del mundo)
- *.tokyo* (Acceso rápido a Japón)

🛠️ *SISTEMA:*
- *.hola* (Saludo del bot)
- *.menu* (Muestra esta lista)

> 💻 Ejecutado desde VS Code y Termux`

    await conn.sendMessage(m.chat, { 
        text: textoMenu,
        contextInfo: {
            externalAdReply: {
                title: 'Vidal Bot - Active System',
                body: 'Online 2026',
                sourceUrl: '',
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m })
}

handler.command = /^(menu|help|ayuda)$/i 

export default handler
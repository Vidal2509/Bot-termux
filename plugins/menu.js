let handler = async (m, { conn }) => {
    let name = m.pushName || 'Usuario'
    let textoMenu = `👋 ¡Hola, *${name}*!
    
Este es el menú de *${global.wm || 'Mi Bot'}*

📌 *COMANDOS:*
- .hola
- .menu

> 💻 Ejecutado desde VS Code`

    // Intentamos enviar un mensaje simple primero para asegurar que funciona
    await conn.sendMessage(m.chat, { text: textoMenu }, { quoted: m })
}

handler.command = /^(menu|help|ayuda)$/i 

export default handler
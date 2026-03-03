let handler = async (m, { conn }) => {
    // Si m.chat está definido en el index, esto no fallará
    await conn.sendMessage(m.chat, { text: '¡Hola! Ya no hay error de JID.' }, { quoted: m });
}
handler.command = /^(hola)$/i 
export default handler;
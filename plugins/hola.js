let handler = async (m, { conn }) => {
    // Si m.chat está definido en el index, esto no fallará
    await conn.sendMessage(m.chat, { text: '¡Hola! ¿como estas? usa .Menu para ver mis comandos guapo.' }, { quoted: m });
}
handler.command = /^(hola)$/i 
export default handler;
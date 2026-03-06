import yts from 'yt-search'
import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`⚠️ Escribe una canción\n\nEjemplo:\n${usedPrefix + command} Believer`)

  try {
    const search = await yts(text)
    const vid = search.videos[0]
    if (!vid) return m.reply("❌ No se encontró el video")
    if (vid.seconds > 900) return m.reply("❌ Máximo 15 minutos")

    await m.reply(`🎧 Descargando *${vid.title}*`)

    // Asegurar que la carpeta tmp exista
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp')
    const file = `./tmp/${Date.now()}.mp3`

    // --- LOGICA UNIVERSAL ---
    // En Windows usa "python -m yt_dlp", en Termux/Linux usa "yt-dlp" directamente
    const comandoBase = os.platform() === "win32" ? "python -m yt_dlp" : "yt-dlp"

    exec(`${comandoBase} -x --audio-format mp3 -o "${file}" ${vid.url}`, async (err) => {
      if (err) {
        console.log(err)
        return m.reply("❌ Error descargando audio. Verifica que yt-dlp y ffmpeg estén instalados.")
      }

      await conn.sendMessage(m.chat, {
        audio: fs.readFileSync(file),
        mimetype: 'audio/mpeg',
        fileName: vid.title + ".mp3"
      }, { quoted: m })

      if (fs.existsSync(file)) fs.unlinkSync(file)
    })

  } catch (e) {
    console.log(e)
    m.reply("❌ Error en el comando")
  }
}

handler.command = /^(play|mp3|audio)$/i
export default handler
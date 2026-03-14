import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"

const execPromise = promisify(exec)

// Envolvemos la ruta con comillas extra para manejar el espacio en "Bot celular"
const PYTHON = `\"C:/Users/vidal/Documents/Bot celular/.venv/Scripts/python.exe\"`

const handler = async (m, { conn, text }) => {
    if (!text) return m.reply("🎤 Ejemplo:\n.cantar bad apple")

    const id = Date.now()
    const song = `song-${id}.mp3`
    const clip = `clip-${id}.wav`
    const finalVoz = `result-${id}.mp3`

    try {
        m.reply("🔎 Buscando canción...")
        // Usamos comillas para las rutas de los archivos también
        await execPromise(`yt-dlp "ytsearch1:${text}" -x --audio-format mp3 -o "${song}"`)

        m.reply("✂️ Recortando canción...")
        await execPromise(`ffmpeg -y -i "${song}" -ss 00:00:30 -t 60 "${clip}"`)

        m.reply("🤖 Procesando voz Momoi con IA...")
        // Ejecutamos Python envolviendo todo correctamente
        await execPromise(`${PYTHON} python/cantar_ai.py "${clip}" "${finalVoz}"`)

        if (fs.existsSync(finalVoz)) {
            await conn.sendMessage(m.chat, { 
                audio: fs.readFileSync(finalVoz), 
                mimetype: 'audio/mp4', 
                ptt: true 
            }, { quoted: m })
            m.reply("✅ Cover generado con éxito")
        } else {
            throw new Error("El script de IA no generó el archivo de salida.")
        }

    } catch (e) {
        console.error("Error detallado:", e)
        m.reply("❌ Error generando cover. Revisa la consola.")
    } finally {
        // Limpieza de archivos
        [song, clip, finalVoz].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file)
        })
    }
}

handler.command = /^cantar$/i
export default handler
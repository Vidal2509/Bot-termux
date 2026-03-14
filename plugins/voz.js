import { exec } from "child_process"
import fs from "fs"
import { promisify } from "util"

const execPromise = promisify(exec)

const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*⚠️ ¿Qué quieres que diga Momoi?*\nEjemplo: ${usedPrefix + command} ¡Coqueta!, si me quieres solo di la neta...`)

    const id = Date.now()
    const mp3 = `voz-${id}.mp3`
    const ogg = `voz-${id}.ogg`

    const esEspanol = /[áéíóúñ¿¡]/i.test(text) || /hola|como|estas|gracias|que/i.test(text)
    
    // --- AJUSTES DE VOZ PARA ESTILO "MOMOI CORRIDOS" ---
    const voz = esEspanol ? "es-MX-DaliaNeural" : "ja-JP-NanamiNeural"
    const rate = "+42%"  // Más rápida para dar fluidez al ritmo
    const pitch = "+28Hz" // Más aguda para igualar el timbre de Momoi

    m.reply("🎤 *Momoi está grabando un audio belicón...*")

    try {
        const textoLimpio = text.replace(/"/g, '')
        
        // 1. Generar audio base
        await execPromise(`edge-tts --voice ${voz} --rate ${rate} --pitch ${pitch} --text "${textoLimpio}" --write-media "${mp3}"`)

        if (!fs.existsSync(mp3)) throw new Error("No se pudo generar el archivo base.")

        // 2. Convertir a OGG + Efecto de Eco/Reverberación
        // El filtro "aecho" le da ese toque de micrófono de escenario
        await execPromise(`ffmpeg -y -i "${mp3}" -af "aecho=0.8:0.88:60:0.4" -c:a libopus -b:a 128k "${ogg}"`)

        if (!fs.existsSync(ogg)) throw new Error("Error en la conversión.")

        const audio = fs.readFileSync(ogg)
        await conn.sendMessage(m.chat, {
            audio: audio,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true
        }, { quoted: m })

    } catch (err) {
        console.error("Error en comando .voz:", err)
        m.reply(`❌ Hubo un fallo: ${err.message}`)
    } finally {
        if (fs.existsSync(mp3)) fs.unlinkSync(mp3)
        if (fs.existsSync(ogg)) fs.unlinkSync(ogg)
    }
}

handler.command = /^(voz)$/i
export default handler
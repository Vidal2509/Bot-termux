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


   try {
        const textoLimpio = text.replace(/"/g, '')
        
        // --- DETECCIÓN DE SISTEMA ---
        // En Windows el comando es 'python', en Termux es 'python3' o 'edge-tts' directamente
        const esWindows = process.platform === 'win32'
        const comandoBase = esWindows ? 'python -m edge_tts' : 'python3 -m edge_tts'

        m.reply(`🎤 *Generando voz en ${esWindows ? 'Windows' : 'Termux'}...*`)

        // 1. Generar audio con el comando adaptado
        await execPromise(`${comandoBase} --voice ${voz} --rate ${rate} --pitch ${pitch} --text "${textoLimpio}" --write-media "${mp3}"`)

        if (!fs.existsSync(mp3)) throw new Error("No se pudo generar el archivo base.")

        // 2. Convertir a OGG + Efecto de Eco
        await execPromise(`ffmpeg -y -i "${mp3}" -af "aecho=0.8:0.88:60:0.4" -c:a libopus -b:a 128k "${ogg}"`)
// ... resto del código

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
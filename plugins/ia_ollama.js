import fetch from 'node-fetch'
import fs from 'fs'

const dataPath = './database/ai_memory.json'
const configPath = './database/ai_config.json'

const handler = async (m, { conn, text, command }) => {
  // --- SEGURIDAD: TU NÚMERO ---
  const miNumeroFiel = '280139359338689';
  const emisor = m.key.participant || m.key.remoteJid || '';
  const soyYo = emisor.includes(miNumeroFiel);

  // Inicializar archivos
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}))
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify({ status: true }))
  
  let memory = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

  // --- CONTROL DE ENCENDIDO/APAGADO ---
  if (command === 'activar' && text.toLowerCase() === 'ia') {
    if (!soyYo) return m.reply('❌ *Acceso denegado.* Solo mi creador Peter puede despertarme.');
    config.status = true
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    return m.reply("✅ IA de Rei Chiquita activada.");
  }

  if (command === 'desactivar' && text.toLowerCase() === 'ia') {
    if (!soyYo) return m.reply('❌ *Acceso denegado.* Solo Peter me manda a dormir.');
    config.status = false
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    return m.reply("💤 IA de Rei Chiquita desactivada.");
  }

  // Si la IA está apagada, ignorar comandos .bot/.ia
  if (!config.status && /^(bot|ia|rei)$/i.test(command)) return

  // --- LÓGICA DE LA IA ---
  if (/^(bot|ia|rei)$/i.test(command)) {
    const chatId = m.chat
    if (!memory[chatId]) memory[chatId] = []

    const quoted = m.quoted ? m.quoted : null
    const contextText = quoted ? quoted.text : ""
    if (!text && !contextText) return m.reply(`¿Qué quieres ahora? 🙄`)

    await conn.sendPresenceUpdate('composing', m.chat)

    const systemMessage = {
      role: 'system',
      content: "Eres Rei Chiquita. Rebelde, sarcástica y cortante. Responde en español, máximo 50 palabras. RECUERDA todo lo anterior."
    }

    // Mantener últimos 10 mensajes
    if (memory[chatId].length >= 10) memory[chatId] = memory[chatId].slice(-10)

    const userContent = contextText ? `(Contexto: ${contextText}) ${text}` : text
    memory[chatId].push({ role: 'user', content: userContent })

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          messages: [systemMessage, ...memory[chatId]],
          stream: false
        })
      })

      const data = await response.json()
      const respuestaIA = data.message.content.trim()

      memory[chatId].push({ role: 'assistant', content: respuestaIA })
      fs.writeFileSync(dataPath, JSON.stringify(memory, null, 2))

      await m.reply(respuestaIA)

    } catch (e) {
      console.error(e)
      m.reply('❌ No hay respuesta de Ollama. Revisa tu consola.')
    }
  }
}

handler.command = /^(bot|ia|rei|activar|desactivar)$/i
export default handler
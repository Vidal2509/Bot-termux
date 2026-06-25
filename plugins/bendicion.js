import fs from 'fs';
import { join } from 'path';

// Listas de razones para el SÍ y para el NO
const razonesSi = [
    "porque ha estado muy activo en el grupo. ✨",
    "porque me cae súper bien y tiene buen gusto. 😎",
    "porque hoy anda con toda la facha. 👑",
    "porque se bañó (por fin). 🧼",
    "porque sus memes siempre reviven el grupo. 🔥",
    "porque es una lindura de persona. 💖"
];

const razonesNo = [
    "porque es tremendamente feo/a. 💀",
    "... bueno, en realidad no se la merece por fantasma. 👻",
    "porque no ha mandado ni un solo sticker hoy. 😡",
    "porque huele a obo. 🤢",
    "porque es un otaku mugroso que no se baña. 🧼❌",
    "porque la bola de cristal dice que es un traidor. 🔮🚫"
];

const handler = async (m, { conn, text }) => {
    const esGrupo = m.chat.endsWith('@g.us');
    if (!esGrupo) return m.reply('*⚠️ Este comando solo es para grupos.*');

    // 1. Detectar el ID de WhatsApp de la persona (jid)
    let who = null;
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
        who = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        who = m.message.extendedTextMessage.contextInfo.participant;
    } else if (m.quoted) {
        who = m.quoted.sender;
    }

    if (!who) return m.reply('*⚠️ ¿A quién quieres bendecir? Etiqueta a alguien. Ejemplo: .bendicion @usuario*');

    try {
        let nombreMostrar = null;
        const bareID = who.split('@')[0]; // Número limpio sin @lid ni @s.whatsapp.net

        // 2. Cargar tu archivo matrimonios.json
        const pathMatrimonios = join(process.cwd(), 'database', 'matrimonios.json');
        
        if (fs.existsSync(pathMatrimonios)) {
            let data = JSON.parse(fs.readFileSync(pathMatrimonios, 'utf-8'));

            if (data && data.usuarios) {
                // AQUÍ ESTÁ EL TRUCO: Comparamos solo los números puros de las llaves del JSON
                let idReal = Object.keys(data.usuarios).find(key => key.split('@')[0] === bareID);

                if (idReal && data.usuarios[idReal]?.nombre) {
                    nombreMostrar = data.usuarios[idReal].nombre;
                }
            }
        }

        // 3. Plan de respaldo si no está registrado todavía en tu JSON
        if (!nombreMostrar) {
            if (m.quoted && m.quoted.pushName) {
                nombreMostrar = m.quoted.pushName;
            } else {
                try {
                    const groupMetadata = await conn.groupMetadata(m.chat);
                    const participant = groupMetadata.participants.find(p => p.id.split('@')[0] === bareID);
                    nombreMostrar = participant?.notify || participant?.name || bareID;
                } catch {
                    nombreMostrar = bareID;
                }
            }
        }

        // Determinar 50/50 si es SÍ o NO
        const esBendecido = Math.random() < 0.5;
        let respuesta = '';
        
        // Formateamos el tag con el nombre real de tu base de datos
        const usuarioTag = `*${nombreMostrar}*`;

        if (esBendecido) {
            const razon = razonesSi[Math.floor(Math.random() * razonesSi.length)];
            respuesta = `😇 *¡LA BENDICIÓN SE HA CONCEDIDO!* 😇\n\n🔮 ${usuarioTag} *SÍ* recibe la bendición hoy, ${razon}`;
        } else {
            const razon = razonesNo[Math.floor(Math.random() * razonesNo.length)];
            respuesta = `💥 *¡LA BENDICIÓN HA SIDO DENEGADA!* 💥\n\n🔮 ${usuarioTag} *NO* recibe la bendición, ${razon}`;
        }

        respuesta += `\n\n_💡 (La palabra del bot es ley)_`;

        // Se envía la mención oculta para que le llegue la notificación, pero en el texto se lee limpio el nombre
        await conn.sendMessage(m.chat, { text: respuesta, mentions: [who] }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply("*❌ Error al procesar la bendición.*");
    }
};

handler.command = /^(bendicion|bendecir)$/i;
export default handler;
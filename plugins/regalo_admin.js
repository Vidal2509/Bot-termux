import fs from 'fs';
import { join } from 'path';

const obtenerImagenBuffer = (carpeta, nombreArchivo) => {
    const rutaCarpeta = join(process.cwd(), carpeta);
    if (!fs.existsSync(rutaCarpeta)) return null;
    const archivos = fs.readdirSync(rutaCarpeta);
    const coincidencia = archivos.find(f => f.toLowerCase() === nombreArchivo.toLowerCase());
    return coincidencia ? fs.readFileSync(join(rutaCarpeta, coincidencia)) : null;
};

const handler = async (m, { conn, command, text, usedPrefix }) => {
    const miNumeroFiel = '280139359338689';
    const sender = m.sender || m.key.participant || '';
    const senderNumber = sender.replace(/\D/g, '');

    if (!senderNumber.includes(miNumeroFiel)) return;

    try {
        const pathMatrimonios = join(process.cwd(), 'database', 'matrimonios.json');
        if (!fs.existsSync(pathMatrimonios)) return m.reply('❌ No existe la base de datos.');
        let data = JSON.parse(fs.readFileSync(pathMatrimonios, 'utf-8'));

        let who = null;
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            who = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            who = m.message.extendedTextMessage.contextInfo.participant;
        } else if (m.quoted) {
            who = m.quoted.sender;
        }

        let nombreWaifu = text.replace(/@\d+/g, '').replace(/\s+/g, ' ').trim();

        if (!who || !nombreWaifu) {
            return m.reply(`🎤 *Uso:* ${usedPrefix + command} @usuario Nombre`);
        }

        const bareID = who.split('@')[0];
        let idReal = Object.keys(data.usuarios).find(key => key.split('@')[0] === bareID);

        // --- REGISTRO AL ESTILO PETER (CORREGIDO PARA REGALO) ---
        if (!idReal) {
            idReal = who; 
            
            // Buscamos el nombre del destinatario en los metadatos del mensaje
            // Si es una mención, intentamos sacar el nombre que WhatsApp envía en la notificación
            let nombreDestinatario = 'Usuario';
            
            if (m.quoted) {
                nombreDestinatario = m.quoted.pushName || bareID;
            } else {
                try {
                    // Buscamos en el grupo para no fallar
                    const groupMetadata = await conn.groupMetadata(m.chat);
                    const participant = groupMetadata.participants.find(p => p.id === who);
                    nombreDestinatario = participant?.notify || participant?.name || bareID;
                } catch {
                    nombreDestinatario = bareID;
                }
            }

            // Estructura idéntica a tu comando matrimonio
            data.usuarios[idReal] = { 
                nombre: nombreDestinatario, 
                esposas: [], 
                cooldown: 0, 
                cooldownWaifu: 0, 
                advertencias: 0 
            };
        }

        const pathWaifus = join(process.cwd(), 'waifus.js');
        const pathEspeciales = join(process.cwd(), 'waifus_especiales.js');

        const importarLista = async (ruta) => {
            if (!fs.existsSync(ruta)) return [];
            const url = `file://${ruta.replace(/\\/g, '/')}`;
            const module = await import(`${url}?update=${Date.now()}`);
            return module.default || [];
        };

        const waifusNormales = await importarLista(pathWaifus);
        const waifusEspeciales = await importarLista(pathEspeciales);
        const todas = [...waifusNormales, ...waifusEspeciales];

        const waifuData = todas.find(w => w.name.toLowerCase().trim() === nombreWaifu.toLowerCase().trim());

        if (!waifuData) return m.reply(`❌ No encontré a "${nombreWaifu}".`);

        // Transferencia
        for (let u in data.usuarios) {
            if (data.usuarios[u].esposas) {
                data.usuarios[u].esposas = data.usuarios[u].esposas.filter(e => e.toLowerCase() !== waifuData.name.toLowerCase());
            }
        }

        if (!data.usuarios[idReal].esposas) data.usuarios[idReal].esposas = [];
        data.usuarios[idReal].esposas.push(waifuData.name);
        fs.writeFileSync(pathMatrimonios, JSON.stringify(data, null, 2));

        const esEspecial = waifusEspeciales.some(w => w.name.toLowerCase() === waifuData.name.toLowerCase());
        const carpeta = esEspecial ? 'waifus especiales' : 'waifus';
        const imagenBuffer = obtenerImagenBuffer(carpeta, waifuData.file);
        
        const caption = `🎁 *REGALO DE ADMIN*\n\n✨ @${bareID} recibió a: *${waifuData.name}*`;

        if (imagenBuffer) {
            await conn.sendMessage(m.chat, { image: imagenBuffer, caption, mentions: [idReal] }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, { text: caption, mentions: [idReal] }, { quoted: m });
        }

    } catch (e) {
        console.error("Error crítico en regalo:", e);
        m.reply('❌ Error al procesar el regalo.');
    }
};

handler.command = /^(regalo)$/i;
export default handler;
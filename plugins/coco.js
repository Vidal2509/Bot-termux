import fs from 'fs';
import { join } from 'path';

const handler = async (m, { conn }) => {
    const pathMatrimonios = join(process.cwd(), 'database', 'matrimonios.json');
    if (!fs.existsSync(pathMatrimonios)) return m.reply('❌ No existe la base de datos.');

    try {
        let data = JSON.parse(fs.readFileSync(pathMatrimonios, 'utf-8'));
        const ahora = Date.now();
        const tiempoCooldown = 5 * 60 * 1000; 

        // --- PROTECCIÓN LÍNEA 14 (SENDER) ---
        const sender = m.sender || m.key?.participant || '';
        if (!sender) return; // Si no hay sender, ignoramos para evitar el crash

        const bareSender = sender.split('@')[0];
        let idEmisor = Object.keys(data.usuarios).find(key => key && key.split('@')[0] === bareSender);
        
        if (!idEmisor) return m.reply('❌ No estás registrado en el sistema de matrimonios.');

        // 2. Detectar objetivo
        let who = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
        if (!who) return m.reply(`🥥 *Etiqueta a alguien!*`);

        // 3. Verificar si la VÍCTIMA existe en la DB
        const bareVictima = who.split('@')[0];
        let idRealVictima = Object.keys(data.usuarios).find(key => key && key.split('@')[0] === bareVictima);
        
        if (!idRealVictima) return m.reply('❌ Esa persona no está registrada.');

        // 4. Validación de Cooldown
        if (data.usuarios[idEmisor].cooldownCoco) {
            const tiempoPasado = ahora - data.usuarios[idEmisor].cooldownCoco;
            if (tiempoPasado < tiempoCooldown) {
                const restante = Math.ceil((tiempoCooldown - tiempoPasado) / 1000 / 60);
                return m.reply(`⏳ Cooldown: ${restante} min.`);
            }
        }

        const azar = Math.floor(Math.random() * 100) + 1;
        data.usuarios[idEmisor].cooldownCoco = ahora;

        let victima = who;
        let mensaje = "";
        let infoWaifus = "";

        // ===== LÓGICA DE EVENTOS =====
        if (azar <= 5) {
            const quitadas = quitarWaifus(data, victima, 10);
            mensaje = `🥇 ¡COCO DORADO! @${victima.split('@')[0]} recibió un impacto crítico.`;
            infoWaifus = quitadas.length > 0 ? `\n💔 *Perdió 10 waifus:* ${quitadas.join(', ')}` : `\n🤕 No tenía waifus.`;
        }
        else if (azar <= 12) {
            const quitadas = quitarWaifus(data, victima, 9999);
            mensaje = `💣 ¡COCO BOMBA! @${victima.split('@')[0]} perdió todo.`;
            infoWaifus = quitadas.length > 0 ? `\n💀 *Perdió TODAS:* ${quitadas.join(', ')}` : `\n💨 Sin waifus que perder.`;
        }
        else if (azar <= 22) {
            fs.writeFileSync(pathMatrimonios, JSON.stringify(data, null, 2));
            return m.reply('💤 El bot ignoró el coco.');
        }
        else if (azar <= 40) {
            fs.writeFileSync(pathMatrimonios, JSON.stringify(data, null, 2));
            return m.reply('💨 ¡Fallaste!');
        }
        else if (azar <= 60) {
            victima = m.sender;
            const quitadas = quitarWaifus(data, victima, 3);
            mensaje = `🔙 ¡Rebotó! Te diste a ti mismo @${victima.split('@')[0]}`;
            infoWaifus = quitadas.length > 0 ? `\n💔 *Perdiste 3:* ${quitadas.join(', ')}` : `\n🤕 Sin waifus.`;
        }
        else {
            const quitadas = quitarWaifus(data, victima, 3);
            mensaje = `🎯 ¡Directo en la cabeza de @${victima.split('@')[0]}!`;
            infoWaifus = quitadas.length > 0 ? `\n💔 *Perdió 3:* ${quitadas.join(', ')}` : `\n🤕 Sin waifus.`;
        }

        fs.writeFileSync(pathMatrimonios, JSON.stringify(data, null, 2));
        await conn.sendMessage(m.chat, { text: mensaje + infoWaifus, mentions: [victima] }, { quoted: m });

    } catch (e) {
        console.error("Error en coco.js:", e);
    }
};

function quitarWaifus(data, victima, cantidad) {
    if (!victima) return [];
    const bareVictima = victima.split('@')[0];
    let idRealVictima = Object.keys(data.usuarios).find(key => key && key.split('@')[0] === bareVictima);
    let nombresQuitados = [];

    if (idRealVictima && data.usuarios[idRealVictima].esposas?.length > 0) {
        for (let i = 0; i < cantidad; i++) {
            if (data.usuarios[idRealVictima].esposas.length > 0) {
                let index = Math.floor(Math.random() * data.usuarios[idRealVictima].esposas.length);
                let eliminada = data.usuarios[idRealVictima].esposas.splice(index, 1);
                nombresQuitados.push(eliminada[0]);
            }
        }
    }
    return nombresQuitados;
}

handler.command = /^(coco)$/i;
handler.group = true;
export default handler;
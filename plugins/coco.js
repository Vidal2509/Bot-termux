import fs from 'fs';
import { join } from 'path';

const handler = async (m, { conn }) => {
    const pathMatrimonios = join(process.cwd(), 'database', 'matrimonios.json');
    if (!fs.existsSync(pathMatrimonios)) return m.reply('❌ No existe la base de datos.');

    // Extrae solo los números antes del @ o cualquier carácter especial
    const obtenerSoloNumero = (jid) => {
        if (!jid || typeof jid !== 'string') return '';
        return jid.split('@')[0].replace(/[^0-9]/g, ''); // Deja solo los dígitos numéricos
    };

    try {
        let data = JSON.parse(fs.readFileSync(pathMatrimonios, 'utf-8'));
        const ahora = Date.now();
        const tiempoCooldown = 5 * 60 * 1000; 

        // 1. Identificar al emisor
        const sender = m.sender || m.key?.participant || '';
        const numeroSender = obtenerSoloNumero(sender);
        
        if (!numeroSender) return; 

        // Buscar la clave exacta en el JSON que coincida con el número del emisor
        let idEmisor = Object.keys(data.usuarios).find(key => obtenerSoloNumero(key) === numeroSender);
        

        if (!idEmisor) return m.reply('❌ No estás registrado en el sistema de matrimonios.');

        // 2. Detectar objetivo
        let who = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null);
        if (!who) return m.reply(`🥥 *Etiqueta a alguien!*`);

        const numeroVictima = obtenerSoloNumero(who);
        let idRealVictima = Object.keys(data.usuarios).find(key => obtenerSoloNumero(key) === numeroVictima);
        
        if (!idRealVictima) return m.reply('❌ Esa persona no está registrada en el sistema de matrimonios.');

        // 4. Validación de Cooldown usando la ID exacta del JSON
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
            const quitadas = quitarWaifus(data, idRealVictima, 10);
            mensaje = `🥇 ¡COCO DORADO! @${numeroVictima} recibió un impacto crítico.`;
            infoWaifus = quitadas.length > 0 ? `\n💔 *Perdió 10 waifus:* ${quitadas.join(', ')}` : `\n🤕 No tenía waifus.`;
        }
        else if (azar <= 12) {
            const quitadas = quitarWaifus(data, idRealVictima, 9999);
            mensaje = `💣 ¡COCO BOMBA! @${numeroVictima} perdió todo.`;
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
            // Si rebota, la víctima pasa a ser el propio emisor
            const quitadas = quitarWaifus(data, idEmisor, 3);
            mensaje = `🔙 ¡Rebotó! Te diste a ti mismo @${numeroSender}`;
            infoWaifus = quitadas.length > 0 ? `\n💔 *Perdiste 3:* ${quitadas.join(', ')}` : `\n🤕 Sin waifus.`;
        }
        else {
            const quitadas = quitarWaifus(data, idRealVictima, 3);
            mensaje = `🎯 ¡Directo en la cabeza de @${numeroVictima}!`;
            infoWaifus = quitadas.length > 0 ? `\n💔 *Perdió 3:* ${quitadas.join(', ')}` : `\n🤕 Sin waifus.`;
        }

        fs.writeFileSync(pathMatrimonios, JSON.stringify(data, null, 2));
        
        const mencionesValidas = (victima && typeof victima === 'string') ? [victima] : [];

        await conn.sendMessage(m.chat, { 
            text: mensaje + infoWaifus, 
            mentions: mencionesValidas 
        }, { quoted: m });

    } catch (e) {
        console.error("Error en coco.js:", e);
    }
};

// Modificada para recibir directamente la ID real encontrada del JSON
function quitarWaifus(data, idRealVictima, cantidad) {
    let nombresQuitados = [];

    if (idRealVictima && data.usuarios[idRealVictima]?.esposas?.length > 0) {
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
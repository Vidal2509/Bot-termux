import fs from 'fs';
import { join } from 'path';

// Función auxiliar para pausar el código (1000 milisegundos = 1 segundo)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handler = async (m, { conn }) => {
    // --- FILTRO DE SEGURIDAD EXCLUSIVO PARA TI ---
    const miNumeroFiel = '280139359338689';
    const sender = m.sender || m.key.participant || '';
    const senderNumber = sender.replace(/\D/g, ''); // Deja solo los números puros

    // Si el número de quien ejecuta no coincide con el tuyo, el bot no hace nada
    if (!senderNumber.includes(miNumeroFiel)) return;

    const esGrupo = m.chat.endsWith('@g.us');
    if (!esGrupo) return m.reply('*⚠️ Este comando solo es para grupos.*');

    try {
        const pathMatrimonios = join(process.cwd(), 'database', 'matrimonios.json');
        if (!fs.existsSync(pathMatrimonios)) return m.reply('❌ No existe la base de datos de matrimonios.');
        
        let data = JSON.parse(fs.readFileSync(pathMatrimonios, 'utf-8'));

        // --- INICIA LA CUENTA REGRESIVA ---
        await m.reply('🚀 *¡BOMBA ATÓMICA LANZADA POR EL ADMINISTRADOR SUPREMO!* 🚀\n_¡Corran por sus vidas!_');
        await delay(1000);
        
        await conn.sendMessage(m.chat, { text: '☢️ *3...*' }, { quoted: m });
        await delay(1000);
        
        await conn.sendMessage(m.chat, { text: '☢️ *2...*' }, { quoted: m });
        await delay(1000);
        
        await conn.sendMessage(m.chat, { text: '☢️ *1...*' }, { quoted: m });
        await delay(1000);
        
        await conn.sendMessage(m.chat, { text: '💥 *¡BOOOOOOM!* 💥\n_La radiación está destruyendo matrimonios..._' }, { quoted: m });
        await delay(500);

        // --- LÓGICA DE SELECCIÓN DE VÍCTIMAS ---
        let todosLosUsuarios = Object.keys(data.usuarios);

        if (todosLosUsuarios.length === 0) {
            return m.reply('🍃 *La bomba no afectó a nadie porque no hay usuarios registrados en la base de datos.*');
        }

        // Mezclamos la lista de usuarios al azar y tomamos máximo 3
        let victimasId = todosLosUsuarios.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        let reporteFinal = `☢️ *REPORTE DE DAÑOS ATÓMICOS* ☢️\n\n`;
        let listaMentions = [];

        victimasId.forEach((jid) => {
            let usuarioData = data.usuarios[jid];
            let nombreVictima = usuarioData.nombre || 'Usuario';
            listaMentions.push(jid);

            reporteFinal += `👤 *${nombreVictima}* (@${jid.split('@')[0]}):\n`;

            if (!usuarioData.esposas || usuarioData.esposas.length === 0) {
                reporteFinal += `   └ 🛡️ _¡Milagro! No tenía waifus, la radiación no le hizo nada._\n\n`;
            } else {
                let waifusEliminadas = [];
                
                // Quitamos máximo 2 waifus
                for (let i = 0; i < 2; i++) {
                    if (usuarioData.esposas.length > 0) {
                        let waifuQuitada = usuarioData.esposas.shift(); 
                        waifusEliminadas.push(waifuQuitada);
                    }
                }

                reporteFinal += `   └ 💔 *Perdió a:* ${waifusEliminadas.map(w => `_"${w}"_`).join(' y ')}\n\n`;
            }
        });

        // --- GUARDAR CAMBIOS EN EL JSON ---
        fs.writeFileSync(pathMatrimonios, JSON.stringify(data, null, 2), 'utf-8');

        reporteFinal += `_💡 Las waifus afectadas han sido desintegradas por completo._`;
        await conn.sendMessage(m.chat, { text: reporteFinal, mentions: listaMentions }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply("*❌ Hubo un error al detonar la bomba.*");
    }
};

handler.command = /^(atomica|bomba|nuclear)$/i;
export default handler;
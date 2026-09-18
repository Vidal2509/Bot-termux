import fs from 'fs';
import path from 'path';

const dataPath = './database/matrimonios.json';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handler = async (m, { conn }) => {
    const esGrupo = m.chat.endsWith('@g.us');
    if (!esGrupo) return m.reply('*⚠️ Este comando solo es para grupos.*');

    // 🔒 RESTRICCIÓN DE OWNER
    const senderID = m.participant || m.key.participant || m.sender || m.remoteJid;
    const numeroLimpio = senderID.split('@')[0];
    const miIDAutorizado = '280139359338689';

    if (numeroLimpio !== miIDAutorizado) {
        return m.reply('❌ Este comando solo puede ser ejecutado por el creador del bot.');
    }

    if (!fs.existsSync(dataPath)) return m.reply('📑 No hay registros de matrimonios.');
    let db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Filtramos únicamente a los usuarios que SÍ tengan al menos una esposa en su harem
    const usuariosConEsposas = Object.keys(db.usuarios || {}).filter(id => {
        return db.usuarios[id].esposas && db.usuarios[id].esposas.length > 0;
    });

    if (usuariosConEsposas.length === 0) {
        return m.reply('⚠️ Nadie en la base de datos tiene waifus registradas para maldecir.');
    }

    // Seleccionamos hasta 5 personas al azar que tengan esposas (o las que haya disponibles si son menos de 5)
    const cantidadAfectados = Math.min(5, usuariosConEsposas.length);
    const seleccionados = usuariosConEsposas.sort(() => 0.5 - Math.random()).slice(0, cantidadAfectados);

    await m.reply('💀 *¡El dios oscuro ha lanzado la MALDICIÓN! Arrebatando esposas...*');

    for (let i = 0; i < seleccionados.length; i++) {
        const userID = seleccionados[i];
        const usuarioData = db.usuarios[userID];
        const nombreUsuario = usuarioData.nombre || 'Desafortunado/a';

        // Elegimos una esposa al azar de su lista y se la quitamos (.splice)
        const indexEsposa = Math.floor(Math.random() * usuarioData.esposas.length);
        const esposaQuitada = usuarioData.esposas.splice(indexEsposa, 1)[0];

        // Se usa @usuario limpio para que WhatsApp haga la mención interactiva sin mostrar el número en texto plano
        const mensajeMaldicion = `⚡ *¡MALDICIÓN DIVINA #${i + 1}!* ⚡\n\n👤 Víctima: *${nombreUsuario}* (@${userID.split('@')[0]})\n💔 El destino ha sido cruel: Ha perdido a su esposa **${esposaQuitada}**.\n\n_¡Se ha quedado soltera de nuevo y ha abandonado su harem!_`;

        await conn.sendMessage(m.chat, { text: mensajeMaldicion, mentions: [userID] }, { quoted: m });

        // ⏱️ Esperamos 2 segundos entre cada maldición
        if (i < seleccionados.length - 1) {
            await sleep(2000);
        }
    }

    // Guardamos los cambios actualizados en el JSON
    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
    await m.reply('🖤 *¡La purga de maldiciones ha terminado!*');
};

handler.command = /^maldicion$/i;
export default handler;
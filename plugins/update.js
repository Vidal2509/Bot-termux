import { exec } from 'child_process';

const handler = async (m, { conn }) => {
    // --- SEGURIDAD ---
    const miNumeroFiel = '280139359338689';
    const emisor = m.key.participant || m.key.remoteJid || '';

    if (!emisor.includes(miNumeroFiel)) {
        return m.reply('❌ No tienes permisos para actualizar el sistema.');
    }

    await m.reply('🚀 *Iniciando actualización desde GitHub...*');

    // Ejecutamos git pull
    exec('git pull', (err, stdout, stderr) => {
        if (err) {
            return m.reply(`❌ *Error al actualizar:* \n${err.message}`);
        }
        
        if (stdout.includes('Already up to date')) {
            return m.reply('✅ *El bot ya está actualizado con la última versión de GitHub.*');
        }

        // Si hubo cambios, avisamos y mostramos lo que se actualizó
        let mensaje = `✅ *Actualización exitosa:*\n\n\`\`\`${stdout}\`\`\``;
        mensaje += '\n\n*Nota:* Si cambiaste el index.js o instalaste librerías, es recomendable reiniciar el bot desde la consola.';
        
        m.reply(mensaje);
    });
};

handler.command = /^(update|actualizar|gitpull)$/i;

export default handler;
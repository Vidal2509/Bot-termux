const handler = async (m, { conn }) => {
    // --- CONFIGURACIÓN DE SEGURIDAD ---
    const miNumero = '5218123334062@s.whatsapp.net'; // 👈 REEMPLAZA ESTO CON TU NÚMERO REAL
    const emisor = m.key.participant || m.key.remoteJid;

    // Verificar si el que envía el mensaje eres tú
    if (emisor !== miNumero) {
        return m.reply('❌ *Acceso denegado.* Solo mi creador puede realizar esta acción.');
    }

    // --- PROCESO DE DEPURACIÓN ---
    await m.reply('♻️ *Depurando sistema y limpiando consola...*');

    // Limpia la pantalla física de Termux o PC
    console.clear();

    console.log('\n' + '═'.repeat(40));
    console.log('🛡️  SISTEMA DEPURADO POR EL DUEÑO');
    console.log(`👤 Usuario: ${m.pushName || 'Creador'}`);
    console.log(`⏰ Hora: ${new Date().toLocaleString()}`);
    console.log('═'.repeat(40) + '\n');

    // Limpieza de caché de módulos (para que el bot sea más ligero)
    Object.keys(import.meta.cache || {}).forEach(key => {
        delete import.meta.cache[key];
    });

    await m.reply('✅ *Consola limpia y sistema refrescado con éxito.*');
};

handler.command = /^(reinicio|depurar|clear|clean)$/i;

export default handler;
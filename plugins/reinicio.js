const handler = async (m, { conn }) => {
    // --- CONFIGURACIÓN DE SEGURIDAD ---
    // Pon solo los números, sin el @s.whatsapp.net ni el "1" extra si lo tiene
    const miNumeroFiel = '280139359338689';
    
    // Extraemos el emisor de forma segura
    const emisor = m.key.participant || m.key.remoteJid || '';
    
    // ESTO MOSTRARÁ EN TU CONSOLA EL ID REAL PARA QUE LO COPIES
    console.log('ID detectado del emisor:', emisor);

    // Verificamos si tu número está incluido en el ID del emisor
    if (!emisor.includes(miNumeroFiel)) {
        return m.reply('❌ *Acceso denegado.* Solo mi creador puede realizar esta acción.');
    }

    // --- PROCESO DE DEPURACIÓN ---
    await m.reply('♻️ *Depurando sistema y limpiando consola...*');

    console.clear();
    console.log('\n' + '═'.repeat(40));
    console.log('🛡️  SISTEMA DEPURADO POR EL DUEÑO');
    console.log(`👤 Usuario: ${m.pushName || 'Creador'}`);
    console.log('═'.repeat(40) + '\n');

    // Limpieza de caché
    Object.keys(import.meta.cache || {}).forEach(key => {
        delete import.meta.cache[key];
    });

    await m.reply('✅ *Consola limpia y sistema refrescado.*');
};

handler.command = /^(reinicio|depurar|clear|clean)$/i;

export default handler;
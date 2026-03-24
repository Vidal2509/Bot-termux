import fs from 'fs';
import { join } from 'path';

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const miNumeroFiel = '280139359338689';
    const sender = m.sender || m.key.participant || '';
    const senderNumber = sender.replace(/\D/g, '');

    // 1. Seguridad: Solo tú (Peter) puedes borrar registros
    if (!senderNumber.includes(miNumeroFiel)) return;

    if (!text) return m.reply(`🎤 *Uso correcto:*\n${usedPrefix + command} Nombre del Usuario\n\n_Ejemplo: ${usedPrefix + command} owo_`);

    try {
        const pathMatrimonios = join(process.cwd(), 'database', 'matrimonios.json');
        if (!fs.existsSync(pathMatrimonios)) return m.reply('❌ No se encontró la base de datos.');

        let data = JSON.parse(fs.readFileSync(pathMatrimonios, 'utf-8'));
        const nombreABuscar = text.toLowerCase().trim();
        
        // 2. Buscar el ID del usuario por su nombre en el JSON
        const idUsuario = Object.keys(data.usuarios).find(id => 
            data.usuarios[id].nombre && data.usuarios[id].nombre.toLowerCase() === nombreABuscar
        );

        if (!idUsuario) {
            return m.reply(`❌ No encontré a ningún usuario registrado con el nombre: *${text}*`);
        }

        const usuarioInfo = data.usuarios[idUsuario];
        const cantidadWaifus = usuarioInfo.esposas ? usuarioInfo.esposas.length : 0;
        const nombreReal = usuarioInfo.nombre;

        // 3. ELIMINACIÓN
        // Al borrar al usuario del objeto 'usuarios', sus waifus dejan de estar asociadas a él
        // Por lo tanto, vuelven a estar "libres" para el comando .matematicas o .claim
        delete data.usuarios[idUsuario];

        // 4. Guardar cambios
        fs.writeFileSync(pathMatrimonios, JSON.stringify(data, null, 2));

        const mensaje = `🗑️ *USUARIO ELIMINADO*\n\n✅ Se ha borrado a: *${nombreReal}*\n✨ Waifus liberadas: *${cantidadWaifus}*\n\n_Ahora estas waifus pueden ser obtenidas por otros usuarios._`;
        
        await m.reply(mensaje);

    } catch (e) {
        console.error(e);
        m.reply('❌ Error al intentar borrar al usuario.');
    }
};

handler.command = /^(borrar)$/i;

export default handler;
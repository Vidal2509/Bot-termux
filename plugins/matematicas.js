import fs from 'fs';
import { join, readdirSync } from 'path';

if (!global.juegosMatematicos) global.juegosMatematicos = {};

// Función para buscar imagen ignorando mayúsculas/minúsculas
const obtenerImagenBuffer = (carpeta, nombreArchivo) => {
    const rutaCarpeta = join(process.cwd(), carpeta);
    if (!fs.existsSync(rutaCarpeta)) return null;
    
    const archivos = fs.readdirSync(rutaCarpeta);
    // Buscamos el archivo real comparando ambos en minúsculas
    const coincidencia = archivos.find(f => f.toLowerCase() === nombreArchivo.toLowerCase());
    
    return coincidencia ? fs.readFileSync(join(rutaCarpeta, coincidencia)) : null;
};

const handler = async (m, { conn, command, text }) => {
    const miNumeroFiel = '280139359338689';
    const sender = m.sender || m.key.participant || '';
    const senderNumber = sender.replace(/\D/g, '');

    if (command === 'matematicas') {
        if (!senderNumber.includes(miNumeroFiel)) return m.reply('❌ Solo mi creador puede iniciar el reto.');
        if (global.juegosMatematicos[m.chat]) return m.reply('⚠️ Ya hay un reto activo.');

        const ops = ['+', '-', '*'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        const n1 = Math.floor(Math.random() * 401);
        const n2 = Math.floor(Math.random() * 401);

        const operacion = `${n1} ${op} ${n2}`;
        const resultado = eval(operacion).toString();

        global.juegosMatematicos[m.chat] = {
            resultado,
            tiempo: setTimeout(() => {
                if (global.juegosMatematicos[m.chat]) {
                    conn.sendMessage(m.chat, { text: `⏰ Tiempo agotado. La respuesta era: *${resultado}*` });
                    delete global.juegosMatematicos[m.chat];
                }
            }, 60000)
        };

        return m.reply(`🧮 *RETO MATEMÁTICO*\n\n¿Cuánto es: *${operacion}*?\n\n👉 Responde con: *.respuesta [número]*`);
    }

    if (command === 'respuesta') {
        const juego = global.juegosMatematicos[m.chat];
        if (!juego) return;

        const respuestaUser = text?.trim();
        if (!respuestaUser) return m.reply('Debes poner el número del resultado.');

        if (respuestaUser === juego.resultado) {
            clearTimeout(juego.tiempo);
            const user = m.sender || m.key.participant || m.chat;

            try {
                // 1. Cargar lista de waifus
                const pathWaifus = join(process.cwd(), 'waifus.js');
                const waifusURL = `file://${pathWaifus.replace(/\\/g, '/')}`;
                const { default: waifus } = await import(`${waifusURL}?update=${Date.now()}`);

                // 2. Cargar base de datos
                const pathMatrimonios = join(process.cwd(), 'database', 'matrimonios.json');
                let data = { usuarios: {} };

                if (fs.existsSync(pathMatrimonios)) {
                    data = JSON.parse(fs.readFileSync(pathMatrimonios, 'utf-8'));
                }

                if (!data.usuarios[user]) {
                    data.usuarios[user] = { nombre: m.pushName || 'Usuario', esposas: [], cooldown: 0 };
                }

                // 3. Filtrar solteras (comparación segura)
                const misEsposas = data.usuarios[user].esposas.map(e => (typeof e === 'string' ? e.toLowerCase() : ""));
                const disponibles = waifus.filter(w => !misEsposas.includes(w.name.toLowerCase()));

                if (disponibles.length === 0) {
                    delete global.juegosMatematicos[m.chat];
                    return m.reply('✨ ¡Ya tienes todas las waifus de la colección!');
                }

                const waifu = disponibles[Math.floor(Math.random() * disponibles.length)];
                
                // 4. Guardar
                data.usuarios[user].esposas.push(waifu.name);
                fs.writeFileSync(pathMatrimonios, JSON.stringify(data, null, 2));

                const tag = user.split('@')[0];
                const caption = `🎉 ¡Correcto @${tag}!\n\n✨ *Nueva Waifu:* ${waifu.name}\n📺 *Anime:* ${waifu.anime}`;
                
                // 5. Búsqueda de imagen INSENSIBLE a mayúsculas
                const imagenBuffer = obtenerImagenBuffer('waifus', waifu.file);

                if (imagenBuffer) {
                    await conn.sendMessage(m.chat, { 
                        image: imagenBuffer, 
                        caption, 
                        mentions: [user] 
                    }, { quoted: m });
                } else {
                    await conn.sendMessage(m.chat, { text: caption, mentions: [user] }, { quoted: m });
                }

            } catch (e) {
                console.error(e);
                m.reply('❌ Error al procesar el premio.');
            }

            delete global.juegosMatematicos[m.chat];
        } else {
            m.reply('❌ Respuesta incorrecta.');
        }
    }
};

handler.command = /^(matematicas|respuesta)$/i;

export default handler;
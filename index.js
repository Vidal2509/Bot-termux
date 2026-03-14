import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { join } from 'path';
import { readdirSync } from 'fs';
import './config.js';

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('MysticSession');
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Windows', 'Chrome', '1.1.0']
    });

   conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // 1. Mostrar el QR de forma clara
    if (qr) {
        console.clear(); // Limpia la consola para que el QR se vea bien
        console.log('-------------------------------------------');
        console.log('📢 ESCANEA EL SIGUIENTE CÓDIGO QR');
        console.log('-------------------------------------------');
        qrcode.generate(qr, { small: true });
        console.log('-------------------------------------------');
    }

    // 2. Manejo inteligente de desconexiones
    if (connection === 'close') {
        const shouldReconnect = (new Boom(lastDisconnect?.error))?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log('⚠️ Conexión cerrada. ¿Reintentando?:', shouldReconnect);

        if (shouldReconnect) {
            // Si el error es por "tiempo de espera" o "conflicto", esperamos un poco más
            const delay = lastDisconnect?.error?.output?.statusCode === DisconnectReason.restartRequired ? 1000 : 5000;
            setTimeout(() => iniciarBot(), delay);
        }
    } else if (connection === 'open') {
        console.log('\n✅ ¡BOT CONECTADO CON ÉXITO!\n');
    }
});

    conn.ev.on('creds.update', saveCreds);

    const pluginsDir = join(process.cwd(), 'plugins');
    const pluginFiles = readdirSync(pluginsDir).filter(file => file.endsWith('.js'));

    conn.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        m.chat = m.key.remoteJid;
        const prefix = '.'; 

        m.reply = (text) => conn.sendMessage(m.chat, { text }, { quoted: m });
        m.download = async () => {
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
            let type = Object.keys(quoted)[0];
            if (type === 'messageContextInfo') type = Object.keys(quoted)[1];
            const mediaMsg = quoted[type];
            if (!mediaMsg || !mediaMsg.mimetype) return null;
            const stream = await downloadContentFromMessage(mediaMsg, type.replace('Message', ''));
            let b = Buffer.from([]);
            for await (const c of stream) b = Buffer.concat([b, c]);
            return b;
        };

        const texto = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";

        const isGroup = m.chat.endsWith('@g.us');
        const botNumber = conn.user.id.split(':')[0];
        const estaMencionado = texto.includes(`@${botNumber}`);
        const tienePrefijo = texto.startsWith(prefix);

        if (isGroup && !tienePrefijo && !estaMencionado) return;

        const args = tienePrefijo ? texto.slice(prefix.length).trim().split(/ +/) : texto.trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const text = args.join(' ');

        for (const file of pluginFiles) {
            try {
                const pluginPath = join(pluginsDir, file);
                const pluginURL = `file://${pluginPath.replace(/\\/g, '/')}`;
                const plugin = await import(`${pluginURL}?update=${Date.now()}`);

                if (plugin.default.command && plugin.default.command.test(commandName)) {
                    await plugin.default(m, { conn, texto, command: commandName, args, text, usedPrefix: prefix });
                } else if (plugin.default.before) {
                    await plugin.default.before(m, { conn, texto, isGroup });
                }
            } catch (e) {
                console.error(`❌ Error en plugin ${file}:`, e);
            }
        }
    });

    // --- ESTE ES EL BLOQUE QUE FALTABA ---
    conn.ev.on('group-participants.update', async (anu) => {
        try {
            let metadata = await conn.groupMetadata(anu.id);
            let participantes = anu.participants;
            for (let num of participantes) {
                let userTag = num.split('@')[0];
                if (anu.action == 'add') {
                    let saludo = `🌟 ¡Bienvenido/a @${userTag}!\n📍 Grupo: *${metadata.subject}*`;
                    await conn.sendMessage(anu.id, { text: saludo, mentions: [num] });
                } else if (anu.action == 'remove') {
                    let despedida = `👋 Adiós @${userTag}, ¡esperamos que vuelvas pronto!`;
                    await conn.sendMessage(anu.id, { text: despedida, mentions: [num] });
                }
            }
        } catch (e) { console.error('❌ Error en eventos de grupo:', e); }
    });
}

iniciarBot().catch(err => console.error("Error crítico:", err));
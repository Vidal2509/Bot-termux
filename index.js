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

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('\n📢 ESCANEA EL QR:\n');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (code !== DisconnectReason.loggedOut) setTimeout(() => iniciarBot(), 3000);
        } else if (connection === 'open') {
            console.log('\n✅ ¡BOT CONECTADO!\n');
        }
    });

    conn.ev.on('creds.update', saveCreds);

    const pluginsDir = join(process.cwd(), 'plugins');
    const pluginFiles = readdirSync(pluginsDir).filter(file => file.endsWith('.js'));

    conn.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        m.chat = m.key.remoteJid;
        
        // --- FUNCIÓN DE DESCARGA UNIVERSAL (CORREGIDA) ---
        m.download = async () => {
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
            const context = m.message.extendedTextMessage?.contextInfo;
            
            // Buscamos el mensaje real (ya sea citado o directo)
            const msg = quoted ? quoted : m.message;
            
            // Detectamos qué tipo de archivo es
            let type = Object.keys(msg)[0];
            if (type === 'messageContextInfo') type = Object.keys(msg)[1];
            
            const mediaMsg = msg[type];
            if (!mediaMsg || !mediaMsg.mimetype) return null;

            // Detectamos el tipo para Baileys (image, video, audio, document)
            const downloadType = type.replace('Message', '');
            
            const stream = await downloadContentFromMessage(mediaMsg, downloadType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return buffer;
        };

        const texto = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
        const prefix = '.';
        if (!texto.startsWith(prefix)) return;

        const args = texto.trim().split(/ +/).slice(1);
        const commandName = texto.slice(prefix.length).trim().split(' ')[0].toLowerCase();
        const text = args.join(' ');

        for (const file of pluginFiles) {
            try {
                const pluginPath = join(pluginsDir, file);
                const pluginURL = `file://${pluginPath.replace(/\\/g, '/')}`;
                const plugin = await import(`${pluginURL}?update=${Date.now()}`);

                if (plugin.default.command.test(commandName)) {
                    await plugin.default(m, { conn, texto, command: commandName, args, text });
                    
                }
            } catch (e) {
                console.error(`❌ Error en plugin ${file}:`, e);
            }
        }
    });

    conn.ev.on('group-participants.update', async (anu) => {
        try {
            let metadata = await conn.groupMetadata(anu.id);
            let participantes = anu.participants;
            for (let num of participantes) {
                let jid = typeof num === 'string' ? num : num.id;
                let userTag = jid.split('@')[0];
                if (anu.action == 'add') {
                    let saludo = `🌟 ¡Bienvenido/a @${userTag}!\n📍 Grupo: *${metadata.subject}*`;
                    await conn.sendMessage(anu.id, { text: saludo, mentions: [jid] });
                } else if (anu.action == 'remove') {
                    let despedida = `👋 Adiós @${userTag}, ¡esperamos que vuelvas pronto!`;
                    await conn.sendMessage(anu.id, { text: despedida, mentions: [jid] });
                }
            }
        } catch (e) { console.error('❌ Error en eventos de grupo:', e); }
    });
}

iniciarBot().catch(err => console.error("Error crítico:", err));

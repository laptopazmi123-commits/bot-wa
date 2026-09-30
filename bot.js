const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const readline = require('readline');

// ========== KONFIGURASI ==========
const CONFIG = {
    // GANTI dengan nomor WhatsApp Bot (angka saja, tanpa + atau -)
    phoneNumber: '6285758524193',
    sessionPath: './wa-session',
    botName: 'Zimzz-AI',
    prefix: '.',
};

// ========== STATE ==========
let sock;

// ========== FUNGSI UTAMA ==========

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(CONFIG.sessionPath);

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: [CONFIG.botName, 'Chrome', '1.0.0'],
    });

    // --- Event: Pairing Code ---
    if (!sock.authState.creds.registered) {
        console.log(`\n[${CONFIG.botName}] Meminta kode pairing...\n`);
        try {
            const code = await sock.requestPairingCode(CONFIG.phoneNumber);
            console.log('====================================');
            console.log(`  KODE PAIRING: ${code}`);
            console.log('====================================');
            console.log('Buka WhatsApp > Perangkat Tertaut > Tautkan dengan Nomor Telepon\n');
        } catch (error) {
            console.error('Gagal meminta kode pairing:', error.message);
            console.log('Pastikan nomor sudah benar dan koneksi internet stabil.');
        }
    }

    // --- Event: Koneksi Update ---
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode
                : 0;

            // Jangan reconnect jika logged out
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log('Koneksi terputus, mencoba menyambung ulang...');
                startBot();
            } else {
                console.log('Bot logout. Hapus folder wa-session dan pairing ulang.');
            }
        } else if (connection === 'open') {
            console.log(`\n✓ ${CONFIG.botName} sudah terhubung ke WhatsApp!\n`);
        }
    });

    sock.ev.on('creds.update', saveCreds);
    return sock;
}

// ========== FITUR GROUP ==========

async function kickMember(msg) {
    if (!msg.isGroup) return msg.reply('Command ini hanya untuk di grup.');
    if (!msg.quoted) return msg.reply('Balas pesan orang yang ingin dikeluarkan.');
    try {
        await sock.groupParticipantsUpdate(msg.from, [msg.quoted.sender], 'remove');
        await msg.reply('✅ Berhasil dikeluarkan dari grup.');
    } catch (e) {
        await msg.reply('❌ Gagal kick: ' + e.message);
    }
}

async function createGroup(args) {
    if (args.length === 0) return 'Format: .newgroup Nama Grup';
    try {
        const result = await sock.groupCreate(args.join(' '), []);
        return `✅ Grup "${args.join(' ')}" berhasil dibuat.`;
    } catch (e) {
        return '❌ Gagal membuat grup: ' + e.message;
    }
}

async function getGroupLink(msg) {
    if (!msg.isGroup) return msg.reply('Command ini hanya untuk di grup.');
    try {
        const code = await sock.groupInviteCode(msg.from);
        return `🔗 Link grup:\nhttps://chat.whatsapp.com/${code}`;
    } catch (e) {
        return '❌ Gagal mengambil link. Pastikan bot adalah admin grup.';
    }
}

// ========== FITUR MEDIA ==========

async function revealViewOnce(msg) {
    if (!msg.quoted) return 'Balas media "sekali lihat" dengan command .rvo';

    // Ambil objek pesan yang di-quote
    const quoted = msg.quoted;
    const messageContent = quoted.message;
    if (!messageContent) return '❌ Tidak bisa membaca pesan yang dibalas.';

    // Cari konten view-once di dalam wrapper pesan
    const viewOnce =
        messageContent.viewOnceMessage?.message ||
        messageContent.viewOnceMessageV2?.message ||
        messageContent.viewOnceMessageV2Extension?.message;

    if (!viewOnce) return '❌ Pesan yang dibalas bukan media "sekali lihat".';

    // Download media dari konten view-once
    try {
        const buffer = await sock.downloadMediaMessage({
            message: viewOnce,
            key: quoted.key,
        });

        if (!buffer || buffer.length === 0) return '❌ Gagal mengunduh media.';

        // Kirim ulang sebagai media biasa
        if (viewOnce.imageMessage) {
            await sock.sendMessage(msg.from, {
                image: buffer,
                caption: viewOnce.imageMessage.caption || '✅ Foto berhasil dibuka.',
                mimetype: viewOnce.imageMessage.mimetype,
            }, { quoted: msg });
        } else if (viewOnce.videoMessage) {
            await sock.sendMessage(msg.from, {
                video: buffer,
                caption: viewOnce.videoMessage.caption || '✅ Video berhasil dibuka.',
                mimetype: viewOnce.videoMessage.mimetype,
            }, { quoted: msg });
        }
        return null; // Jangan balas teks tambahan
    } catch (e) {
        return '❌ Gagal membuka media: ' + e.message;
    }
}

// ========== MENU ==========

function showMenu() {
    return `╭━━━〔 🤖 *${CONFIG.botName}* 〕━━━╮

┃ 📌 *Fitur Grup*
┃ • .kick
┃   ↳ Balas pesan target, bot keluarkan
┃ • .newgroup <nama>
┃   ↳ Membuat grup baru
┃ • .sw
┃   ↳ Mengambil link undangan grup

┃ 📌 *Fitur Media*
┃ • .rvo
┃   ↳ Balas foto/video "sekali lihat"

┃ 📌 *Umum*
┃ • .menu
┃   ↳ Menampilkan menu ini

╰━━━━━━━━━━━━━━━━━━━━━━╯

_${CONFIG.botName} siap membantu 24 jam_ ✨`;
}

// ========== WELCOME MESSAGE ==========

function getWelcomeText(name) {
    const templates = [
        `╭━━━〔 🎉 *WELCOME* 〕━━━╮\n┃\n┃ Halo *${name}*! 👋\n┃ Selamat datang di grup ini.\n┃\n┃ 📜 Baca rules dulu ya\n┃ 🤝 Jangan sungkan kenalan\n┃ 🚫 No spam, no toxic\n┃\n┃ Semoga betah di sini! 🔥\n╰━━━━━━━━━━━━━━━━━━━━╯`,
        `✨ *SELAMAT DATANG* ✨\n\nHey *${name}*, welcome to the family! 🎊\n\n• Jaga sikap & bahasa\n• Saling menghormati\n• Stay aktif biar rame\n\nEnjoy your stay here! 🚀`,
        `🎊 *NEW MEMBER ALERT* 🎊\n\nNama: *${name}*\nStatus: Resmi jadi anggota 🫡\n\nSemoga betah, jangan lupa\nperkenalkan diri dulu ya! 👋🔥`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

// ========== ROUTING PESAN ==========

async function handleMessage(sock, msg) {
    if (msg.key.fromMe) return;

    const text = msg.body || '';
    if (!text.startsWith(CONFIG.prefix)) return;

    const [cmd, ...args] = text.slice(CONFIG.prefix.length).trim().split(/\s+/);
    const command = cmd.toLowerCase();

    // Helper untuk reply
    msg.reply = (t) => sock.sendMessage(msg.from, { text: t }, { quoted: msg });

    let response = null;

    switch (command) {
        case 'menu':
            response = showMenu();
            break;
        case 'kick':
            await kickMember(msg);
            return;
        case 'newgroup':
            response = await createGroup(args);
            break;
        case 'sw':
            response = await getGroupLink(msg);
            break;
        case 'rvo':
            response = await revealViewOnce(msg);
            break;
        default:
            response = 'Command tidak dikenal. Kirim .menu untuk melihat daftar fitur.';
    }

    if (response) await msg.reply(response);
}

// ========== EVENT LISTENER ==========

async function init() {
    const sock = await startBot();

    // Pesan Masuk
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        // Normalisasi pesan agar mudah diakses
        const normalizedMsg = {
            key: msg.key,
            message: msg.message,
            from: msg.key.remoteJid,
            isGroup: msg.key.remoteJid.endsWith('@g.us'),
            body: msg.message.conversation || msg.message.extendedTextMessage?.text || '',
            quoted: msg.message.extendedTextMessage?.contextInfo?.quotedMessage ? {
                message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
                key: {
                    remoteJid: msg.key.remoteJid,
                    id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: msg.message.extendedTextMessage.contextInfo.participant,
                },
                sender: msg.message.extendedTextMessage.contextInfo.participant,
            } : null,
        };

        await handleMessage(sock, normalizedMsg);
    });

    // Peserta Grup Update (Welcome)
    sock.ev.on('group-participants.update', async (update) => {
        if (update.action !== 'add') return;
        for (const jid of update.participants) {
            const name = jid.split('@')[0];
            await sock.sendMessage(update.id, { text: getWelcomeText(name) });
        }
    });
}

// ========== JALANKAN ==========
init().catch(err => console.error('Fatal error:', err));

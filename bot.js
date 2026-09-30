const FBaileys = require('f-baileys');

// ========== Konfigurasi ==========
const CONFIG = {
    phoneNumber: '628xxxxxxxxxx', // ← ganti ke nomor Bot kamu
    sessionPath: './wa-session',
    botName: 'Zimzz-AI',
};

// ========== Inisialisasi ==========
const bot = new FBaileys({
    sessionPath: CONFIG.sessionPath,
    usePairingCode: true,
    phoneNumber: CONFIG.phoneNumber,
    autoReconnect: true,
    logLevel: 'silent',
});

bot.on('open', () => console.log(`✓ ${CONFIG.botName} sudah terhubung ke WhatsApp`));

// ========== Balasan AI untuk chat pribadi ==========
const AI_RESPONSES = {
    greetings: [
        'Halo! Saya Zimzz-AI 🤖. Ada yang bisa saya bantu?',
        'Hai! Zimzz-AI di sini. Mau ngobrol apa hari ini?',
        'Halo kak! Saya Zimzz-AI, siap membantu 😊',
    ],
    howAreYou: [
        'Saya baik dong! Saya kan bot, nggak pernah capek 😄',
        'Selalu sehat, thanks! Kamu gimana?',
    ],
    whoAreYou: [
        'Saya Zimzz-AI, bot WhatsApp yang siap nemenin kamu ngobrol 🤖',
        'Kenalin, saya Zimzz-AI. Bot pintar bikinan Zimzz 😎',
    ],
    thanks: [
        'Sama-sama! Senang bisa bantu 😊',
        'Nggak masalah, itu tugas saya 🙌',
    ],
    default: [
        'Hmm, menarik. Coba jelasin lebih detail dong 🤔',
        'Oke, saya dengerin. Lanjut...',
        'Wah, saya belum paham soal itu. Bisa diulang?',
        'Zimzz-AI masih belajar soal itu, tapi saya siap bantu hal lain 😊',
    ],
};

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getAIReply(text) {
    const t = text.toLowerCase();

    if (/\b(halo|hai|hi|hello|assalam|pagi|siang|sore|malam)\b/.test(t)) {
        return pickRandom(AI_RESPONSES.greetings);
    }
    if (/(apa kabar|gimana kabar|how are you)/.test(t)) {
        return pickRandom(AI_RESPONSES.howAreYou);
    }
    if (/(siapa kamu|kamu siapa|who are you|nama kamu)/.test(t)) {
        return pickRandom(AI_RESPONSES.whoAreYou);
    }
    if (/(makasih|terima kasih|thanks|thank you|thx)/.test(t)) {
        return pickRandom(AI_RESPONSES.thanks);
    }
    return pickRandom(AI_RESPONSES.default);
}

// ========== Fungsi-fungsi fitur ==========

/**
 * .kick → keluarkan member dari grup
 * Cara pakai: balas pesan target, kirim .kick
 * Syarat: Bot harus admin grup
 */
async function kickMember(sock, msg) {
    if (!msg.isGroup) {
        return msg.reply('❌ .kick hanya bisa dipakai di dalam grup.');
    }
    if (!msg.quoted) {
        return msg.reply('Balas dulu pesan orang yang mau di-kick, baru kirim .kick');
    }

    try {
        const targetJid = msg.quoted.sender;
        await sock.groupParticipantsUpdate(msg.from, [targetJid], 'remove');
        await msg.reply('✅ Berhasil dikeluarkan dari grup');
    } catch (e) {
        await msg.reply('❌ Gagal kick: ' + e.message);
    }
}

/**
 * .newgroup <nama> → bikin grup baru
 * Bisa dipakai di mana aja
 */
async function createGroup(sock, msg, args) {
    if (args.length === 0) return msg.reply('Format: .newgroup Nama Grup');

    const groupName = args.join(' ');
    try {
        const result = await sock.groupCreate(groupName, []);
        await msg.reply(`✅ Grup dibuat: ${groupName}\nID Grup: ${result.id}`);
    } catch (e) {
        await msg.reply('❌ Gagal bikin grup: ' + e.message);
    }
}

/**
 * .sw → ambil link undangan grup
 * Syarat: di grup, Bot harus admin
 */
async function getGroupLink(sock, msg) {
    if (!msg.isGroup) {
        return msg.reply('❌ Command .sw hanya bisa dipakai di dalam grup.');
    }

    try {
        const code = await sock.groupInviteCode(msg.from);
        const link = `https://chat.whatsapp.com/${code}`;
        await msg.reply(`🔗 *Link Grup*\n\n${link}\n\n_Klik untuk masuk ke grup ini._`);
    } catch (e) {
        await msg.reply(
            '❌ Gagal ambil link grup.\n' +
            'Pastikan Bot sudah dijadikan *admin* di grup ini.\n\n' +
            `Detail: ${e.message}`
        );
    }
}

/**
 * .rvo → ubah foto/video "sekali lihat" jadi media biasa
 * Cara pakai: balas media view-once, kirim .rvo
 * Bisa dipakai di grup maupun pribadi
 */
async function revealViewOnce(sock, msg) {
    if (!msg.quoted) {
        return msg.reply(
            '❌ Cara pakai:\n' +
            '1. Balas (reply) foto/video "sekali lihat"\n' +
            '2. Kirim .rvo\n\n' +
            'Bot akan kirim ulang medianya jadi media biasa.'
        );
    }

    const quoted = msg.quoted;
    const m = quoted.message;
    if (!m) return msg.reply('❌ Tidak bisa baca pesan itu');

    let inner =
        m.viewOnceMessage?.message ||
        m.viewOnceMessageV2?.message ||
        m.viewOnceMessageV2Extension?.message;

    if (!inner) {
        return msg.reply(
            '❌ Pesan yang kamu balas bukan media "sekali lihat".\n' +
            'Pastikan balasannya benar-benar ke media view-once-nya.'
        );
    }

    try {
        const imageMsg = inner.imageMessage;
        const videoMsg = inner.videoMessage;
        const audioMsg = inner.audioMessage;

        if (imageMsg) {
            const buffer = await sock.downloadMediaMessage(
                { message: inner, key: quoted.key }
            );
            if (!buffer || buffer.length === 0) {
                return msg.reply('❌ Gagal download fotonya, coba lagi.');
            }
            await sock.sendMessage(msg.from, {
                image: buffer,
                caption: imageMsg.caption || '✅ Foto view-once berhasil dibuka',
                mimetype: imageMsg.mimetype || 'image/jpeg',
            }, { quoted: msg });

        } else if (videoMsg) {
            const buffer = await sock.downloadMediaMessage(
                { message: inner, key: quoted.key }
            );
            if (!buffer || buffer.length === 0) {
                return msg.reply('❌ Gagal download videonya, coba lagi.');
            }
            await sock.sendMessage(msg.from, {
                video: buffer,
                caption: videoMsg.caption || '✅ Video view-once berhasil dibuka',
                mimetype: videoMsg.mimetype || 'video/mp4',
            }, { quoted: msg });

        } else if (audioMsg) {
            const buffer = await sock.downloadMediaMessage(
                { message: inner, key: quoted.key }
            );
            if (!buffer || buffer.length === 0) {
                return msg.reply('❌ Gagal download audionya, coba lagi.');
            }
            await sock.sendMessage(msg.from, {
                audio: buffer,
                mimetype: audioMsg.mimetype || 'audio/ogg; codecs=opus',
                ptt: audioMsg.ptt || false,
            }, { quoted: msg });

        } else {
            return msg.reply('❌ Tipe media view-once ini belum didukung.');
        }

    } catch (e) {
        await msg.reply('❌ Gagal buka media view-once.\nDetail: ' + e.message);
    }
}

/**
 * .menu → tampilkan menu
 */
async function showMenu(sock, msg) {
    const menuText = `
╭━━━〔 🤖 *${CONFIG.botName}* 〕━━━╮

┃ 📌 *Fitur Grup*
┃ • .kick
┃   ↳ balas pesan target, Bot keluarkan
┃ • .newgroup <nama>
┃   ↳ bikin grup baru
┃ • .sw
┃   ↳ ambil link undangan grup

┃ 📌 *Fitur Media*
┃ • .rvo
┃   ↳ balas foto/video "sekali lihat"

┃ 📌 *Umum*
┃ • .menu
┃   ↳ tampilkan menu ini

┃ 📌 *AI Chat*
┃ • Chat pribadi ke Bot
┃   ↳ Bot balas otomatis

╰━━━━━━━━━━━━━━━━━━━━━━╯

_${CONFIG.botName} siap membantu 24 jam_ ✨

Semua fitur bisa dipakai siapa saja,
di grup maupun chat pribadi.
`.trim();

    await msg.reply(menuText);
}

// ========== Welcome message saat ada yang join grup ==========
const WELCOME_TEMPLATES = [
    (name) => `╭━━━〔 🎉 *WELCOME* 〕━━━╮
┃
┃ Halo *${name}*! 👋
┃ Selamat datang di grup ini.
┃
┃ 📜 Baca rules dulu ya
┃ 🤝 Jangan sungkan kenalan
┃ 🚫 No spam, no toxic
┃
┃ Semoga betah di sini! 🔥
╰━━━━━━━━━━━━━━━━━━━━╯`,
    (name) => `✨ *SELAMAT DATANG* ✨

Hey *${name}*, welcome to the family! 🎊

• Jaga sikap & bahasa
• Saling menghormati
• Stay aktif biar rame

Enjoy your stay here! 🚀`,
    (name) => `🎊 *NEW MEMBER ALERT* 🎊

Nama: *${name}*
Status: Resmi jadi anggota 🫡

Semoga betah, jangan lupa
perkenalkan diri dulu ya! 👋🔥`,
];

function getWelcomeText(name) {
    return pickRandom(WELCOME_TEMPLATES)(name);
}

// ========== Routing pesan ==========
// Aturan:
// - Semua command (prefix ".") jalan di GRUP maupun PRIBADI
// - Di PRIBADI, kalau bukan command → dibalas AI
// - Di GRUP, kalau bukan command → diabaikan
bot.on('message', async (msg) => {
    if (msg.fromMe) return;

    const text = (msg.body || '').trim();

    // ---- Kalau ada prefix "." → jalankan sebagai command ----
    if (text.startsWith('.')) {
        const [cmd, ...args] = text.slice(1).split(/\s+/);

        switch (cmd.toLowerCase()) {
            case 'menu':
                await showMenu(bot.sock, msg);
                break;
            case 'kick':
                await kickMember(bot.sock, msg);
                break;
            case 'newgroup':
                await createGroup(bot.sock, msg, args);
                break;
            case 'sw':
                await getGroupLink(bot.sock, msg);
                break;
            case 'rvo':
                await revealViewOnce(bot.sock, msg);
                break;
            default:
                // Command tidak dikenal → kasih tau
                await msg.reply('❓ Command tidak dikenal.\nKirim .menu untuk lihat daftar fitur.');
                break;
        }
        return;
    }

    // ---- Bukan command ----
    // Kalau di chat pribadi → balas pakai AI
    if (!msg.isGroup && text.length > 0) {
        const reply = getAIReply(text);
        await msg.reply(reply);
    }
    // Kalau di grup → diamkan (biar nggak berisik)
});

// ========== Event: ada yang join grup ==========
bot.on('group-participants-update', async (update) => {
    try {
        const { id: groupJid, participants, action } = update;

        if (action !== 'add') return;

        for (const jid of participants) {
            const name = jid.split('@')[0];
            const welcomeText = getWelcomeText(name);
            await bot.sock.sendMessage(groupJid, { text: welcomeText });
        }
    } catch (e) {
        console.error('Gagal kirim welcome:', e.message);
    }
});

// ========== Jalankan ==========
bot.connect();

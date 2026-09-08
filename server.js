const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const cors = require('cors');

const app = express();
app.use(cors());

// إعدادات بوت الديسكورد مع تفعيل Intents الخاصة بالأعضاء
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// توكن البوت وأيدي السيرفر
const BOT_TOKEN = 'MTU0Njg4NjI5NjQ4MjQ4ODQ2MA.G21jZQ.bioCeVMm1Ori2MgEw1VxfwK6ocK-UGLMMhe-FE';
const GUILD_ID = '1367860164740518010';

// تعيين الرتب والأقسام
const ROLE_MAPPINGS = {
    "1367887614971215972": { rank: "Police Chief", category: "Police Administration", badgePrefix: "A-" },
    "1442180653901676666": { rank: "Vice Chief", category: "Police Administration", badgePrefix: "A-" },
    "1367888031708876800": { rank: "Assistant Chief", category: "Upper Administration", badgePrefix: "P-" },
    "1367891141785030697": { rank: "Deputy Chief", category: "Upper Administration", badgePrefix: "T-" },
    "1370078064033267812": { rank: "Major", category: "High Command", badgePrefix: "M-" },
    "1367891209586216981": { rank: "Captain", category: "High Command", badgePrefix: "C-" },
    "1367891226606702672": { rank: "Lieutenant II", category: "High Command", badgePrefix: "C-" },
    "1367891230062546945": { rank: "Lieutenant I", category: "High Command", badgePrefix: "C-" },
    "1367891233497944124": { rank: "Staff Sergeant", category: "Supervisors", badgePrefix: "S-3" },
    "1367891235716726924": { rank: "First Sergeant", category: "Supervisors", badgePrefix: "S-2" },
    "1370078647322546321": { rank: "Sergeant", category: "Supervisors", badgePrefix: "S-1" },
    "1367891237587259402": { rank: "Senior Officer", category: "Patrol Units", badgePrefix: "U-" },
    "1367891239537606736": { rank: "Officer III", category: "Patrol Units", badgePrefix: "U-" },
    "1367891241399750701": { rank: "Officer II", category: "Patrol Units", badgePrefix: "U-" },
    "1367892003505049660": { rank: "Officer I", category: "Patrol Units", badgePrefix: "U-" },
    "1367892036249976863": { rank: "Solo Cadet", category: "Cadet", badgePrefix: "300" }
};

// رابط API لربط الروستر بالموقع
app.get('/api/roster', async (req, res) => {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        // جلب كافّة الأعضاء مجدداً لضمان عدم الاعتماد على كاش قديم
        const members = await guild.members.fetch({ force: true }); 
        const roster = [];

        members.forEach(member => {
            if (member.user.bot) return;

            for (const [roleId, config] of Object.entries(ROLE_MAPPINGS)) {
                if (member.roles.cache.has(roleId)) {
                    roster.push({
                        id: member.id,
                        badge: config.badgePrefix,
                        name: member.displayName || member.user.username,
                        rank: config.rank,
                        category: config.category,
                        responsibility: 'N/A',
                        status: 'Active',
                        strikes: 0,
                        discord: member.id
                    });
                    break;
                }
            }
        });

        res.json(roster);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Error fetching members from Discord' });
    }
});

// تحسين حدث التشغيل وتفادي تحذيرات Deprecation
client.once('clientReady', (c) => {
    console.log(`[BOT ONLINE] Logged in as: ${c.user.tag}`);
});

client.login(BOT_TOKEN);

app.listen(3000, () => console.log('[SERVER ONLINE] Running on port 3000'));
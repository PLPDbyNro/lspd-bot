const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const cors = require('cors');

const app = express();
app.use(cors());

// Discord bot configuration with required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // تأكد من تفعيل Server Members Intent في Discord Developer Portal
        GatewayIntentBits.GuildPresences
    ]
});

const BOT_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = '1548599612930007043';

// Ordered role mappings (highest rank to lowest rank)
const ROLE_MAPPINGS = [
    // Legal Forces
    { id: "1548745649275674855", rank: "General Supervisor", category: "Legal Forces", badgePrefix: "GS-" },
    { id: "1548745659593789543", rank: "Legal Force Supervisor", category: "Legal Forces", badgePrefix: "LS-" },
    { id: "1548745660520734720", rank: "Police Chief", category: "Legal Forces", badgePrefix: "PC-" },
    { id: "1548745661573365871", rank: "Vice Chief", category: "Legal Forces", badgePrefix: "VC-" },

    // Police Upper Administration
    { id: "1548745666577174658", rank: "Assistant Chief", category: "Police Upper Administration", badgePrefix: "AC-" },
    { id: "1548745668695429271", rank: "Deputy Chief Police", category: "Police Upper Administration", badgePrefix: "DC-" },

    // Police Administration
    { id: "1548745679814525041", rank: "Commander", category: "Police Administration", badgePrefix: "CM-" },
    { id: "1548745675154522142", rank: "Captain", category: "Police Administration", badgePrefix: "C-" },
    { id: "1548745685312995438", rank: "Lieutenant", category: "Police Administration", badgePrefix: "L-" },

    // Supervisors
    { id: "1548745686609305600", rank: "Staff Sergeant", category: "Supervisors", badgePrefix: "S-2" },
    { id: "1548745687532044428", rank: "Sergeant", category: "Supervisors", badgePrefix: "S-1" },

    // Patrol Units
    { id: "1548745688505131009", rank: "Senior Officer", category: "Patrol Units", badgePrefix: "U-" },
    { id: "1548745690396491837", rank: "Officer", category: "Patrol Units", badgePrefix: "U-" },

    // Cadets
    { id: "1548745691709571154", rank: "Academy", category: "Cadets", badgePrefix: "300" }
];

// Helper function to extract badge prefix and clean name
function parseUserBadgeAndName(displayName, fallbackPrefix) {
    const raw = (displayName || '').trim();
    
    // Regex مرن لالتقاط أي شارة في بداية الاسم مثل: "607 SAHRAWI", "629 | EL DAHS", "C-2 Olise"
    const match = raw.match(/^([A-Za-z0-9]+(?:-[A-Za-z0-9]+)?)\s*[\|-]?\s+(.+)$/i);

    if (match) {
        return {
            badge: match[1].trim(),
            name: match[2].trim()
        };
    }

    // في حال عدم وجود رقم شارة في اسم الحساب، سيتم تعيين شارة افتراضية دون استبعاد العضو
    return {
        badge: fallbackPrefix || 'N/A',
        name: raw
    };
}

// API Endpoint to fetch roster data
app.get('/api/roster', async (req, res) => {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        // جلب جميع الأعضاء بالكامل من السيرفر
        const members = await guild.members.fetch({ force: true }); 
        const roster = [];

        members.forEach(member => {
            if (member.user.bot) return;

            // البحث عن أدوار العضو من الأعلى إلى الأدنى
            const matchedRoles = ROLE_MAPPINGS.filter(config => member.roles.cache.has(config.id));

            if (matchedRoles.length > 0) {
                // نأخذ أعلى رتبة يمتلكها العضو
                const config = matchedRoles[0];
                const fullName = member.displayName || member.user.username;
                const parsed = parseUserBadgeAndName(fullName, config.badgePrefix);

                roster.push({
                    id: member.id,
                    badge: parsed.badge,
                    name: parsed.name,
                    rank: config.rank,
                    category: config.category,
                    responsibility: 'N/A',
                    insignia: config.category === 'Cadets' ? 'cadet' : 'diamonds',
                    status: 'Active',
                    strikes: 0,
                    discord: member.id
                });
            }
        });

        console.log(`[ROSTER API] Total extracted members: ${roster.length}`);
        res.json(roster);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Error fetching members from Discord' });
    }
});

// Bot Startup Handlers
client.once('ready', (c) => {
    console.log(`[BOT ONLINE] Logged in as: ${c.user.tag}`);
});

client.login(BOT_TOKEN);

app.listen(3000, () => console.log('[SERVER ONLINE] Running on port 3000'));
```[cite: 1]

***

What would you like to do next?

<Elicitations message="What would you like to do next?">
  <Elicitation label="Update index.html dropdowns" query="Can you provide the full updated index.html code to match these new categories and ranks?"/>
  <Elicitation label="Add manual editing endpoints" query="How do I handle POST, PUT, and DELETE requests for manual officer management in server.js?"/>
</Elicitations>

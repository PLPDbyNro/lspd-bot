const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// Uses environment variable for security on GitHub & hosting platforms
const BOT_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = '1548599612930007043';

const ROLE_MAPPINGS = [
    { id: "1548745649275674855", rank: "General Supervisor", category: "Legal Forces", badgePrefix: "GS-" },
    { id: "1548745659593789543", rank: "Legal Force Supervisor", category: "Legal Forces", badgePrefix: "LS-" },
    { id: "1548745660520734720", rank: "Police Chief", category: "Legal Forces", badgePrefix: "PC-" },
    { id: "1548745661573365871", rank: "Vice Chief", category: "Legal Forces", badgePrefix: "VC-" },
    { id: "1548745666577174658", rank: "Assistant Chief", category: "Police Upper Administration", badgePrefix: "AC-" },
    { id: "1548745668695429271", rank: "Deputy Chief Police", category: "Police Upper Administration", badgePrefix: "DC-" },
    { id: "1548745679814525041", rank: "Commander", category: "Police Administration", badgePrefix: "CM-" },
    { id: "1548745675154522142", rank: "Captain", category: "Police Administration", badgePrefix: "C-" },
    { id: "1548745685312995438", rank: "Lieutenant", category: "Police Administration", badgePrefix: "L-" },
    { id: "1548745686609305600", rank: "Staff Sergeant", category: "Supervisors", badgePrefix: "S-2" },
    { id: "1548745687532044428", rank: "Sergeant", category: "Supervisors", badgePrefix: "S-1" },
    { id: "1548745688505131009", rank: "Senior Officer", category: "Patrol Units", badgePrefix: "U-" },
    { id: "1548745690396491837", rank: "Officer", category: "Patrol Units", badgePrefix: "U-" },
    { id: "1548745691709571154", rank: "Academy", category: "Cadets", badgePrefix: "300" }
];

let cachedRoster = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

app.get('/api/roster', async (req, res) => {
    try {
        const now = Date.now();
        if (cachedRoster.length > 0 && (now - lastFetchTime < CACHE_DURATION)) {
            return res.json(cachedRoster);
        }

        // Check if client is ready and connected
        if (!client.isReady()) {
            if (cachedRoster.length > 0) return res.json(cachedRoster);
            return res.status(503).json({ error: 'Bot is still starting up, please try again in a moment.' });
        }

        const guild = await client.guilds.fetch(GUILD_ID);
        if (!guild) {
            return res.status(404).json({ error: 'Discord Guild not found' });
        }

        const members = await guild.members.fetch({ force: true });
        const roster = [];

        members.forEach(member => {
            if (member.user.bot) return;
            const config = ROLE_MAPPINGS.find(c => member.roles.cache.has(c.id));
            if (config) {
                const raw = member.displayName || member.user.username;
                const match = raw.match(/^([A-Za-z0-9]+(?:-[A-Za-z0-9]+)?)\s*[\|-]?\s+(.+)$/i);
                roster.push({
                    id: member.id,
                    badge: match ? match[1].trim() : config.badgePrefix,
                    name: match ? match[2].trim() : raw,
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

        cachedRoster = roster;
        lastFetchTime = now;
        res.json(roster);
    } catch (error) {
        console.error('API Error:', error);
        if (cachedRoster.length > 0) return res.json(cachedRoster);
        res.status(500).json({ error: 'Failed to fetch roster data from Discord' });
    }
});

// Discord Bot Events
client.once('ready', (c) => {
    console.log(`[Discord Bot] Logged in successfully as ${c.user.tag}`);
});

// Start Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[Express Server] Online and listening on port ${PORT}`);
});

// Login to Discord using environment variable
if (!BOT_TOKEN) {
    console.error('[Error] DISCORD_TOKEN environment variable is missing!');
} else {
    client.login(BOT_TOKEN);
}

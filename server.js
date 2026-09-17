const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const cors = require('cors');

const app = express();
app.use(cors());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

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

function parseUserBadgeAndName(displayName, fallbackPrefix) {
    const raw = (displayName || '').trim();
    const match = raw.match(/^([A-Za-z0-9]+(?:-[A-Za-z0-9]+)?)\s*[\|-]?\s+(.+)$/i);
    if (match) {
        return { badge: match[1].trim(), name: match[2].trim() };
    }
    return { badge: fallbackPrefix || 'N/A', name: raw };
}

// Simple cache layer to prevent rate limits
let cachedRoster = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // Cache for 1 minute

app.get('/api/roster', async (req, res) => {
    try {
        const now = Date.now();
        // Return cached data if it's fresh
        if (cachedRoster.length > 0 && (now - lastFetchTime < CACHE_DURATION)) {
            return res.json(cachedRoster);
        }

        const guild = await client.guilds.fetch(GUILD_ID);
        const members = await guild.members.fetch({ force: true }); 
        const roster = [];

        members.forEach(member => {
            if (member.user.bot) return;

            const matchedRoles = ROLE_MAPPINGS.filter(config => member.roles.cache.has(config.id));
            if (matchedRoles.length > 0) {
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

        cachedRoster = roster;
        lastFetchTime = now;

        console.log(`[ROSTER API] Total extracted members: ${roster.length}`);
        res.json(roster);
    } catch (error) {
        console.error('API Error:', error);
        // If rate limited, return the old cached roster instead of crashing
        if (cachedRoster.length > 0) {
            console.log('[ROSTER API] Serving stale cache due to rate limit/error.');
            return res.json(cachedRoster);
        }
        res.status(500).json({ error: 'Error fetching members from Discord' });
    }
});

client.once('ready', (c) => {
    console.log(`[BOT ONLINE] Logged in as: ${c.user.tag}`);
});

client.login(BOT_TOKEN);
app.listen(3000, () => console.log('[SERVER ONLINE] Running on port 3000'));
```[cite: 1]

### Deployment Checklist
1. **Redeploy:** Push or redeploy this updated `server.js` file to your hosting provider (like Railway) so the new Guild ID and cache take effect.
2. **Check Interval:** In your `index.html`, keeping the auto-refresh at `10000` (10 seconds) is fine now because the backend will serve the cached data instantly without hitting Discord's rate limiters.

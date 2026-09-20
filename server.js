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
    
    { id: "1548745688505131009", rank: "Senior Officer", category: "Patrol Units", badgePrefix: "SO-" },
    { id: "1548745690396491837", rank: "Officer", category: "Patrol Units", badgePrefix: "O-" },
    
    { id: "1548745691709571154", rank: "Academy", category: "Cadets", badgePrefix: "300" }
];

const SPECIAL_ROLE_MAPPINGS = [
    { id: "1548745695387983924", rank: "Special Unit Chief", category: "Special Unit Chief", badgePrefix: "SUC-" },
    
    { id: "1548745710126637097", rank: "Negotiator Chief", category: "Negotiator Wing", badgePrefix: "NC-" },
    { id: "1548745728292298873", rank: "Negotiator", category: "Negotiator Wing", badgePrefix: "NEG-" },
    
    { id: "1548745712034910329", rank: "Motorcycle Commander", category: "Motorcycle Wing", badgePrefix: "MC-" },
    { id: "1548745713284812830", rank: "Motorcycle Deputy", category: "Motorcycle Wing", badgePrefix: "MD-" },
    { id: "1548745725980967093", rank: "Motorcycle Unit", category: "Motorcycle Wing", badgePrefix: "MTR-" },
    
    { id: "1548745708251914310", rank: "Airship Commander", category: "Air Support Wing", badgePrefix: "AC-" },
    { id: "1548745751209709729", rank: "Airship Deputy", category: "Air Support Wing", badgePrefix: "AD-" },
    { id: "1548745726912106767", rank: "Airship Unit", category: "Air Support Wing", badgePrefix: "AIR-" },
    
    { id: "1548745714459213965", rank: "Speed Unit Commander", category: "Speed Unit Wing", badgePrefix: "SUC-" },
    { id: "1548745730364284928", rank: "Speed Unit", category: "Speed Unit Wing", badgePrefix: "SPD-" },
    
    { id: "1548745701838962698", rank: "Academy Instructor Supervisor", category: "Watch Command", badgePrefix: "AIS-" },
    { id: "1548745720700551188", rank: "Academy Instructor", category: "Watch Command", badgePrefix: "AI-" }
];

let cachedRoster = [];
let lastFetchTime = 0;

let cachedSpecialRoster = [];
let lastSpecialFetchTime = 0;

const CACHE_DURATION = 60 * 1000; // دقيقة واحدة

// API 1: Legal Forces Roster
app.get('/api/roster', async (req, res) => {
    try {
        const now = Date.now();
        if (cachedRoster.length > 0 && (now - lastFetchTime < CACHE_DURATION)) {
            return res.json(cachedRoster);
        }

        if (!client.isReady()) {
            if (cachedRoster.length > 0) return res.json(cachedRoster);
            return res.status(503).json({ error: 'Bot is still starting up.' });
        }

        const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
        if (!guild) return res.status(404).json({ error: 'Guild not found' });

        await guild.members.fetch().catch(() => {});
        const members = guild.members.cache;
        const roster = [];

        members.forEach(member => {
            if (member.user.bot) return;
            const config = ROLE_MAPPINGS.find(c => member.roles.cache.has(c.id));
            if (config) {
                const raw = member.displayName || member.user.username;
                const match = raw.match(/^\[?([A-Za-z0-9-]+)\]?\s*[\|-]?\s+(.+)$/);
                
                let badgeVal = match ? match[1].trim() : config.badgePrefix;
                let nameVal = match ? match[2].trim() : raw;

                roster.push({
                    id: member.id,
                    badge: badgeVal,
                    name: nameVal,
                    rank: config.rank,
                    category: config.category,
                    status: 'Active',
                    avatar: member.user.displayAvatarURL({ dynamic: true, size: 128 })
                });
            }
        });

        roster.sort((a, b) => {
            const indexA = ROLE_MAPPINGS.findIndex(r => r.rank === a.rank);
            const indexB = ROLE_MAPPINGS.findIndex(r => r.rank === b.rank);
            return indexA - indexB;
        });

        cachedRoster = roster;
        lastFetchTime = now;
        res.json(roster);
    } catch (error) {
        console.error('API Error:', error);
        if (cachedRoster.length > 0) return res.json(cachedRoster);
        res.status(500).json({ error: 'Failed to fetch roster data' });
    }
});

// API 2: Special Units Roster
app.get('/api/special-units', async (req, res) => {
    try {
        const now = Date.now();
        if (cachedSpecialRoster.length > 0 && (now - lastSpecialFetchTime < CACHE_DURATION)) {
            return res.json(cachedSpecialRoster);
        }

        if (!client.isReady()) {
            if (cachedSpecialRoster.length > 0) return res.json(cachedSpecialRoster);
            return res.status(503).json({ error: 'Bot is still starting up.' });
        }

        const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
        if (!guild) return res.status(404).json({ error: 'Guild not found' });

        await guild.members.fetch().catch(() => {});
        const members = guild.members.cache;
        const specialRoster = [];

        members.forEach(member => {
            if (member.user.bot) return;
            
            const matchedConfigs = SPECIAL_ROLE_MAPPINGS.filter(c => member.roles.cache.has(c.id));
            
            matchedConfigs.forEach(config => {
                const raw = member.displayName || member.user.username;
                const match = raw.match(/^\[?([A-Za-z0-9-]+)\]?\s*[\|-]?\s+(.+)$/);
                
                let badgeVal = match ? match[1].trim() : config.badgePrefix;
                let nameVal = match ? match[2].trim() : raw;

                specialRoster.push({
                    id: `${member.id}-${config.rank}`,
                    discordId: member.id,
                    badge: badgeVal,
                    name: nameVal,
                    rank: config.rank,
                    category: config.category,
                    status: 'Active Duty',
                    avatar: member.user.displayAvatarURL({ dynamic: true, size: 128 })
                });
            });
        });

        specialRoster.sort((a, b) => {
            const indexA = SPECIAL_ROLE_MAPPINGS.findIndex(r => r.rank === a.rank);
            const indexB = SPECIAL_ROLE_MAPPINGS.findIndex(r => r.rank === b.rank);
            return indexA - indexB;
        });

        cachedSpecialRoster = specialRoster;
        lastSpecialFetchTime = now;
        res.json(specialRoster);
    } catch (error) {
        console.error('Special Units API Error:', error);
        if (cachedSpecialRoster.length > 0) return res.json(cachedSpecialRoster);
        res.status(500).json({ error: 'Failed to fetch special units data' });
    }
});

app.delete('/api/roster/:id', (req, res) => {
    const officerId = req.params.id;
    try {
        cachedRoster = cachedRoster.filter(officer => String(officer.id) !== String(officerId));
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete' });
    }
});

app.delete('/api/special-units/:id', (req, res) => {
    const officerId = req.params.id;
    try {
        cachedSpecialRoster = cachedSpecialRoster.filter(officer => String(officer.id) !== String(officerId));
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete' });
    }
});

// استخدام الحدث المحدث clientReady لتفادي التحذير نهائياً
client.once('clientReady', (c) => {
    console.log(`[Bot] Logged in successfully as ${c.user.tag}`);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[Server] Server is running on port ${PORT}`);
    if (BOT_TOKEN) {
        client.login(BOT_TOKEN).catch(err => {
            console.error('[Bot] Failed to login to Discord:', err);
        });
    } else {
        console.error('[Bot] DISCORD_TOKEN is missing in environment variables!');
    }
});

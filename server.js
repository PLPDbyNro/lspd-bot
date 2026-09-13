app.get('/api/roster', async (req, res) => {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        
        // جلب جميع الأعضاء
        const members = await guild.members.fetch();
        console.log(`[DEBUG] Total members fetched from Discord: ${members.size}`);

        const roster = [];

        members.forEach(member => {
            if (member.user.bot) return;

            // طباعة أيدي الرتب لمعاينة المطابقة
            const userRoles = ROLE_MAPPINGS.filter(config => member.roles.cache.has(config.id));

            if (userRoles.length > 0) {
                const cadetRole = userRoles.find(r => r.category === 'Cadet');
                const userRole = cadetRole ? cadetRole : userRoles[0];

                const fullName = member.displayName || member.user.username;
                const parsed = parseUserBadgeAndName(fullName, userRole.badgePrefix);

                roster.push({
                    id: member.id,
                    badge: parsed.badge,
                    name: parsed.name,
                    rank: userRole.rank,
                    category: userRole.category,
                    responsibility: 'N/A',
                    insignia: userRole.category === 'Cadet' ? 'cadet' : 'diamonds',
                    status: 'Active',
                    strikes: 0,
                    discord: member.id
                });
            }
        });

        console.log(`[DEBUG] Total officers matched in Roster: ${roster.length}`);
        res.json(roster);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Error fetching members from Discord' });
    }
});

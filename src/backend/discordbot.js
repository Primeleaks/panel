import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export default function setupDiscordBot(scriptService) {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.DirectMessages
        ]
    });

    client.on('ready', () => {
        console.log(`Discord Bot eingeloggt als ${client.user.tag}`);
    });

    client.sendApprovalRequest = async function(scriptData) {
        try {
            const channelId = process.env.DISCORD_APPROVAL_CHANNEL_ID;
            if (!channelId) {
                console.error("DISCORD_APPROVAL_CHANNEL_ID fehlt in der .env-Datei");
                return;
            }

            const channel = await client.channels.fetch(channelId);
            if (!channel) {
                console.error(`Kanal mit ID ${channelId} nicht gefunden`);
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`Neuer Leak zur Überprüfung`)
                //.setDescription(scriptData.description || 'Keine Beschreibung')
                .setColor(16711680)
                .addFields(
                    { name: 'Title', value: scriptData.title || 'Keine Titel', inline: false },
                    { name: 'Beschreibung', value: scriptData.description || 'Keine Kategorie', inline: false },
                    { name: 'Kategorie', value: scriptData.category || 'Keine Kategorie', inline: false },
                    { name: 'Autor', value: scriptData.author || 'Unbekannt', inline: false },
                    { name: 'Leak ID', value: scriptData.scriptId.toString(), inline: false },
                    { name: 'Download Link', value: scriptData.downloadLink, inline: false }
                );

            if (scriptData.image) {
                embed.setImage(scriptData.image);
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`approve_script:${scriptData.scriptId}`)
                        .setLabel('Genehmigen')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`reject_script:${scriptData.scriptId}`)
                        .setLabel('Ablehnen')
                        .setStyle(ButtonStyle.Danger)
                );

            const roleMention = '<@&1339625499542163542>';
            const roleMention2 = '<@&1343260219790069810>';

            await channel.send({
                content: `${roleMention} ${roleMention2} Ein neuer Leak wurde zur Überprüfung eingereicht!`,
                embeds: [embed],
                components: [row]
            });

            console.log(`Genehmigungsanfrage für Leak ID ${scriptData.scriptId} wurde gesendet`);
        } catch (error) {
            console.error('Fehler beim Senden der Genehmigungsanfrage:', error);
            console.error(error.stack);
        }
    };

    client.sendApprovalDM = async function(userId, scriptData) {
        try {
            const user = await client.users.fetch(userId);

            if (!user) {
                console.error(`Benutzer mit ID ${userId} konnte nicht gefunden werden`);
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`Dein Leak wurde genehmigt!`)
                .setColor(16711680)
                .addFields(
                    { name: 'Title', value: scriptData.title || 'Keine Titel', inline: false },
                    { name: 'Leak ID', value: scriptData.scriptId.toString(), inline: false }
                );

            if (scriptData.image) {
                embed.setImage(scriptData.image);
            }

            await user.send({
                embeds: [embed]
            });

            console.log(`Genehmigungs-DM für Leak ID ${scriptData.scriptId} wurde an Benutzer ${userId} gesendet`);
        } catch (error) {
            console.error(`Fehler beim Senden der DM an Benutzer ${userId}:`, error);
        }
    };


    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        console.log(`Button-Interaktion empfangen: ${interaction.customId}`);

        const [action, scriptId] = interaction.customId.split(':');

        if (action === 'approve_script') {
            try {
                await scriptService.approveScript(scriptId);

                const scriptData = await scriptService.getScriptById(scriptId);

                if (scriptData && scriptData.authorId) {
                    await client.sendApprovalDM(scriptData.authorId, {
                        ...scriptData,
                        scriptId: scriptData.id
                    });
                }

                await interaction.update({
                    content: `${interaction.user.tag} hat den Leak genehmigt`,
                    embeds: [],
                    components: []
                });
            } catch (error) {
                console.error(`Fehler bei der Genehmigung des Scripts ${scriptId}:`, error);
                await interaction.reply({
                    content: `Fehler bei der Genehmigung des Scripts: ${error.message}`,
                    ephemeral: true
                });
            }
        } else if (action === 'reject_script') {
            try {
                await scriptService.rejectScript(scriptId);

                await interaction.update({
                    content: `${interaction.user.tag} hat den Leak Abgelehnt`,
                    embeds: [],
                    components: []
                });

                console.log(`Leak #${scriptId} wurde abgelehnt von ${interaction.user.tag}`);
            } catch (error) {
                console.error(`Fehler bei der Ablehnung von Leak #${scriptId}:`, error);

                await interaction.reply({
                    content: `❌ Fehler bei der Ablehnung von Leak #${scriptId}: ${error.message}`,
                    ephemeral: true
                });
            }
        }
    });

    client.login(process.env.DISCORD_BOT_TOKEN);

    return client;
}
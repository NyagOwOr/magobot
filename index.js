const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { config } = require('dotenv');
const { spawn } = require('child_process');
const fs = require('fs');

// Load environment variables
config({ path: './token.env' });

// Load chat history from file
const historyFilePath = './chat_history.json';

function loadHistory() {
    if (fs.existsSync(historyFilePath)) {
        return JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
    }
    return {};
}

function updateHistory(userId, history) {
    const chatHistory = loadHistory();
    chatHistory[userId] = history;
    fs.writeFileSync(historyFilePath, JSON.stringify(chatHistory, null, 2));
}

// Create the Discord bot client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const MAX_HISTORY_LENGTH = 5; // Limit the number of chat exchanges stored

// Register commands
client.once('ready', async () => {
    const guildId = '969122917927493632'; // Replace with your server ID
    const commands = [
        new SlashCommandBuilder()
            .setName('chat')
            .setDescription('Chat with the AI bot')
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('Your message to the AI')
                    .setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Updated permission flag
    ];

    const guild = await client.guilds.fetch(guildId);
    await guild.commands.set(commands);

    console.log(`Bot is ready and registered in guild ${guildId}`);
});

// Respond to chat command
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;
    if (commandName === 'chat') {
        const userMessage = options.getString('message');
        const userId = interaction.user.id;

        await interaction.deferReply(); // Allow time for AI response

        // Load user-specific chat history
        let history = loadHistory()[userId] || [];

        // Limit history to the last MAX_HISTORY_LENGTH exchanges
        history = history.slice(-MAX_HISTORY_LENGTH);

        // Update chat history with user message
        history.push(`User: ${userMessage}`);
        updateHistory(userId, history);

        try {
            const response = await generateAIResponse(history);
            history.push(`AI: ${response}`);
            updateHistory(userId, history);

            await interaction.editReply(response);
        } catch (error) {
            console.error(error);
            await interaction.editReply('Something went wrong while processing your request.');
        }
    }
});

// Generate AI response using LLaMA
async function generateAIResponse(history) {
    const prompt = history.join('\n') + '\nAI:';

    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', ['./generate_response.py', prompt]);

        let response = '';
        pythonProcess.stdout.on('data', (data) => {
            response += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve(response.trim());
            } else {
                reject(new Error(`Python script exited with code ${code}`));
            }
        });
    });
}

// Log in to Discord
client.login(process.env.DISCORD_TOKEN);

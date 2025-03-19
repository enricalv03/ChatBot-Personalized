import axios from 'axios';

// Configuration object for different AI providers
const AI_PROVIDERS = {
    DeepSeek: {
        name: 'DeepSeek (R1)',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: import.meta.env.VITE_OPENROUTER_KEY,
        model: 'deepseek/deepseek-r1:free'
    },
    Groq: {
        name: 'Groq (Llama-3)',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: import.meta.env.VITE_GROQ_KEY,
        model: 'llama3-70b-8192'
    }
};

// Utility function to parse rich text formatting
function parseRichText(text) {
    const formatRules = [
        { regex: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
        { regex: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
        { regex: /`(.*?)`/g, replacement: '<code class="inline-code">$1</code>' }
    ];

    let processedText = text;
    formatRules.forEach(rule => {
        processedText = processedText.replace(rule.regex, rule.replacement);
    });

    return processedText;
}

// File reading utility
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Prepare messages with file contents
async function prepareMessagesWithFiles(messages) {
    const formattedMessages = [];

    for (const msg of messages) {
        const role = msg.sender === 'user' ? 'user' : 'assistant';
        const formattedMessage = { role, content: msg.content };

        // Process files if present
        if (msg.files && msg.files.length > 0) {
            try {
                for (const file of msg.files) {
                    try {
                        const fileContent = await readFileAsText(file);
                        // Append file content to the message
                        formattedMessage.content += `\n\n--- File: ${file.name} ---\n${fileContent}\n---`;
                    } catch (error) {
                        console.error(`Error reading file ${file.name}:`, error);
                        formattedMessage.content += `\n\nError reading file: ${file.name}`;
                    }
                }
            } catch (error) {
                console.error('Error processing files:', error);
                formattedMessage.content += "\n\nError processing attached files.";
            }
        }

        formattedMessages.push(formattedMessage);
    }

    return formattedMessages;
}

// Detect and parse code blocks
function detectCodeBlocks(text) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let processedText = text;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        const [fullMatch, language, code] = match;
        const codeBlock = {
            language: language || 'plaintext',
            code: code.trim(),
            explanation: [] // Will be populated dynamically
        };
        codeBlocks.push(codeBlock);

        // Replace the code block with a placeholder
        processedText = processedText.replace(fullMatch, `[CODE_BLOCK_${codeBlocks.length - 1}]`);
    }

    return {
        text: processedText,
        codeBlocks
    };
}

// Generate AI-powered code explanation
async function getCodeExplanation(code, language, provider) {
    try {
        // Validate API configuration
        if (!provider.apiKey) {
            return ["Unable to generate explanation due to missing API key."];
        }

        // Prepare request for code explanation
        const requestData = {
            model: provider.model,
            messages: [
                {
                    role: 'user',
                    content: `Please provide a detailed, line-by-line explanation of the following ${language} code. Break down the code's functionality, explain each significant part, and highlight any noteworthy programming concepts or techniques used:\n\n${code}`
                }
            ],
            temperature: 0.7
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
            'HTTP-Referer': window.location.href,
            'X-Title': 'DeepChat'
        };

        // Make API request
        const response = await axios.post(provider.endpoint, requestData, { headers });

        // Extract explanation text
        const rawExplanation = response.data.choices[0].message.content;

        // Split explanation into multiple lines for display
        const explanationLines = rawExplanation.split('\n')
            .filter(line => line.trim() !== '') // Remove empty lines
            .map(line => parseRichText(line)); // Apply rich text formatting

        return explanationLines;

    } catch (error) {
        console.error('Code Explanation Error:', error);
        return ["Unable to generate AI-powered explanation. Please try again."];
    }
}

// Generate a simulated response for testing or when API fails
function generateSimulatedResponse(messages) {
    const lastUserMessage = messages.filter(msg => msg.sender === 'user').pop();
    if (!lastUserMessage) return { text: "No message received.", codeBlocks: [] };

    const hasFiles = lastUserMessage.files && lastUserMessage.files.length > 0;
    if (!hasFiles) return { text: "No files uploaded.", codeBlocks: [] };

    const fileNames = lastUserMessage.files.map(file => file.name).join(", ");
    const simulatedText = `I've detected the following file(s): ${fileNames}.\n\n` +
        `Here's a sample code block to demonstrate:\n\n` +
        "```python\n" +
        "def hello_world():\n" +
        "    print('This is a simulated response')\n" +
        "```\n\n" +
        "In a real scenario with a working API key, I would analyze the actual file contents.";

    return detectCodeBlocks(simulatedText);
}

// Main function to send message to AI
export const sendMessageToAI = async (messages, selectedAI = 'DeepSeek') => {
    try {
        const provider = AI_PROVIDERS[selectedAI] || AI_PROVIDERS.DeepSeek;

        // Validate API configuration
        if (!provider.apiKey) {
            console.warn(`No API key for ${selectedAI}. Using simulated response.`);
            return generateSimulatedResponse(messages);
        }

        // Prepare messages with file contents
        const formattedMessages = await prepareMessagesWithFiles(messages);

        // Prepare request data based on provider
        const requestData = {
            model: provider.model,
            messages: formattedMessages,
            temperature: 0.7
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
            ...(selectedAI === 'DeepSeek' ? {
                'HTTP-Referer': window.location.href,
                'X-Title': 'DeepChat'
            } : {})
        };

        // Make API request
        const response = await axios.post(provider.endpoint, requestData, { headers });

        // Extract AI response based on provider
        let rawResponse;
        switch(selectedAI) {
            case 'Claude':
                rawResponse = response.data.content[0].text;
                break;
            case 'DeepSeek':
            case 'Groq':
            default:
                rawResponse = response.data.choices[0].message.content;
        }

        // Detect code blocks
        const { text: processedText, codeBlocks } = detectCodeBlocks(rawResponse);

        // Generate explanations for code blocks asynchronously
        const explanationPromises = codeBlocks.map(async (block) => {
            if (block.language !== 'plaintext') {
                block.explanation = await getCodeExplanation(block.code, block.language, provider);
            }
            return block;
        });

        // Wait for all explanations to be generated
        const processedCodeBlocks = await Promise.all(explanationPromises);

        return {
            text: processedText,
            codeBlocks: processedCodeBlocks
        };

    } catch (error) {
        console.error('AI Service Error:', error);

        // If API call fails, generate a simulated response
        return generateSimulatedResponse(messages);
    }
};

export default {
    sendMessageToAI,
    AI_PROVIDERS
};
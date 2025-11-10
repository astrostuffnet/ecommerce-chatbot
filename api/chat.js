export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message } = request.body;

        if (!message) {
            return response.status(400).json({ error: 'Message is required' });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return response.status(500).json({ error: 'Server configuration error' });
        }

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://ecommerce-chatbot.vercel.app',
                'X-Title': 'Ecommerce AI Chatbot'
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an AI assistant for an ecommerce website. Help customers with orders, products, shipping, and returns.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!aiResponse.ok) {
            throw new Error('AI service error');
        }

        const data = await aiResponse.json();
        const reply = data.choices[0].message.content;

        response.status(200).json({
            reply: reply
        });

    } catch (error) {
        response.status(500).json({ 
            error: 'Failed to process message'
        });
    }
}
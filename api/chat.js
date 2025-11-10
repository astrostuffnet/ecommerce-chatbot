export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

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
                'HTTP-Referer': 'https://your-app.vercel.app',
                'X-Title': 'Ecommerce AI Chatbot'
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are an AI assistant for an ecommerce website. You help customers with:
- Order tracking and status
- Product information and recommendations  
- Return and exchange policies
- Shipping information and costs
- Payment and billing questions
- Technical support
- General customer service

Be professional, helpful, and friendly. Provide clear, concise information. If you don't know something, suggest contacting customer support.`
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
            throw new Error(`OpenRouter API error: ${aiResponse.status}`);
        }

        const data = await aiResponse.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response from AI service');
        }

        const reply = data.choices[0].message.content;

        response.status(200).json({
            reply: reply,
            usage: data.usage
        });

    } catch (error) {
        console.error('Error in chat API:', error);
        response.status(500).json({ 
            error: 'Failed to process message',
            details: error.message
        });
    }
}
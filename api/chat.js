export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    // Debug: Check if API key exists
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API KEY MISSING: OpenRouter API key not found in environment variables. Please add OPENROUTER_API_KEY to Vercel environment variables.' 
      });
    }

    // Debug: Show first few characters of API key (for verification)
    console.log('API Key exists, starts with:', apiKey.substring(0, 10) + '...');
    console.log('API Key length:', apiKey.length);

    // Make request to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ecommerce-chatbot.vercel.app',
        'X-Title': 'Ecommerce AI Chatbot'
      },
      body: JSON.stringify({
        model: 'google/gemini-pro',  // Changed to free model
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500
      })
    });

    console.log('OpenRouter response status:', response.status);

    // Get the full error response
    const responseText = await response.text();
    console.log('OpenRouter response:', responseText);

    if (!response.ok) {
      let errorDetails = `Status: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorDetails += ` - ${JSON.stringify(errorData)}`;
      } catch (e) {
        errorDetails += ` - ${responseText}`;
      }
      
      return res.status(500).json({ 
        error: `OPENROUTER API ERROR: ${errorDetails}` 
      });
    }

    // Parse the successful response
    const data = JSON.parse(responseText);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ 
        error: 'INVALID RESPONSE FORMAT: ' + JSON.stringify(data) 
      });
    }

    const reply = data.choices[0].message.content;

    res.status(200).json({
      reply: reply,
      model: data.model
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'SERVER ERROR: ' + error.message 
    });
  }
}
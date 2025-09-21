import type { VercelRequest, VercelResponse } from '@vercel/node';

const AT_USERNAME = process.env.AT_USERNAME;
const AT_APIKEY = process.env.AT_APIKEY;
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'mock';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { to, message } = req.body || {};
  
  if (!to || !message) {
    return res.status(400).json({ error: 'Both "to" and "message" fields are required' });
  }
  
  if (SMS_PROVIDER === 'mock') {
    console.log('[MOCK SMS] to:', to, 'message:', message);
    return res.status(200).json({ 
      success: true, 
      provider: 'mock',
      message: 'SMS sent successfully (mock mode)'
    });
  }
  
  // Africa's Talking REST API
  try {
    const url = 'https://api.sandbox.africastalking.com/version1/messaging';
    const payload = new URLSearchParams();
    payload.append('username', AT_USERNAME || '');
    payload.append('to', to);
    payload.append('message', message);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': AT_APIKEY || ''
      },
      body: payload
    });
    
    const data = await response.text();
    console.log('AT Response:', data);
    
    return res.status(response.ok ? 200 : 400).json({ 
      success: response.ok, 
      data,
      provider: 'africastalking'
    });
  } catch (err) {
    console.error('SMS error:', err);
    return res.status(500).json({ error: 'Failed to send SMS' });
  }
}
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { country, indicator } = req.query;

  if (!country || !indicator) {
    return res.status(400).json({ error: 'Missing country or indicator parameter' });
  }

  try {
    const worldBankUrl = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=1`;
    
    const response = await fetch(worldBankUrl);
    
    if (!response.ok) {
      throw new Error(`World Bank API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('World Bank API Response:', JSON.stringify(data, null, 2));
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching from World Bank:', error);
    res.status(500).json({ error: 'Failed to fetch data from World Bank API' });
  }
} 
const fetch = require('node-fetch');
const { XMLParser } = require('fast-xml-parser');

module.exports = async (req, res) => {
  console.log('✅ API-functie gestart');

  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Geen body ontvangen' });
    }

    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      return res.status(400).json({ error: 'Body is geen geldige JSON', details: parseError.message });
    }

    const { artikelnummer } = body;
    if (!artikelnummer) {
      return res.status(400).json({ error: 'Geen artikelnummer opgegeven.' });
    }

    console.log(`🔍 Artikelnummer ontvangen: ${artikelnummer}`);

    const feedUrl = 'https://files.channable.com/JLuZCPOeK9iW4bKR-P7IDA==.xml';
    const response = await fetch(feedUrl);

    if (!response.ok) {
      return res.status(500).json({
        error: 'Fout bij ophalen XML-feed',
        status: response.status,
      });
    }

    const xml = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseNodeValue: true,
      parseAttributeValue: true
    });

    const parsed = parser.parse(xml);
    const producten = parsed?.rss?.channel?.item;

    if (!producten || !Array.isArray(producten)) {
      return res.status(500).json({ error: 'Geen producten gevonden in XML.' });
    }

    const match = producten.find(p => p['g:id'] === artikelnummer);

    if (!match) {
      return res.status(404).json({ error: `Artikelnummer ${artikelnummer} niet gevonden.` });
    }

    const result = {
      Artikelnummer: match['g:id'],
      Titel: match.title,
      Prijs: match['g:price'],
      Voorraad: match['g:availability'],
      Merk: match['g:brand'],
      Link: match.link,
      Afbeelding: match['g:image_link'],
      Categorie: match['g:product_type']
    };

    return res.status(200).json(result);

  } catch (err) {
    console.error('⛔️ Fout in API-functie:', err);
    return res.status(500).json({
      error: 'Interne serverfout',
      details: err.message,
    });
  }
};

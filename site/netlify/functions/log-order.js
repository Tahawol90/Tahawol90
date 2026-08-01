// Logs each completed order (customer + questionnaire answers + computed macros)
// into an Airtable base so the merchant can browse/filter/export customer data.
// Requires three Netlify environment variables:
//   AIRTABLE_API_KEY  - Personal Access Token from airtable.com/create/tokens
//   AIRTABLE_BASE_ID  - starts with "app..." (found in the base's API docs / URL)
//   AIRTABLE_TABLE    - the table name inside the base (e.g. "Orders")
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE || 'Orders';

    if (!apiKey || !baseId) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AIRTABLE_API_KEY أو AIRTABLE_BASE_ID غير مضبوطة بإعدادات Netlify' }) };
    }

    const fields = {
      'Date': new Date().toISOString(),
      'Order ID': body.orderId || '',
      'Name': body.name || '',
      'Email': body.email || '',
      'Phone': body.phone || '',
      'Gender': body.gender === 'male' ? 'Male' : body.gender === 'female' ? 'Female' : '',
      'Age': Number(body.age) || null,
      'Height (cm)': Number(body.height) || null,
      'Weight (kg)': Number(body.weight) || null,
      'Muscle Mass (kg)': body.muscleMass ? Number(body.muscleMass) : null,
      'Fat Mass (kg)': body.fatMass ? Number(body.fatMass) : null,
      'Goal': body.goal || '',
      'Training Days': Number(body.daysPerWeek) || null,
      'Activity Level': body.lifestyle || '',
      'Calories': Number(body.calories) || null,
      'Protein': Number(body.protein) || null,
      'Carbs': Number(body.carbs) || null,
    };

    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: [{ fields }] })
    });

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status || 500, body: JSON.stringify({ error: data }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// Confirms a charge actually succeeded before we unlock the PDF download.
// Never trust the redirect alone — always re-check the charge status server-side.
exports.handler = async (event) => {
  const tapId = event.queryStringParameters && event.queryStringParameters.tap_id;
  const secretKey = process.env.TAP_SECRET_KEY;

  if (!tapId) return { statusCode: 400, body: JSON.stringify({ error: 'ناقص tap_id' }) };
  if (!secretKey) return { statusCode: 500, body: JSON.stringify({ error: 'TAP_SECRET_KEY غير مضبوط' }) };

  try {
    const res = await fetch(`https://api.tap.company/v2/charges/${tapId}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` }
    });
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify({ status: data.status, id: data.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// Creates a Tap Payments charge and returns the hosted checkout URL.
// The secret key NEVER touches the browser — it only lives here, as a
// Netlify environment variable (Site settings > Environment variables > TAP_SECRET_KEY).
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { amount, currency, orderId, redirectBase, customer } = JSON.parse(event.body || '{}');
    const secretKey = process.env.TAP_SECRET_KEY;

    if (!secretKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'TAP_SECRET_KEY غير مضبوط بإعدادات Netlify' }) };
    }
    if (!amount || !orderId || !redirectBase) {
      return { statusCode: 400, body: JSON.stringify({ error: 'ناقص amount/orderId/redirectBase' }) };
    }

    const chargeBody = {
      amount,
      currency: currency || 'SAR',
      threeDSecure: true,
      save_card: false,
      description: 'برنامج ٩٠ يوم',
      reference: { order: orderId },
      receipt: { email: false, sms: false },
      source: { id: 'src_all' }, // shows Tap's own hosted method picker (mada, Apple Pay, cards...)
      redirect: { url: `${redirectBase}?order=${orderId}` }
    };

    if (customer && customer.email) {
      const nameParts = (customer.name || '').trim().split(/\s+/);
      const digits = (customer.phone || '').replace(/\D/g, '').replace(/^0+/, '');
      chargeBody.customer = {
        first_name: nameParts[0] || customer.name || '',
        last_name: nameParts.slice(1).join(' ') || '-',
        email: customer.email,
        phone: { country_code: '966', number: digits }
      };
    }

    const res = await fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chargeBody)
    });

    const data = await res.json();
    if (!res.ok || !data.transaction || !data.transaction.url) {
      return { statusCode: res.status || 500, body: JSON.stringify({ error: data }) };
    }

    return { statusCode: 200, body: JSON.stringify({ url: data.transaction.url, id: data.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

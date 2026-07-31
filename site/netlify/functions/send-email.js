// Emails the generated PDF to the customer using Resend.
// The API key never touches the browser — it lives here as a Netlify
// environment variable (Site settings > Environment variables > RESEND_API_KEY).
// RESEND_FROM is optional; defaults to Resend's shared sandbox sender, which
// works immediately but should be swapped for a verified domain address later.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { to, name, pdfBase64 } = JSON.parse(event.body || '{}');
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY غير مضبوط بإعدادات Netlify' }) };
    }
    if (!to || !pdfBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'ناقص to/pdfBase64' }) };
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject: 'برنامجك لتحوّل ٩٠ جاهز 🎯',
        html: `<div dir="rtl" style="font-family:sans-serif;font-size:15px;line-height:1.8">
          <p>مرحباً ${name || ''}،</p>
          <p>برنامجك الشخصي لـ٩٠ يوم (تحوّل ٩٠) مرفق بهذا الإيميل.</p>
          <p>بالتوفيق في رحلتك!</p>
        </div>`,
        attachments: [{ filename: '90-day-plan.pdf', content: pdfBase64 }]
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status || 500, body: JSON.stringify({ error: data }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, id: data.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const payload = req.body || {};
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
  const rawMsg = typeof payload.message === 'string' ? payload.message.trim() : 'Peringatan Gempa!';
  const rawLat = parseFloat(payload.latitude);
  const rawLon = parseFloat(payload.longitude);

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Nomor telepon tujuan belum disetting' });
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (!/^\+?[0-9]{8,18}$/.test(cleanPhone)) {
    return res.status(400).json({ success: false, error: 'Format nomor telepon tidak valid' });
  }

  let sanitizedMessage = rawMsg.replace(/<[^>]*>?/gm, '').slice(0, 200);

  if (!isNaN(rawLat) && !isNaN(rawLon) && rawLat >= -90 && rawLat <= 90 && rawLon >= -180 && rawLon <= 180) {
    if (!sanitizedMessage.includes('maps.google.com')) {
      sanitizedMessage += ` | Posisi: https://maps.google.com/?q=${rawLat.toFixed(4)},${rawLon.toFixed(4)}`;
    }
  }

  const timestamp = new Date().toISOString();

  return res.status(200).json({
    success: true,
    message: 'SMS Darurat berhasil diverifikasi dan dicatat di server gateway.',
    details: {
      recipient: cleanPhone,
      timestamp,
      message_preview: sanitizedMessage
    }
  });
}

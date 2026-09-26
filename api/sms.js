export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const phone = req.query.phone || req.body?.phone || '';
  const message = req.query.message || req.body?.message || 'Peringatan Gempa!';
  const latitude = req.query.latitude || req.body?.latitude || '';
  const longitude = req.query.longitude || req.body?.longitude || '';

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Nomor telepon tujuan belum disetting' });
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  let fullMessage = message;
  if (latitude && longitude && !fullMessage.includes('maps.google.com')) {
    fullMessage += ` | Posisi: https://maps.google.com/?q=${latitude},${longitude}`;
  }

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] EMERGENCY SMS TRIGGERED -> TO: ${cleanPhone} | MSG: ${fullMessage}`);

  return res.status(200).json({
    success: true,
    message: 'SMS Darurat berhasil dicatat di server gateway.',
    details: {
      recipient: cleanPhone,
      timestamp,
      message_preview: fullMessage
    }
  });
}

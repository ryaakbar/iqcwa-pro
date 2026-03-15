// api/generate.js — IQC WA Generator

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const {
            time,
            messageText,
            carrierName,
            batteryPercentage,
            signalStrength
        } = req.method === 'POST' ? req.body : req.query;

        if (!time || !messageText) {
            return res.status(400).json({
                error: 'Parameter time dan messageText wajib diisi.'
            });
        }

        const apiUrl = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&messageText=${encodeURIComponent(messageText)}&carrierName=${encodeURIComponent(carrierName || 'INDOSAT OOREDOO')}&batteryPercentage=${encodeURIComponent(batteryPercentage || '80')}&signalStrength=${encodeURIComponent(signalStrength || '4')}`;

        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'image/png,image/*,*/*',
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: `API eksternal error: HTTP ${response.status}`,
            });
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('image')) {
            return res.status(502).json({ error: 'API tidak mengembalikan image.' });
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length < 500) {
            return res.status(502).json({ error: 'Response image terlalu kecil / kosong.' });
        }

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'inline; filename="iqc-wa.png"');
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(200).send(buffer);

    } catch (error) {
        return res.status(500).json({
            error: 'Server error: ' + error.message,
        });
    }
}

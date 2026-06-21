const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

const MERCHANT_ID = process.env.XSOLLA_MERCHANT_ID;
const API_KEY = process.env.XSOLLA_API_KEY;
const PROJECT_ID = process.env.XSOLLA_PROJECT_ID;

app.get('/', (req, res) => res.send('🚀 DARK WORLD REAL PAYMENT SERVER IS LIVE!'));

app.post('/generate-token', async (req, res) => {
    const { user_id, item_sku } = req.body;

    if (!MERCHANT_ID || !API_KEY || !PROJECT_ID) {
        return res.status(500).json({ error: 'متغيرات Xsolla غير موجودة' });
    }

    const auth = Buffer.from(`${MERCHANT_ID}:${API_KEY}`).toString('base64');

    try {
        const response = await axios.post(
            `https://api.xsolla.com/merchant/v2/merchants/${MERCHANT_ID}/token`,
            {
                user: { id: { value: user_id } },
                settings: {
                    project_id: parseInt(PROJECT_ID),
                    mode: 'production'
                },
                purchase: { list: [{ sku: item_sku, quantity: 1 }] }
            },
            { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
        );

        res.json({ token: response.data.token });
    } catch (error) {
        console.error('خطأ Xsolla:', error.response?.data || error.message);
        res.status(500).json({ error: 'فشل الاتصال ببوابة Xsolla' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));

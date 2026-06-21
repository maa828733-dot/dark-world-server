const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ DB Connection Error:', err));

app.get('/', (req, res) => {
    res.send('🚀 DARK WORLD SERVER IS LIVE AND PROTECTED!');
});

app.post('/generate-token', async (req, res) => {
    try {
        const { user_id, item_sku } = req.body;
        const auth = Buffer.from(`${process.env.XSOLLA_MERCHANT_ID}:${process.env.XSOLLA_API_KEY}`).toString('base64');

        const response = await axios.post(
            `https://api.xsolla.com/merchant/v2/merchants/${process.env.XSOLLA_MERCHANT_ID}/token`,
            {
                user: { id: { value: user_id } },
                settings: {
                    project_id: parseInt(process.env.XSOLLA_PROJECT_ID),
                    mode: 'production'   // ✅ الآن الدفع حقيقي
                },
                purchase: { list: [{ sku: item_sku, quantity: 1 }] }
            },
            { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
        );
        res.json({ token: response.data.token });
    } catch (error) {
        console.error('Xsolla Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));

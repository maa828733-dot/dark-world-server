const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// الربط بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Connection Error:', err));

app.get('/', (req, res) => {
    res.send('🚀 DARK WORLD SERVER IS LIVE AND WAITING!');
});

app.post('/generate-token', async (req, res) => {
    const { user_id, item_sku } = req.body;
    
    const m_id = process.env.XSOLLA_MERCHANT_ID;
    const a_key = process.env.XSOLLA_API_KEY;
    const p_id = process.env.XSOLLA_PROJECT_ID;

    const auth = Buffer.from(`${m_id}:${a_key}`).toString('base64');

    try {
        const response = await axios.post(
            `https://api.xsolla.com/merchant/v2/merchants/${m_id}/token`,
            {
                user: { id: { value: user_id } },
                settings: { project_id: parseInt(p_id), mode: 'production' },
                purchase: { list: [{ sku: item_sku, quantity: 1 }] }
            },
            { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
        );
        res.json({ token: response.data.token });
    } catch (error) {
        console.error('❌ Xsolla API Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Xsolla Error', details: error.response?.data });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// --- 1. الإعدادات الأساسية ---
app.use(cors());
app.use(express.json());

// --- 2. الربط بقاعدة البيانات MongoDB ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ DATABASE CONNECTED (ذاكرة الحيتان جاهزة)'))
  .catch(err => console.error('❌ Database Connection Error:', err));

// --- 3. صفحة الفحص الرئيسية ---
app.get('/', (req, res) => {
    res.send('🚀 DARK WORLD SERVER: ONLINE | MODE: SANDBOX');
});

// --- 4. وظيفة توليد توكن الدفع (Xsolla) ---
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
                user: {
                    id: { value: user_id },
                    name: { value: "Agent_" + user_id }
                },
                settings: {
                    project_id: parseInt(p_id),
                    mode: 'sandbox',
                    return_url: "https://4a731.netlify.app",
                    currency: "USD"
                },
                purchase: {
                    checkout: { currency: "USD" },
                    mode: "payment",
                    custom_parameters: { user_id },
                    list: [{ sku: item_sku, quantity: 1 }]
                }
            },
            {
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("TOKEN:", response.data.token);
        res.json({ token: response.data.token });

    } catch (error) {
        console.error("❌ XSOLLA ERROR:", error.response?.data || error.message);
        res.status(500).json({
            error: "Failed to generate token",
            details: error.response?.data
        });
    }
});

// --- 5. استقبال إشعار نجاح الدفع (Webhook) ---
app.post('/webhook', express.raw({ type: '*/*' }), (req, res) => {
    try {
        const payload = req.body.toString();
        const signature = req.headers['authorization'];
        const secret = process.env.XSOLLA_WEBHOOK_SECRET;

        const hash = crypto.createHmac('sha1', secret).update(payload).digest('base64');

        if (hash !== signature) {
            console.log('❌ Webhook signature mismatch!');
            return res.status(403).send('Invalid signature');
        }

        const data = JSON.parse(payload);

        if (data.notification_type === 'payment') {
            const uid = data.user.id;
            const sku = data.purchase.list[0].sku;
            console.log(`💰 دفع ناجح! اللاعب ${uid} اشترى ${sku}`);
        }

        res.status(204).send();
    } catch (err) {
        console.error('❌ Webhook Error:', err);
        res.status(500).send();
    }
});

// --- 6. تشغيل السيرفر ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DARK WORLD SERVER IS RUNNING ON PORT ${PORT}`);
});

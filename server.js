const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
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
    
    // جلب المفاتيح من بيئة Render
    const m_id = process.env.XSOLLA_MERCHANT_ID;
    const a_key = process.env.XSOLLA_API_KEY;
    const p_id = process.env.XSOLLA_PROJECT_ID;

    // تشفير الهوية (Authorization Header)
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
                    mode: 'sandbox' // 🛡️ وضع الأمان والتجربة (نصيحة ديب سيك)
                },
                purchase: {
                    list: [{ sku: item_sku, quantity: 1 }]
                }
            },
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ SUCCESS: Token Generated for', item_sku);
        res.json({ token: response.data.token });

    } catch (error) {
        console.error('❌ XSOLLA ERROR:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to generate token', 
            details: error.response?.data 
        });
    }
});

// --- 5. استقبال إشعار نجاح الدفع (Webhook) ---
app.post('/webhook', async (req, res) => {
    const data = req.body;
    if (data.notification_type === 'payment') {
        const uid = data.user.id;
        const sku = data.purchase.list[0].sku;
        console.log(`💰💰💰 دفع ناجح! اللاعب ${uid} اشترى ${sku}`);
        // هنا مستقبلاً نضيف كود تفعيل الـ VIP في MongoDB
    }
    res.status(204).send();
});

// --- 6. تشغيل السيرفر ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DARK WORLD SERVER IS RUNNING ON PORT ${PORT}`);
});

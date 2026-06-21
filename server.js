const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 الربط مع MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// 📊 نموذج الدفعات
const Payment = mongoose.model('Payment', {
    userId: String,
    amount: Number,
    currency: String,
    status: String,
    product: String,
    createdAt: { type: Date, default: Date.now }
});

// 🔔 استقبال Webhook من Xsolla
app.post('/webhook', async (req, res) => {
    const event = req.body;
    console.log('🔔 Webhook:', JSON.stringify(event));
    
    try {
        if (event.notification_type === 'payment') {
            await Payment.create({
                userId: event.user?.id || 'unknown',
                amount: event.payment?.amount || 0,
                currency: event.payment?.currency || 'USD',
                status: 'completed',
                product: event.items?.[0]?.sku || 'unknown'
            });
            console.log('✅ Payment saved');
        }
        res.status(200).json({message: 'OK'});
    } catch (err) {
        console.error('❌ Error:', err);
        res.status(500).json({error: err.message});
    }
});

// 💳 إنشاء Payment Token
app.post('/api/payment-token', async (req, res) => {
    try {
        const { amount, product, userId } = req.body;
        
        const auth = Buffer.from(process.env.XSOLLA_MERCHANT_ID + ':' + process.env.XSOLLA_API_KEY).toString('base64');
        
        const response = await fetch('https://api.xsolla.com/merchant/v2/merchants/' + process.env.XSOLLA_MERCHANT_ID + '/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + auth,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: { id: userId || 'guest' },
                purchase: {
                    items: [{
                        sku: product,
                        amount: 1
                    }]
                },
                settings: {
                    project_id: parseInt(process.env.XSOLLA_PROJECT_ID),
                    currency: 'USD'
                }
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// 🏠 الصفحة الرئيسية
app.get('/', (req, res) => {
    res.json({ 
        status: 'DARK WORLD SERVER IS LIVE',
        project: process.env.XSOLLA_PROJECT_ID,
        timestamp: new Date()
    });
});

// 📊 إحصائيات الدفعات
app.get('/api/stats', async (req, res) => {
    try {
        const payments = await Payment.find().sort({createdAt: -1}).limit(10);
        const total = await Payment.aggregate([{$group: {_id: null, sum: {$sum: '$amount'}}}]);
        res.json({ 
            payments, 
            totalRevenue: total[0]?.sum || 0,
            count: payments.length
        });
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🚀 DARK WORLD SERVER RUNNING ON PORT', PORT);
});
                               

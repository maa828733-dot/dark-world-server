// --- 5. استقبال إشعار نجاح الدفع (Webhook) ---
app.post('/webhook', express.raw({ type: '*/*' }), (req, res) => {
    try {
        const payload = req.body.toString();
        const signature = req.headers['authorization'];
        const secret = process.env.XSOLLA_WEBHOOK_SECRET;

        const crypto = require('crypto');
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

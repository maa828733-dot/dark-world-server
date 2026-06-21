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
                    checkout: {
                        currency: "USD"
                    },
                    mode: "payment",
                    custom_parameters: {
                        user_id: user_id
                    },
                    list: [
                        {
                            sku: item_sku,
                            quantity: 1
                        }
                    ]
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
        console.error("XSOLLA ERROR:", error.response?.data || error.message);
        res.status(500).json({
            error: "Failed to generate token",
            details: error.response?.data
        });
    }
});

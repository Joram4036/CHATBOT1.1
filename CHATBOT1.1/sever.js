// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { processIncomingMessage } = require('./botLogic');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your_secure_verify_token';

// Meta Webhook Verification Endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified successfully.');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Incoming Message Endpoint
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        try {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    const messageData = change.value.messages;
                    if (messageData && messageData[0]) {
                        const message = messageData[0];
                        const senderPhone = message.from;
                        await processIncomingMessage(senderPhone, message);
                    }
                }
            }
            res.sendStatus(200);
        } catch (error) {
            console.error('Error processing message:', error);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(404);
    }
});

app.listen(PORT, () => {
    console.log(`WhatsApp E-commerce Bot listening on port ${PORT}`);
});
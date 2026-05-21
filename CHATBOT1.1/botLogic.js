// botLogic.js
const { getSession, updateSession, clearSession, STATES } = require('./sessionManager');
const { sendTextMessage, sendInteractiveButtons } = require('./whatsappAPI');

// Mock Product Database
const PRODUCTS = [
    { id: 'p1', name: 'Wireless Earbuds', price: 49.99 },
    { id: 'p2', name: 'Smart Watch', price: 199.99 }
];

async function processIncomingMessage(senderPhone, message) {
    const session = getSession(senderPhone);
    const messageType = message.type;
    
    // Extract text or button payload
    let userInput = '';
    if (messageType === 'text') userInput = message.text.body.toLowerCase();
    if (messageType === 'interactive') userInput = message.interactive.button_reply.id;

    // Global reset command
    if (userInput === 'cancel' || userInput === 'restart') {
        clearSession(senderPhone);
        await sendTextMessage(senderPhone, "Session cleared. Say 'hi' to start over.");
        return;
    }

    switch (session.state) {
        case STATES.IDLE:
            await handleWelcome(senderPhone);
            break;

        case STATES.BROWSING:
            await handleBrowsing(senderPhone, userInput, session);
            break;

        case STATES.CART_REVIEW:
            await handleCartReview(senderPhone, userInput, session);
            break;

        case STATES.CHECKOUT:
            await handleCheckout(senderPhone, userInput, session);
            break;

        default:
            await handleWelcome(senderPhone);
    }
}

async function handleWelcome(phone) {
    const text = "Welcome to TechStore! 🚀 How can we help you today?";
    const buttons = [
        { id: 'view_catalog', title: '🛍️ View Catalog' },
        { id: 'support', title: '🎧 Support' }
    ];
    
    await sendInteractiveButtons(phone, text, buttons);
    updateSession(phone, { state: STATES.BROWSING });
}

async function handleBrowsing(phone, input, session) {
    if (input === 'view_catalog') {
        let catalogText = "Here are our top products:\n\n";
        PRODUCTS.forEach(p => catalogText += `*${p.name}* - $${p.price}\nReply with '${p.id}' to add to cart.`);
        
        await sendTextMessage(phone, catalogText);
        // State remains BROWSING until an item is selected
    } 
    else if (PRODUCTS.find(p => p.id === input)) {
        const product = PRODUCTS.find(p => p.id === input);
        const newCart = [...session.cart, product];
        
        updateSession(phone, { cart: newCart, state: STATES.CART_REVIEW });
        
        const text = `Added *${product.name}* to your cart. You have ${newCart.length} item(s).`;
        const buttons = [
            { id: 'checkout', title: '💳 Checkout' },
            { id: 'view_catalog', title: '🛒 Keep Shopping' }
        ];
        
        await sendInteractiveButtons(phone, text, buttons);
    } else {
        await sendTextMessage(phone, "Please select an option from the menu, or type a product ID.");
    }
}

async function handleCartReview(phone, input, session) {
    if (input === 'view_catalog') {
        updateSession(phone, { state: STATES.BROWSING });
        await handleBrowsing(phone, 'view_catalog', session);
    } 
    else if (input === 'checkout') {
        const total = session.cart.reduce((sum, item) => sum + item.price, 0);
        updateSession(phone, { state: STATES.CHECKOUT });
        
        await sendTextMessage(phone, `Your total is *$${total.toFixed(2)}*.\nPlease reply with your full delivery address to finalize the order.`);
    }
}

async function handleCheckout(phone, input, session) {
    // In a real app, this is where you trigger Stripe/PayPal links or save to a DB
    const orderId = `ORD-${Math.floor(Math.random() * 10000)}`;
    const address = input; // Capturing the text input as address
    
    await sendTextMessage(phone, `🎉 Order confirmed! Your Order ID is *${orderId}*.\nWe will ship it to: ${address}\n\nThank you for shopping with us!`);
    
    clearSession(phone); // Reset for the next interaction
}

module.exports = { processIncomingMessage };
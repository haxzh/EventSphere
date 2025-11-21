const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../controllers/checkoutController');

// allow client to POST session_id after redirect so server can finalize registration
const { processSessionById } = require('../controllers/webhookController');

router.post('/create-checkout-session', createCheckoutSession);

router.post('/checkout-complete', processSessionById);

module.exports = router;

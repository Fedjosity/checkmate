import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';

const router = Router();

// POST /webhooks/flutterwave — NO auth middleware
router.post('/flutterwave', webhookController.handleFlutterwave);
router.post('/didit', webhookController.handleDidit);

export default router;

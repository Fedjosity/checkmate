import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { walletController } from '../controllers/wallet.controller';
import { depositSchema, withdrawSchema, bankAccountSchema } from '../schemas/wallet.schema';

const router = Router();

// GET /v1/wallet/balance
router.get('/balance', requireAuth, walletController.getBalance);

// POST /v1/wallet/deposit
router.post('/deposit', requireAuth, validateRequest(depositSchema), walletController.initiateDeposit);

// POST /v1/wallet/withdraw
router.post('/withdraw', requireAuth, validateRequest(withdrawSchema), walletController.initiateWithdrawal);

// GET /v1/wallet/transactions
router.get('/transactions', requireAuth, walletController.getTransactions);

// Bank account management
router.get('/bank-account', requireAuth, walletController.getBankAccount);
router.post('/bank-account', requireAuth, validateRequest(bankAccountSchema), walletController.saveBankAccount);

export default router;

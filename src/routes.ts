import { Router } from 'express';
import {
    parseTransactions,
    validate,
    filterTransactions,
    npsReturns,
    indexReturns,
    getPerformance
} from './controllers/transactionsController';

const router = Router();

router.post('/transactions:parse', parseTransactions);
router.post('/transactions:validator', validate);
router.post('/transactions:filter', filterTransactions);
router.post('/returns:nps', npsReturns);
router.post('/returns:index', indexReturns);
router.get('/performance', getPerformance);

export default router;

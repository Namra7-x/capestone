import { Router } from 'express';
import * as todoController from '../controllers/todoController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', todoController.list);
router.get('/stats', todoController.stats);
router.get('/:id', todoController.show);
router.post('/', todoController.create);
router.put('/:id', todoController.update);
router.patch('/:id/toggle', todoController.toggle);
router.delete('/:id', todoController.remove);

export default router;

import { Router } from 'express';

import studentRouter from './student.js';
import authRouter from './auth.js';

const router = Router();

router.use('/students', studentRouter);
router.use('/auth', authRouter);

export default router;

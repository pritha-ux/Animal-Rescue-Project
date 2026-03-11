import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getUsersByRole, getDashboardStats, updateUserRole, closeCase, deleteUser } from '../controllers/adminController.js';

const router = express.Router();
router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/users/:role', protect, adminOnly, getUsersByRole);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);
router.put('/cases/:id/close', protect, adminOnly, closeCase);
router.delete('/users/:id', protect, adminOnly, deleteUser);

export default router;

import express from 'express';
import { protect, roleCheck } from '../middleware/auth.js';
import { getAssignedCases, acceptCase, declineCase, updateToInTransit } from '../controllers/volunteerController.js';

const router = express.Router();

router.get('/cases', protect, roleCheck('volunteer'), getAssignedCases);
router.put('/cases/:id/accept', protect, roleCheck('volunteer'), acceptCase);
router.put('/cases/:id/decline', protect, roleCheck('volunteer'), declineCase);
router.put('/cases/:id/transit', protect, roleCheck('volunteer'), updateToInTransit);

export default router;

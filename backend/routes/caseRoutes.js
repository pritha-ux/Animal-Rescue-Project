import express from 'express';
import { protect, roleCheck } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  reportCase, trackCase, getMyCases,
  getAllCases, assignVolunteer, assignVet,
  assignShelter, getCaseById,
} from '../controllers/caseController.js';

const router = express.Router();

// Public: report and track
router.get('/track/:caseId', protect, trackCase);
router.get('/my', protect, getMyCases);
router.post('/report', protect, roleCheck('public', 'volunteer', 'veterinarian', 'shelter_staff', 'admin'), upload.array('images', 5), reportCase);

// Admin
router.get('/', protect, roleCheck('admin'), getAllCases);
router.get('/:id', protect, getCaseById);
router.put('/:id/assign-volunteer', protect, roleCheck('admin'), assignVolunteer);
router.put('/:id/assign-vet', protect, roleCheck('admin'), assignVet);
router.put('/:id/assign-shelter', protect, roleCheck('admin'), assignShelter);

export default router;

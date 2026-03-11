import express from 'express';
import { protect, roleCheck } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { getVetCases, markAtVet, addMedicalRecord, markTreatmentDone } from '../controllers/vetController.js';

const router = express.Router();
router.get('/cases', protect, roleCheck('veterinarian'), getVetCases);
router.put('/cases/:id/arrived', protect, roleCheck('veterinarian'), markAtVet);
router.post('/cases/:id/medical', protect, roleCheck('veterinarian'), upload.array('documents', 5), addMedicalRecord);
router.put('/cases/:id/treatment-done', protect, roleCheck('veterinarian'), markTreatmentDone);

export default router;

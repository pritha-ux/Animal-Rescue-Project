import express from 'express';
import { protect, roleCheck } from '../middleware/auth.js';
import { getShelterCases, markAtShelter, updateCareDetails, markAdopted, markReturnedToOwner } from '../controllers/shelterController.js';

const router = express.Router();
router.get('/cases', protect, roleCheck('shelter_staff'), getShelterCases);
router.put('/cases/:id/admit', protect, roleCheck('shelter_staff'), markAtShelter);
router.put('/cases/:id/care', protect, roleCheck('shelter_staff'), updateCareDetails);
router.put('/cases/:id/adopt', protect, roleCheck('shelter_staff'), markAdopted);
router.put('/cases/:id/return', protect, roleCheck('shelter_staff'), markReturnedToOwner);

export default router;
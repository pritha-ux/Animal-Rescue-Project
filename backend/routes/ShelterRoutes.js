import express from 'express';
import { protect, roleCheck } from '../middleware/auth.js';
import {
  getShelterCases,
  markAtShelter,
  updateCareDetails,
  markAdopted,
  markReturnedToOwner,
} from '../controllers/ShelterController.js';

const router = express.Router();

router.use(protect, roleCheck('shelter_staff'));

router.get('/cases', getShelterCases);
router.put('/cases/:id/admit', markAtShelter);
router.put('/cases/:id/care', updateCareDetails);
router.put('/cases/:id/adopt', markAdopted);
router.put('/cases/:id/return', markReturnedToOwner);

export default router;
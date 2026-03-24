import express from 'express';
import { protect, roleCheck } from '../middleware/auth.js';
import { getShelterCases, markAtShelter, updateCareDetails, markAdopted, markReturnedToOwner, acceptShelterCase, declineShelterCase } from '../controllers/ShelterController.js';


const router = express.Router();

router.use(protect, roleCheck('shelter_staff'));

router.get('/cases', getShelterCases);
router.put('/cases/:id/admit', markAtShelter);
router.put('/cases/:id/care', updateCareDetails);
router.put('/cases/:id/adopt', markAdopted);
router.put('/cases/:id/return', markReturnedToOwner);
router.put('/cases/:id/accept', protect, roleCheck('shelter_staff'), acceptShelterCase);
router.put('/cases/:id/decline', protect, roleCheck('shelter_staff'), declineShelterCase);

export default router;
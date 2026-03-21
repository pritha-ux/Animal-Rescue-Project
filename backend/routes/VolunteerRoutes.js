import express from 'express';
import { protect, roleCheck } from '../middleware/auth.js';
import { getAssignedCases, acceptCase, declineCase, updateToInTransit, assignVetByVolunteer, assignShelterByVolunteer } from '../controllers/volunteerController.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/cases', protect, roleCheck('volunteer'), getAssignedCases);
router.put('/cases/:id/accept', protect, roleCheck('volunteer'), acceptCase);
router.put('/cases/:id/decline', protect, roleCheck('volunteer'), declineCase);
router.put('/cases/:id/transit', protect, roleCheck('volunteer'), updateToInTransit);
router.put('/cases/:id/assign-vet', protect, roleCheck('volunteer'), assignVetByVolunteer);
router.put('/cases/:id/assign-shelter', protect, roleCheck('volunteer'), assignShelterByVolunteer);

// Get all vets and shelters for dropdown
router.get('/staff', protect, roleCheck('volunteer'), async (req, res) => {
  try {
    const vets = await User.find({ role: 'veterinarian' }).select('name email phone');
    const shelters = await User.find({ role: 'shelter_staff' }).select('name email phone');
    res.json({ vets, shelters });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
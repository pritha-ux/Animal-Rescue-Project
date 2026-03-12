import User from '../models/User.js';
import Case from '../models/Case.js';
import Notification from '../models/Notification.js';

// Admin: Get all users by role
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalCases = await Case.countDocuments();
    const reported = await Case.countDocuments({ status: 'reported' });
    const assigned = await Case.countDocuments({ status: 'assigned' });
    const inTransit = await Case.countDocuments({ status: 'in_transit' });
    const atVet = await Case.countDocuments({ status: 'at_vet' });
    const atShelter = await Case.countDocuments({ status: 'at_shelter' });
    const adopted = await Case.countDocuments({ status: 'adopted' });
    const returned = await Case.countDocuments({ status: 'returned_to_owner' });
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const totalVets = await User.countDocuments({ role: 'veterinarian' });
    const totalShelterStaff = await User.countDocuments({ role: 'shelter_staff' });
    const recentCases = await Case.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reportedBy', 'name');

    res.json({
      totalCases,
      statusBreakdown: { reported, assigned, inTransit, atVet, atShelter, adopted, returned },
      staff: { totalVolunteers, totalVets, totalShelterStaff },
      recentCases,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Role updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Close a case
export const closeCase = async (req, res) => {
  try {
    const { note } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    caseData.status = 'closed';
    caseData.statusHistory.push({
      status: 'closed',
      updatedBy: req.user._id,
      note: note || 'Case closed by admin',
    });
    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `Case ${caseData.caseId} has been officially closed. Thank you for reporting.`,
      type: 'status_update',
    });

    res.json({ message: 'Case closed', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Delete user
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

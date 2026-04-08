import Case from '../models/Case.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// ── Helper: notify all admins ──
const notifyAdmin = async (caseId, message) => {
  try {
    const admins = await User.find({ role: 'admin' }, '_id');
    await Promise.all(admins.map(admin =>
      Notification.create({ caseId, recipient: admin._id, message, type: 'status_update' })
    ));
  } catch (err) {
    console.error('Failed to notify admin:', err.message);
  }
};

export const getAssignedCases = async (req, res) => {
  try {
    const cases = await Case.find({ assignedVolunteer: req.user._id })
      .populate('reportedBy', 'name phone')
      .populate('assignedVet', 'name')
      .populate('assignedShelter', 'name')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const acceptCase = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (String(caseData.assignedVolunteer) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this case' });

    caseData.status = 'volunteer_accepted';
    caseData.statusHistory.push({
      status: 'volunteer_accepted',
      updatedBy: req.user._id,
      note: 'Volunteer accepted the case',
    });
    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `Good news! A volunteer has accepted your case ${caseData.caseId} and is on the way.`,
      type: 'status_update',
    });

    await notifyAdmin(caseData._id, `Volunteer accepted case ${caseData.caseId}`);

    res.json({ message: 'Case accepted', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const declineCase = async (req, res) => {
  try {
    const { reason } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (String(caseData.assignedVolunteer) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this case' });

    caseData.status = 'volunteer_declined';
    caseData.assignedVolunteer = null;
    caseData.statusHistory.push({
      status: 'volunteer_declined',
      updatedBy: req.user._id,
      note: reason || 'Volunteer declined the case',
    });
    await caseData.save();

    await notifyAdmin(caseData._id, `Volunteer declined case ${caseData.caseId}`);

    res.json({ message: 'Case declined', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateToInTransit = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (String(caseData.assignedVolunteer) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this case' });

    caseData.status = 'in_transit';
    caseData.statusHistory.push({
      status: 'in_transit',
      updatedBy: req.user._id,
      note: 'Animal picked up, in transit to vet',
    });
    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `The animal from case ${caseData.caseId} has been picked up and is on the way to the veterinarian.`,
      type: 'status_update',
    });

    await notifyAdmin(caseData._id, `Case ${caseData.caseId} is now in transit to vet`);

    res.json({ message: 'Status updated to in transit', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const assignVetByVolunteer = async (req, res) => {
  try {
    const { vetId } = req.body;
    const caseData = await Case.findByIdAndUpdate(
      req.params.id,
      { assignedVet: vetId },
      { new: true }
    );
    await Notification.create({
      recipient: vetId,
      caseId: caseData._id,
      message: `You have been assigned as vet for case ${caseData.caseId}`,
      type: 'assignment'
    });

    await notifyAdmin(caseData._id, `Volunteer assigned vet to case ${caseData.caseId}`);

    res.json(caseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const assignShelterByVolunteer = async (req, res) => {
  try {
    const { shelterId } = req.body;
    const caseData = await Case.findByIdAndUpdate(
      req.params.id,
      { assignedShelter: shelterId },
      { new: true }
    );
    await Notification.create({
      recipient: shelterId,
      caseId: caseData._id,
      message: `A case ${caseData.caseId} has been assigned to your shelter`,
      type: 'assignment'
    });

    await notifyAdmin(caseData._id, `Volunteer assigned shelter to case ${caseData.caseId}`);

    res.json(caseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markInTransitToShelter = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);

    caseItem.status = 'in_transit_to_shelter';
    caseItem.statusHistory.push({
      status: 'in_transit_to_shelter',
      note: 'Moving animal to shelter',
      updatedBy: req.user._id,
    });
    await caseItem.save();

    await notifyAdmin(caseItem._id, `Case ${caseItem.caseId} is now in transit to shelter`);

    res.json(caseItem);
  } catch (err) {
    res.status(500).json({ message: 'Error updating status' });
  }
};
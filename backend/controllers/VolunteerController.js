import Case from '../models/Case.js';
import Notification from '../models/Notification.js';

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
    res.json(caseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
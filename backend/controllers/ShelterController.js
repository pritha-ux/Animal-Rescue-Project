import Case from '../models/Case.js';
import Notification from '../models/Notification.js';

export const acceptShelterCase = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (String(caseData.assignedShelter) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this shelter' });

    caseData.status = 'shelter_accepted';
    caseData.statusHistory.push({
      status: 'shelter_accepted',
      updatedBy: req.user._id,
      note: 'Shelter accepted the case',
      timestamp: new Date(),
    });
    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `A shelter has accepted case ${caseData.caseId}.`,
      type: 'status_update',
    });

    res.json({ message: 'Case accepted', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const declineShelterCase = async (req, res) => {
  try {
    const { reason } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (String(caseData.assignedShelter) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this shelter' });

    // Clear shelter — goes back to volunteer to reassign
    caseData.assignedShelter = null;
    caseData.status = 'shelter_declined';
    caseData.statusHistory.push({
      status: 'shelter_declined',
      updatedBy: req.user._id,
      note: reason || 'Shelter declined the case',
      timestamp: new Date(),
    });
    await caseData.save();

    // Notify volunteer to reassign
    if (caseData.assignedVolunteer) {
      await Notification.create({
        caseId: caseData._id,
        recipient: caseData.assignedVolunteer,
        message: `Shelter declined case ${caseData.caseId}. Please assign a new shelter.`,
        type: 'alert',
      });
    }

    res.json({ message: 'Case declined', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAtShelter = async (req, res) => {
  try {
    const { cage_number, diet, health_status, notes } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    caseData.status = 'at_shelter';
    caseData.shelterDetails = { cage_number, diet, health_status, notes };
    caseData.statusHistory.push({
      status: 'at_shelter',
      updatedBy: req.user._id,
      note: 'Animal admitted to shelter',
      timestamp: new Date(),
    });
    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `The animal from case ${caseData.caseId} has been admitted to shelter.`,
      type: 'status_update',
    });

    res.json({ message: 'Animal admitted to shelter', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCareDetails = async (req, res) => {
  try {
    const { diet, health_status, notes } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    caseData.shelterDetails = {
      ...caseData.shelterDetails,
      diet,
      health_status,
      notes
    };
    caseData.statusHistory.push({
      status: caseData.status,
      updatedBy: req.user._id,
      note: 'Care details updated',
      timestamp: new Date(),
    });
    await caseData.save();

    res.json({ message: 'Care details updated', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAdopted = async (req, res) => {
  try {
    const { adopterName, adopterContact, notes } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    caseData.status = 'adopted';
    caseData.outcome = 'adopted';
    caseData.outcomeDetails = { adopterName, adopterContact, notes };
    caseData.statusHistory.push({
      status: 'adopted',
      updatedBy: req.user._id,
      note: `Animal adopted by ${adopterName}`,
      timestamp: new Date(),
    });
    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `Great news! The animal from case ${caseData.caseId} has been adopted by ${adopterName}.`,
      type: 'status_update',
    });

    res.json({ message: 'Animal marked as adopted', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markReturnedToOwner = async (req, res) => {
  try {
    const { ownerName, ownerContact, notes } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    caseData.status = 'returned_to_owner';
    caseData.outcome = 'returned_to_owner';
    caseData.outcomeDetails = { ownerName, ownerContact, notes };
    caseData.statusHistory.push({
      status: 'returned_to_owner',
      updatedBy: req.user._id,
      note: `Animal returned to owner: ${ownerName}`,
      timestamp: new Date(),
    });
    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `The animal from case ${caseData.caseId} has been returned to its owner.`,
      type: 'status_update',
    });

    res.json({ message: 'Animal returned to owner', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
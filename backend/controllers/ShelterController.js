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

export const getShelterCases = async (req, res) => {
  try {
    const cases = await Case.find({ assignedShelter: req.user._id })
      .populate('reportedBy', 'name phone')
      .populate('assignedVet', 'name')
      .populate('assignedVolunteer', 'name')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

    await notifyAdmin(caseData._id, `Shelter accepted case ${caseData.caseId}`);

    res.json({ message: 'Case accepted', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateShelterLocation = async (req, res) => {
  try {
    const { location } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (String(caseData.assignedShelter) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this shelter' });

    if (!location?.lat || !location?.lng)
      return res.status(400).json({ message: 'Invalid location — lat and lng required' });

    caseData.shelterLocation = {
      lat: location.lat,
      lng: location.lng,
      address: location.address || ''
    };
    await caseData.save();

    if (caseData.assignedVolunteer) {
      await Notification.create({
        caseId: caseData._id,
        recipient: caseData.assignedVolunteer,
        message: `Shelter has pinned their location for case ${caseData.caseId}.`,
        type: 'status_update',
      });
    }

    await notifyAdmin(caseData._id, `Shelter pinned location for case ${caseData.caseId}`);

    res.json({ message: 'Shelter location updated', case: caseData });
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

    caseData.assignedShelter = null;
    caseData.status = 'shelter_declined';
    caseData.statusHistory.push({
      status: 'shelter_declined',
      updatedBy: req.user._id,
      note: reason || 'Shelter declined the case',
      timestamp: new Date(),
    });
    await caseData.save();

    if (caseData.assignedVolunteer) {
      await Notification.create({
        caseId: caseData._id,
        recipient: caseData.assignedVolunteer,
        message: `Shelter declined case ${caseData.caseId}. Please assign a new shelter.`,
        type: 'alert',
      });
    }

    await notifyAdmin(caseData._id, `Shelter declined case ${caseData.caseId}`);

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

    await notifyAdmin(caseData._id, `Animal admitted to shelter for case ${caseData.caseId}`);

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

    caseData.shelterDetails = { ...caseData.shelterDetails, diet, health_status, notes };
    caseData.statusHistory.push({
      status: caseData.status,
      updatedBy: req.user._id,
      note: 'Care details updated',
      timestamp: new Date(),
    });
    await caseData.save();

    await notifyAdmin(caseData._id, `Care details updated for case ${caseData.caseId}`);

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

    await notifyAdmin(caseData._id, `Animal from case ${caseData.caseId} adopted by ${adopterName}`);

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

    await notifyAdmin(caseData._id, `Animal from case ${caseData.caseId} returned to owner: ${ownerName}`);

    res.json({ message: 'Animal returned to owner', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
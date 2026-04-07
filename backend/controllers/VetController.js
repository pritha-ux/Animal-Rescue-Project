import Case from '../models/Case.js';
import Notification from '../models/Notification.js';

// Vet: Get assigned cases
export const getVetCases = async (req, res) => {
  try {
    const cases = await Case.find({ assignedVet: req.user._id })
      .populate('reportedBy', 'name')
      .populate('assignedVolunteer', 'name phone')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const acceptVetCase = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    if (String(caseData.assignedVet) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this case' });

    caseData.status = 'vet_accepted';
    caseData.statusHistory.push({
      status: 'vet_accepted',
      updatedBy: req.user._id,
      note: 'Veterinarian accepted the case',
      timestamp: new Date(),
    });

    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `A veterinarian has accepted case ${caseData.caseId}.`,
      type: 'status_update',
    });

    res.json({ message: 'Case accepted', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── NEW: Vet pins clinic location separately after accepting ──
export const updateVetLocation = async (req, res) => {
  try {
    const { location } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (String(caseData.assignedVet) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this case' });

    if (!location?.lat || !location?.lng)
      return res.status(400).json({ message: 'Invalid location — lat and lng required' });

    caseData.vetLocation = {
      lat: location.lat,
      lng: location.lng,
      address: location.address || ''
    };

    await caseData.save();

    // Notify volunteer that vet pinned location
    if (caseData.assignedVolunteer) {
      await Notification.create({
        caseId: caseData._id,
        recipient: caseData.assignedVolunteer,
        message: `Vet has pinned their clinic location for case ${caseData.caseId}.`,
        type: 'status_update',
      });
    }

    res.json({ message: 'Clinic location updated', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const declineVetCase = async (req, res) => {
  try {
    const { reason } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (String(caseData.assignedVet) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this case' });

    caseData.assignedVet = null;
    caseData.status = 'vet_declined';
    caseData.statusHistory.push({
      status: 'vet_declined',
      updatedBy: req.user._id,
      note: reason || 'Veterinarian declined the case',
      timestamp: new Date(),
    });
    await caseData.save();

    if (caseData.assignedVolunteer) {
      await Notification.create({
        caseId: caseData._id,
        recipient: caseData.assignedVolunteer,
        message: `Vet declined case ${caseData.caseId}. Please assign a new veterinarian.`,
        type: 'alert',
      });
    }

    res.json({ message: 'Case declined', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAtVet = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (String(caseData.assignedVet) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this case' });

    caseData.status = 'at_vet';
    caseData.statusHistory.push({
      status: 'at_vet',
      updatedBy: req.user._id,
      note: 'Animal arrived at veterinary clinic',
    });
    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `The animal from case ${caseData.caseId} has arrived at the veterinary clinic for treatment.`,
      type: 'status_update',
    });

    res.json({ message: 'Status updated to at_vet', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addMedicalRecord = async (req, res) => {
  try {
    const { diagnosis, treatment, medications, notes } = req.body;
    const documents = req.files ? req.files.map(f => f.filename) : [];

    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (String(caseData.assignedVet) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this case' });

    if (!['vet_accepted', 'at_vet', 'in_transit', 'treatment_done'].includes(caseData.status))
      return res.status(400).json({ message: 'Cannot update medical record at this stage' });

    caseData.medicalRecords.push({
      diagnosis,
      treatment,
      medications,
      notes,
      documents,
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });

    caseData.statusHistory.push({
      status: caseData.status,
      updatedBy: req.user._id,
      note: `Medical update added: ${diagnosis}`,
      timestamp: new Date(),
    });

    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `New medical update for case ${caseData.caseId}: ${diagnosis}`,
      type: 'status_update',
    });

    res.json({ message: 'Medical record updated successfully', medicalRecords: caseData.medicalRecords, case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markTreatmentDone = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (String(caseData.assignedVet) !== String(req.user._id))
      return res.status(403).json({ message: 'Not assigned to this case' });

    caseData.status = 'treatment_done';
    caseData.statusHistory.push({
      status: 'treatment_done',
      updatedBy: req.user._id,
      note: 'Treatment completed. Animal ready to be moved to shelter.',
    });
    await caseData.save();

    if (caseData.assignedShelter) {
      await Notification.create({
        caseId: caseData._id,
        recipient: caseData.assignedShelter,
        message: `Treatment complete for case ${caseData.caseId}. Please admit the animal.`,
        type: 'status_update',
      });
    }

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `Treatment for case ${caseData.caseId} is complete.`,
      type: 'status_update',
    });

    res.json({ message: 'Treatment marked as done', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
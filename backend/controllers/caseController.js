import Case from '../models/Case.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// ── Helper: notify all admins ──
const notifyAdmin = async (caseId, message) => {
  try {
    const admins = await User.find({ role: 'admin' }, '_id');
    await Promise.all(admins.map(admin =>
      Notification.create({
        caseId,
        recipient: admin._id,
        message,
        type: 'status_update',
      })
    ));
  } catch (err) {
    console.error('Failed to notify admin:', err.message);
  }
};

export const reportCase = async (req, res) => {
  try {
    const { animalName, animalType, description, address, lat, lng } = req.body;
    const images = req.files ? req.files.map(f => f.filename) : [];

    const caseData = new Case({
      animalName,
      animalType,
      description,
      location: { address, lat, lng },
      images,
      reportedBy: req.user._id,
      statusHistory: [{
        status: 'reported',
        note: `Case reported by ${req.user.role}`,
        timestamp: new Date(),
      }]
    });

    await caseData.save();

    // Notify admin of new case
    await notifyAdmin(caseData._id, `New case ${caseData.caseId} reported — ${animalType} at ${address}`);

    res.status(201).json({ message: 'Case reported successfully', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const trackCase = async (req, res) => {
  try {
    const caseData = await Case.findOne({ caseId: req.params.caseId })
      .populate('reportedBy', 'name email')
      .populate('assignedVolunteer', 'name phone address')
      .populate('assignedVet', 'name phone address')
      .populate('assignedShelter', 'name phone address')
      .populate('statusHistory.updatedBy', 'name role');

    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    res.json(caseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyCases = async (req, res) => {
  try {
    const cases = await Case.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllCases = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const cases = await Case.find(filter)
      .populate('reportedBy', 'name email')
      .populate('assignedVolunteer', 'name phone address')
      .populate('assignedVet', 'name phone address')
      .populate('assignedShelter', 'name phone address')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await Case.countDocuments(filter);
    res.json({ cases, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const assignVolunteer = async (req, res) => {
  try {
    const { volunteerId } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    caseData.assignedVolunteer = volunteerId;
    caseData.status = 'assigned';
    caseData.statusHistory.push({ status: 'assigned', updatedBy: req.user._id, note: 'Volunteer assigned by admin' });
    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: volunteerId,
      message: `You have been assigned to case ${caseData.caseId}. Please accept or decline.`,
      type: 'assignment',
    });

    await Notification.create({
      caseId: caseData._id,
      recipient: caseData.reportedBy,
      message: `A volunteer has been assigned to your case ${caseData.caseId}.`,
      type: 'status_update',
    });

    await notifyAdmin(caseData._id, `Volunteer assigned to case ${caseData.caseId} by admin`);

    res.json({ message: 'Volunteer assigned', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const assignVet = async (req, res) => {
  try {
    const { vetId } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    caseData.assignedVet = vetId;
    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: vetId,
      message: `You have been assigned to treat animal in case ${caseData.caseId}.`,
      type: 'assignment',
    });

    await notifyAdmin(caseData._id, `Vet assigned to case ${caseData.caseId} by admin`);

    res.json({ message: 'Vet assigned', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const assignShelter = async (req, res) => {
  try {
    const { shelterId } = req.body;
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    caseData.assignedShelter = shelterId;
    await caseData.save();

    await Notification.create({
      caseId: caseData._id,
      recipient: shelterId,
      message: `Animal from case ${caseData.caseId} will be arriving at your shelter.`,
      type: 'assignment',
    });

    await notifyAdmin(caseData._id, `Shelter assigned to case ${caseData.caseId} by admin`);

    res.json({ message: 'Shelter assigned', case: caseData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCaseById = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id)
      .populate('reportedBy', 'name email phone')
      .populate('assignedVolunteer', 'name email phone address')
      .populate('assignedVet', 'name email phone address')
      .populate('assignedShelter', 'name email phone address')
      .populate('statusHistory.updatedBy', 'name role');
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    res.json(caseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  caseId: { type: String, unique: true },
  animalName: { type: String, default: 'Unknown' },
  animalType: { type: String, required: true, enum: ['dog','cat','bird','cow','horse','rabbit','other'] },
  description: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  images: [{ type: String }],
  status: {
    type: String,
    enum: [
      'reported','assigned','volunteer_accepted','volunteer_declined',
      'in_transit','at_vet','treatment_done','at_shelter',
      'adopted','returned_to_owner','closed'
    ],
    default: 'reported',
  },
  reporterRole: {
  type: String,
  enum: ['public', 'volunteer', 'veterinarian', 'shelter_staff', 'admin'],
  default: 'public',
},
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedVet: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedShelter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  statusHistory: [{
    status: String,
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],
  medicalRecords: [{
    diagnosis: String,
    treatment: String,
    medications: String,
    notes: String,
    documents: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  }],
  shelterDetails: {
    cage_number: String,
    diet: String,
    health_status: String,
    notes: String,
  },
  outcome: { type: String },
  outcomeDetails: {
    adopterName: String,
    adopterContact: String,
    ownerName: String,
    ownerContact: String,
    notes: String,
  },
}, { timestamps: true });

caseSchema.pre('save', async function () {
  if (!this.caseId) {
    const count = await mongoose.model('Case').countDocuments();
    this.caseId = `CASE-${String(count + 1).padStart(4, '0')}`;
  }
});

export default mongoose.model('Case', caseSchema);
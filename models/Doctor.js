import mongoose from 'mongoose';

// Slot schema inside weekly template - only stores time string
const slotSchema = new mongoose.Schema(
  {
    time: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

// Weekly template availability schema
const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    slots: [slotSchema],
  },
  { _id: true }
);

const doctorSchema = new mongoose.Schema(
  {
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Experience in years is required'],
      default: 0,
      min: [0, 'Experience must be a non-negative number'],
    },
    fees: {
      type: Number,
      required: [true, 'Consultation fees is required'],
      default: 0,
      min: [0, 'Consultation fees must be a non-negative number'],
    },
    // Weekly template only - never stores isBooked
    availability: [availabilitySchema],
    rating: {
      type: Number,
      default: 4.9,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit indexes required by specifications
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ department: 1 });

const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);

export default Doctor;

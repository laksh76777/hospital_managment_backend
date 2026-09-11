import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    time: {
      type: String,
      required: [true, 'Appointment time is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    // Snapshot fields for fast rendering
    patientName: {
      type: String,
      default: '',
    },
    patientEmail: {
      type: String,
      default: '',
    },
    patientPhone: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// UNIQUE compound index to prevent double-booking at the database level:
appointmentSchema.index({ doctorRef: 1, appointmentDate: 1, time: 1 }, { unique: true });

// Index for patient lookups and sorting:
appointmentSchema.index({ patientRef: 1, appointmentDate: 1 });

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

export default Appointment;

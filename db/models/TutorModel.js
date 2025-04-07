const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tutorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name']
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profilePicture: {type: String ,default:""},
  profession: String,
  about: String,
  price: {
    type: Number,
    default: 100},
  subjects: {
    type: [String],
    default: ["Mathematics"]
  },
  locations: {
    type: [String],
    default: ["India"]
    
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  availability: {
    type: [{
      day: {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        required: true
      },
      slots: [{
        startTime: {
          type: String,
          required: true,
          match: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
        },
        endTime: {
          type: String,
          required: true,
          match: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
        }
      }]
    }],
    required: [true, "Availability is required"],
    
  },
  contact: {
    phone: String,
    socialMedia: {
      whatsapp: String,
      zoom: String
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Password hashing
tutorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

tutorSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Tutor', tutorSchema);
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
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
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
  profilePicture: String,
  pfp: String,
  profession: String,
  about: String,
  price: {
    type: Number,
    required: true
  },
  subjects: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one subject is required'
    }
  },
  locations: {
    type: [String],
    validate: {
      validator: (v) => v.length > 0,
      message: "At least one location is required"
    }
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
    validate: {
      validator: (v) => v.length > 0,
      message: "At least one availability slot is required"
    }
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
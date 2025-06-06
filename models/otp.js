let mongoose = require('mongoose');

let otpSchema = new mongoose.Schema({
     email: {
        type: String,
        required: true
     },
     otp: {
          type: String,
          required: true
     },
     createdAt: {
          type: Date,
          default: Date.now
     },
     expiredAt: {
          type: Date,
          default: () => new Date(Date.now() + 5 * 60 * 1000)
   },
     
});

const OTP = mongoose.model('OTP', otpSchema);
module.exports = { OTP }; 

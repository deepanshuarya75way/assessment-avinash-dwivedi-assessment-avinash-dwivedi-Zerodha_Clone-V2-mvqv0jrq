const { Schema } = require("mongoose");

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    pan: { type: String, trim: true },
    city: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = { UserSchema };

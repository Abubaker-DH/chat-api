const mongoose = require("mongoose");
const config = require("config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("joi");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 10,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 1024,
    },
    imageUrl: { type: String },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

function validateRegister(user) {
  const schema = Joi.object({
    name: Joi.string().required().min(2).max(10),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(5).max(255),
    imageUrl: Joi.String(),
  });
  return schema.validate(user);
}

function validateLogin(user) {
  const schema = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(5).max(255),
  });
  return schema.validate(user);
}

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, email: this.email, isAdmin: this.isAdmin },
    process.env.JWT_PRIVET_KEY,
    { expiresIn: process.env.JWT_EXPIRE }
  );
  return token;
};

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports.User = mongoose.model("User", userSchema);
exports.userSchema = userSchema;
module.exports.validateRegister = validateRegister;
module.exports.validateLogin = validateLogin;

const mongoose = require("mongoose");
const Joi = require("joi");

const Schema = mongoose.Schema;

const roomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 15,
    },
    topic: {
      type: String,
    },
    roomImage: { type: String },
    members: [{ user: { type: Schema.Types.ObjectId, ref: "User" } }],
    messages: [{ message: { type: Schema.Types.ObjectId, ref: "Message" } }],
    Admins: [{ user: { type: Schema.Types.ObjectId, ref: "User" } }],
  },
  { timestamps: true }
);

function validateRoom(room) {
  const schema = Joi.object({
    name: Joi.string().required().min(3).max(15),
    topic: Joi.string(),
    roomImage: Joi.String(),
  });
  return schema.validate(room);
}

module.exports.Room = mongoose.model("Room", roomSchema);
module.exports.validateRoom = validateRoom;

const mongoose = require("mongoose");
const Joi = require("joi");

const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    messageLine: {
      type: String,
      maxlength: 255,
    },
    imageUrl: {
      type: String,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    roomId: { type: Schema.Types.ObjectId, ref: "Room" },
  },
  { timestamps: true }
);

function validateMessage(message) {
  const schema = Joi.object({
    messageLine: Joi.string().max(255),
    imageUrl: Joi.string(),
  });
  return schema.validate(message);
}

module.exports.Message = mongoose.model("Message", messageSchema);
module.exports.validateMessage = validateMessage;

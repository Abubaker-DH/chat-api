const mongoose = require("mongoose");
const Joi = require("joi");

const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

function validateMessage(message) {
  const schema = Joi.object({
    text: Joi.string().max(255),
    image: Joi.string(),
    conversationId: Joi.string().required(),
    sender: Joi.string().required(),
  });
  return schema.validate(message);
}

module.exports.Message = mongoose.model("Message", messageSchema);
module.exports.validateMessage = validateMessage;

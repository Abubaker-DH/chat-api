const mongoose = require("mongoose");
// const Joi = require("joi");

const Schema = mongoose.Schema;

const ConversationSchema = new Schema(
  {
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // room: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports.Conversation = mongoose.model(
  "Conversation",
  ConversationSchema
);

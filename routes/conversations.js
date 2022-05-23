// const admin = require("../middleware/admin");
const express = require("express");
const mongoose = require("mongoose");
const validateObjectId = require("../middleware/validateObjectId");
const { Conversation } = require("../models/conversation");
const { Message } = require("../models/message");
const auth = require("../middleware/auth");
const router = express.Router();

// INFO: New conversation route
router.post("/", auth, async (req, res) => {
  const newConversation = new Conversation({
    members: [req.user._id, req.body.receiverId],
  });

  const savedConversation = await newConversation.save();
  res.status(201).json(savedConversation);
});

//  INFO: Get all user conversations
router.get("/", auth, async (req, res) => {
  const conversation = await Conversation.find({
    members: { $in: [req.user._id] },
  });
  res.status(200).json(conversation);
});

// INFO: Get one conversation
router.get("/:receiverId", auth, async (req, res) => {
  const conversation = await Conversation.findOne({
    members: { $all: [req.user._id, req.params.receiverId] },
  });

  if (!conversation)
    return res.status(404).send("The conversation was not found.");

  res.status(200).json(conversation);
});

// INFO: Delete one conversation with all messages
router.delete("/:id", [auth, validateObjectId], async (req, res) => {
  let conversation = await Conversation.findById({
    _id: req.params.id,
  });

  if (!conversation)
    return res
      .status(404)
      .send("The conversation with given ID was not found.");

  // INFO: use transaction to delete multiple doc
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    conversation = await Conversation.findByIdAndRemove(req.params.id, {
      session,
    });

    await Message.deleteMany({ conversationId: req.params.id }, { session });

    await session.commitTransaction();
    return res.send(conversation);
  } catch (error) {
    console.log("error deleting conversation", error);
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }

  res.status(200).json(conversation);
});

module.exports = router;

const express = require("express");
const { Conversation } = require("../models/conversation");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
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
router.get("/:receiveId", [auth, validateObjectId], async (req, res) => {
  const conversation = await Conversation.findOne({
    members: { $all: [req.user._id, req.params.receiverId] },
  });

  if (!conversation)
    return res.status(404).send("The conversation was not found.");

  res.status(200).json(conversation);
});

// INFO: Delete one conversation
router.delete("/:id", [auth, validateObjectId], async (req, res) => {
  const conversation = await Conversation.findByIdAndRemove({
    _id: id,
  });

  if (!conversation)
    return res
      .status(404)
      .send("The conversation with given ID was not found.");

  res.status(200).json(conversation);
});

module.exports = router;

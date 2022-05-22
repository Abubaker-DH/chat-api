const fs = require("fs");
const path = require("path");
const express = require("express");
const { Message, validateMessage } = require("../models/message");
const auth = require("../middleware/auth");
// const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const router = express.Router();

// INFO: Get all conversation messages
router.get("/:conversationId", auth, async (req, res) => {
  const messages = await Message.find({
    conversationId: req.params.conversationId,
  });
  res.status(200).json(messages);
});

// INFO: Create new message Route
router.post("/", auth, async (req, res) => {
  req.body.sender = req.user._id;
  if (req.file) {
    req.body.image = req.file.path;
  }
  const { error } = validateMessage(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const newMessage = new Message({
    conversationId: req.body.conversationId,
    sender: req.body.sender,
    text: req.body.text,
    image: req.body.image,
  });

  const savedMessage = await newMessage.save();
  res.status(201).json(savedMessage);
});

// INFO: Delete one conversation message
router.delete("/:id", auth, async (req, res) => {
  const message = await Message.findByIdAndRemove({
    _id: req.params.id,
  });

  if (!message)
    return res.status(404).send("The message with given ID was not found.");

  res.status(200).json(message);
});

module.exports = router;

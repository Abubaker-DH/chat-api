// const admin = require("../middleware/admin");
const fs = require("fs");
const path = require("path");
const express = require("express");
const auth = require("../middleware/auth");
const { Conversation } = require("../models/conversation");
const { Message, validateMessage } = require("../models/message");
const validateObjectId = require("../middleware/validateObjectId");
const io = require("../socket");
const router = express.Router();

const conUsers = io.getUsers();

// INFO: Get all conversation messages
router.get("/:conversationId", auth, async (req, res) => {
  const conversation = await Conversation.findById({
    _id: req.params.conversationId,
  });

  if (!conversation)
    return res
      .status(404)
      .send("The conversation with given ID was not found.");

  if (!conversation.members.includes(req.user._id))
    return res.status(403).send("Unauthrized to get conversation messages.");

  const messages = await Message.find({
    conversationId: req.params.conversationId,
  }).populate("sender", "-password, -isAdmin");

  // get the receiver id
  const receiverId = conversation.members.find((m) => m._id !== req.user._id);
  // get the socket id
  const receiver = conUsers.find((u) => u.id === receiverId);

  // NOTE: send all messages to all client
  if (receiver)
    io.getIO()
      .to(receiver.socketId)
      .emit("message", { action: "getMessages", message: messages });

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

  const conversation = await Conversation.findById({
    _id: req.body.conversationId,
  });

  if (!conversation)
    return res
      .status(404)
      .send("The conversation with given ID was not found.");

  const newMessage = new Message({
    conversationId: req.body.conversationId,
    sender: req.body.sender,
    text: req.body.text,
    image: req.body.image,
  });

  const message = await newMessage.save();

  // get the receiver id
  const receiverId = conversation.members.find((m) => m !== req.user._id);
  // get the socket id
  const receiver = conUsers.find((u) => u.id === receiverId);

  // NOTE: send message to all client
  if (receiver)
    io.getIO()
      .to(receiver.socketId)
      .emit("message", { action: "createamessage", message: message });

  res.status(201).json(message);
});

// INFO: Delete one message from a conversation
router.delete("/:id", [auth, validateObjectId], async (req, res) => {
  const message = await Message.findById({
    _id: req.params.id,
  });

  if (!message)
    return res.status(404).send("The message with given ID was not found.");

  // NOTE: Only the owner can delete the message
  if (message.sender !== req.user._id) {
    return res.status(403).send("Method not allowed.");
  }

  const conversation = await Conversation.findById({
    _id: message.conversationId,
  });

  await Message.findByIdAndRemove({
    _id: req.params.id,
  });

  if (message.image) {
    clearImage(message.image);
  }

  // get the receiver id
  const receiverId = conversation.members.find((m) => m !== req.user._id);
  // get the socket id
  const receiver = conUsers.find((u) => u.id === receiverId);

  // NOTE:
  if (receiver)
    io.getIO()
      .to(receiver.socketId)
      .emit("message", { action: "deleteMessage", message: message });

  res.status(200).json(message);
});

// NOTE: delete image from images Folder
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    return err;
  });
};

module.exports = router;

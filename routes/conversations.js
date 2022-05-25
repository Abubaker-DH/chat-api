// const admin = require("../middleware/admin");
const express = require("express");
const mongoose = require("mongoose");
const validateObjectId = require("../middleware/validateObjectId");
const { Conversation } = require("../models/conversation");
const { Message } = require("../models/message");
const auth = require("../middleware/auth");
const io = require("../socket");
const router = express.Router();

const conUsers = io.getUsers();

// INFO: New conversation route
router.post("/", auth, async (req, res) => {
  const conversation = await Conversation.findOne({
    members: { $all: [req.user._id, req.body.receiverId] },
  });

  if (conversation)
    return res.status(400).send("The conversation already exist.");

  if (req.user._id === req.body.receiverId)
    return res.status(400).send("Bad request User not avilable .");

  const newConversation = new Conversation({
    members: [req.user._id, req.body.receiverId],
  });

  const savedConversation = await newConversation.save();
  // get the receiver socket id
  const receiver = conUsers.find((u) => u.userId == req.body.receiverId);

  // NOTE: send to client
  if (receiver)
    io.getIO().to(receiver.socketId).emit("conversation", {
      action: "create",
      conversation: savedConversation,
    });
  res.status(201).json(savedConversation);
});

//  INFO: Get all user conversations
router.get("/", auth, async (req, res) => {
  const conversations = await Conversation.find({
    members: { $in: [req.user._id] },
  }).populate("members", "-isAdmin -password");

  let friends = [];
  let connectedFriends = [];
  // INFO: get my all recevierId conversations
  for (let c of conversations) {
    const f = c.members.find((m) => m._id !== req.user._id);
    friends.push(f._id);
  }

  // INFO: get the connected friends
  for (let f of friends) {
    connectedFriends.push(conUsers.find((u) => u.userId == f));
  }

  // INFO: get the my socket id
  const user = conUsers.find((u) => u.userId == req.user._id);

  // NOTE: send to me so i ge updated conversation
  if (user)
    io.getIO().to(user.socketId).emit("conversation", {
      action: "getAll",
      conversations: conversations,
      connectedFriends: connectedFriends,
    });

  res.status(200).json(conversations);
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

  if (!conversation.members.includes(req.user._id))
    return res.status(403).send("Unauthrized to delete this conversation .");

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

  // get the receiver id
  const receiverId = conversation.members.find((m) => m !== req.user._id);
  // get the socket id
  const receiver = conUsers.find((u) => u.id === receiverId);

  // NOTE: send to client
  if (receiver)
    io.getIO().to(receiver.socketId).emit("conversation", {
      action: "delete",
      conversation: conversation,
    });

  res.status(200).json(conversation);
});

module.exports = router;

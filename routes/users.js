const fs = require("fs");
const path = require("path");
const express = require("express");
const { User, validateUser } = require("../models/user");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const router = express.Router();

// NOTE:  Get all users
router.get("/search", auth, async (req, res) => {
  let q = req.query.name;
  if (q) {
    const user = await User.find({ name: { $regex: q, $options: "i" } }).select(
      "-isAdmin -password"
    );
    res.send(user);
  }
});

// NOTE:  Get one user by ID
router.get("/:id", [auth, validateObjectId], async (req, res) => {
  let user;
  if (req.user.isAdmin) {
    user = await User.findById(req.params.id);
  } else {
    user = await User.findById(req.params.id).select("-isAdmin -password");
  }
  if (!user)
    return res.status(404).send("The user with given ID was not found.");

  res.send(user);
});

// NOTE:  update user route
router.patch("/:id", [auth, validateObjectId], async (req, res) => {
  let user = await User.findById({ _id: req.params.id });
  if (!user)
    return res.status(404).send("The user with given ID was not found");

  // INFO:  the owner or admin can update
  if (
    req.user._id.toString() !== req.params.id.toString() ||
    !req.user.isAdmin
  ) {
    return res.status(403).send("method not allowed.");
  }

  // INFO: the user can not change his account to be ADMIN
  if (req.body.isAdmin === "true" && req.user.isAdmin === "false") {
    return res.status(403).send("method not allowed.");
  }

  // INFO: get the profile image from req.file
  if (req.file) {
    req.body.imageUrl = req.file.path;
  }

  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //  INFO: delete the old image
  if (req.body.imageUrl || req.body.imageUrl === "") clearImage(user.imageUrl);

  user = await User.findByIdAndUpdate(
    { _id: req.params.id },
    {
      name: req.body.name,
      imageUrl: req.body.imageUrl,
    },
    { new: true }
  );

  res.send(user);
});

// NOTE:  Delete one User By ID
router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const user = await User.findByIdAndRemove({
    _id: req.params.id,
    isAdmin: false,
  });

  if (!user)
    return res.status(404).send("The user with given ID was not found.");

  if (user.imageUrl) {
    clearImage(user.imageUrl);
  }
  res.send(user);
});

// NOTE: delete profile image from images Folder
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    return err;
  });
};
module.exports = router;

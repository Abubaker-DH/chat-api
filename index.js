require("dotenv").config();
const path = require("path");
// const winston = require("winston");
const ioFunc = require("./socket");
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const multer = require("multer");
const express = require("express");
const mongoose = require("mongoose");
const Joi = require("joi");
const error = require("./middleware/error");
const messages = require("./routes/messages");
const conversations = require("./routes/conversations");
const users = require("./routes/users");
const auth = require("./routes/auth");

const app = express();
Joi.objectId = require("joi-objectid")(Joi);
app.use(express.json());
// dotenv.config();

// INFO: if we behind a proxy
app.set("trust proxy", 1);
// INFO: use it to limit number of reqest
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// INFO: Swagger
const swaggerDocument = YAML.load("./swagger.yaml");

//  INFO: production packages
app.use(cors());
app.use(xss());
app.use(helmet());
app.use(compression());

// INFO: Setup image folder and image name OR image URL
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/[\/\\:]/g, "-") +
        "-" +
        file.originalname
    );
  },
});

// INFO: Type of file that acceptaple to upload
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/PNG" ||
    file.mimetype === "image/JPG" ||
    file.mimetype === "image/JPEG"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

// INFO: logging error middleware
require("./middleware/log")();

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use("/api/v1/users", users);
app.use("/api/v1/auth", auth);
app.use("/api/v1/conversations", conversations);
app.use("/api/v1/messages", messages);
app.use(error);

const MONGO_URL = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

let connectedUsers = ioFunc.getUsers();
mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    const server = app.listen(PORT, () =>
      console.log(`server running on port ${PORT} ...`)
    );
    const io = require("./socket").init(server);

    // INFO: when connect
    io.on("connection", (socket) => {
      console.log("client connected");
      // NOTE: get user from client
      socket.on("addUser", (userId) => {
        ioFunc.saveUser(userId, socket.id);
      });

      // NOTE: send users array to client
      // io.emit("getUsers", connectedUsers);

      // INFO: When disconnect
      socket.on("disconnect", () => {
        console.log("client disconnected");
        // connectedUsers.filter((user) => user.socketId !== socket.id);
        ioFunc.removeUser(socket.id);

        // NOTE: send users array to client
        // io.emit("getUsers", connectedUsers);
      });
    });
  });

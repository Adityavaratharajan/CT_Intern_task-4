const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI, {});

const Log = require("./models/Log");

Log.deleteOne({ userId: "123" })
  .then(() => {
    console.log("Old logs deleted for userId 123");
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error(err);
    mongoose.disconnect();
  });

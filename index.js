const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const routes = require("./routes/route");
const cron = require("node-cron");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

//allow to use route
app.use(routes);

// app.get("/", (req, res) => {
//   res.send("Backend of Resin is running...");
// });

// const sendlog = async () => {
//   console.log("corn job works");
// };

const getBackendStatus = () => {
  return "Backend of Resin is running...";
};

// Route that uses the function
app.get("/", (req, res) => {
  res.send(getBackendStatus());
});

// Manual function that behaves the same way
const handleRootLogicManually = () => {
  const message = getBackendStatus();
  console.log("Manual call:", message);
};

cron.schedule(
  "*/1 * * * *",
  async () => {
    try {
      console.log("Cron job executed at:");
      await handleRootLogicManually();
    }
    catch (error) {
      console.error("Error in cron job execution:", error);
    }
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

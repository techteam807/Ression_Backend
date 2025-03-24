const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const routes = require("./routes/route");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

//allow to use route
app.use(routes);

app.get("/", (req, res) => {
  res.send("Backend of Resin is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

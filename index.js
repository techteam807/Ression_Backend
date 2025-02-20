// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();
// const connectDB = require("./config/db");
// const taskRoutes = require("./routes/taskRoutes");
// const userRoutes = require('./routes/userRoutes');
// const taskService = require("./services/taskService");

// const app = express();
// app.use(cors());
// app.use(express.json());

// async function startServer() {
//   const db = await connectDB();
//   taskService.setDB(db);

//   app.use("/tasks", taskRoutes);
//   app.use("/data",userRoutes)

//   app.get("/", (req, res) => {
//     res.send("Backend of TaskManager is running...");
//   });

//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// }

// startServer();

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require('./routes/productRoute'); 

const app = express();
app.use(cors());
app.use(express.json());

connectDB();
app.use("/tasks", taskRoutes);
app.use("/data", userRoutes);
app.use("/products", productRoutes); 

app.get("/", (req, res) => {
  res.send("Backend of TaskManager is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// const { Task, ObjectId } = require("../models/taskModel");

// let tasksCollection;

// const setDB = (db) => {
//   tasksCollection = db.collection("tasks");
// };

// const getAllTasks = async () => {
//   return await tasksCollection.find({}).toArray();
// };

// const createTask = async (title, description) => {
//   const newTask = new Task(title, description);
//   return await tasksCollection.insertOne(newTask);
// };

// const updateTask = async (id, title, description) => {
//   return await tasksCollection.updateOne(
//     { _id: new ObjectId(id) },
//     { $set: { title, description } }
//   );
// };

// const deleteTask = async (id) => {
//   return await tasksCollection.deleteOne({ _id: new ObjectId(id) });
// };

// const getTaskById = async (id) => {
//   return await tasksCollection.findOne({ _id: new ObjectId(id) });
// };

// module.exports = { setDB, getAllTasks, createTask, updateTask, deleteTask, getTaskById };

const Task = require("../models/taskmodel");

const getAllTasks = async () => {
  return await Task.find();
};

const getTaskById = async (id) => {
  return await Task.findById(id);
};

const createTask = async (data) => {
  return await Task.create(data);
};

const updateTask = async (id, data) => {
  return await Task.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteTask = async (id) => {
  return await Task.findByIdAndDelete(id);
};


module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };

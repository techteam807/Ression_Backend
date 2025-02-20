const { Task, ObjectId } = require("../models/taskModel");

let tasksCollection;

const setDB = (db) => {
  tasksCollection = db.collection("tasks");
};

const getAllTasks = async () => {
  return await tasksCollection.find({}).toArray();
};

const createTask = async (title, description) => {
  const newTask = new Task(title, description);
  return await tasksCollection.insertOne(newTask);
};

const updateTask = async (id, title, description) => {
  return await tasksCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { title, description } }
  );
};

const deleteTask = async (id) => {
  return await tasksCollection.deleteOne({ _id: new ObjectId(id) });
};

const getTaskById = async (id) => {
  return await tasksCollection.findOne({ _id: new ObjectId(id) });
};

module.exports = { setDB, getAllTasks, createTask, updateTask, deleteTask, getTaskById };

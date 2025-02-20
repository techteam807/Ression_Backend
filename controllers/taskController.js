const { successResponse, errorResponse } = require("../config/response");
const taskService = require("../services/taskService");

const getTasks = async (req, res) => {
  try {
    const tasks = await taskService.getAllTasks();
    successResponse(res, "Tasks fetched successfully", tasks);
  } catch (error) {
    errorResponse(res, "Error fetching tasks");
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return errorResponse(res, "Title and description are required", 400);
    }
    const result = await taskService.createTask(title, description);
    successResponse(res, "Task created successfully", result);
  } catch (error) {
    errorResponse(res, "Error creating task");
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const result = await taskService.updateTask(id, title, description);
    if (result.modifiedCount === 0) {
      return errorResponse(res, "Task not found or no changes made", 404);
    }
    successResponse(res, "Task updated successfully");
  } catch (error) {
    errorResponse(res, "Error updating task");
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await taskService.deleteTask(id);
    if (result.deletedCount === 0) {
      return errorResponse(res, "Task not found", 404);
    }
    successResponse(res, "Task deleted successfully");
  } catch (error) {
    errorResponse(res, "Error deleting task");
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await taskService.getTaskById(id);

    if (!task) {
      return errorResponse(res, "Task not found", 404);
    }

    successResponse(res, "Task fetched successfully", task);
  } catch (error) {
    errorResponse(res, "Error fetching task by ID");
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getTaskById };

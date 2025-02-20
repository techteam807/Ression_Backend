const { ObjectId } = require("mongodb");

class Task {
  constructor(title, description) {
    this.title = title;
    this.description = description;
    this.createdAt = new Date();
  }
}

module.exports = { Task, ObjectId };

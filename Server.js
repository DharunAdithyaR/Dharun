import express from "express";

import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskify';
const PORT = process.env.PORT || 5001;

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  
  try {
    const existingUser = await User.findOne({ username: 'admin' });
    if (!existingUser) {
      await User.create({
        username: 'admin',
        password: 'password123'
      });
      console.log('Default user created');
    }
  } catch (error) {
    console.error('Error creating default user:', error);
  }
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});


const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: String },
  status: { type: String, default: 'Incomplete' },
  priority: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);


const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
});

app.get("/api/tasks/status/:status", async (req, res) => {
  const status = req.params.status;
  try {
    const filteredTasks = await Task.find({ status });
    if (filteredTasks.length > 0) {
      res.json(filteredTasks);
    } else {
      res.status(404).json({ message: `No tasks found with status ${status}` });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const newTask = new Task(req.body);
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: "Error creating task", error: error.message });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (updatedTask) {
      res.json(updatedTask);
    } else {
      res.status(404).json({ message: "Task not found" });
    }
  } catch (error) {
    res.status(400).json({ message: "Error updating task", error: error.message });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (deletedTask) {
      res.json({ message: "Task deleted successfully" });
    } else {
      res.status(404).json({ message: "Task not found" });
    }
  } catch (error) {
    res.status(400).json({ message: "Error deleting task", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});

require("dotenv").config();

const express = require('express');
const colors = require('colors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const userRoutes = require("./routes/userRoutes");
const otpRoutes = require("./routes/otpRoutes");
const cors = require('cors');

// Load environment variables


// MongoDB connection
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // You can customize the CORS options here if needed
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send({ message: 'server  is running successfully' });
});

app.use("/api/otp", otpRoutes);
app.use("/api/users", userRoutes);

// Start the server
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running in ${process.env.DEV_MODE} mode on port ${port}`.bgCyan.white);
});
const express = require('express');
const colors = require('colors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send({ message: 'server  is running successfully' });
});


// Start the server
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running in ${process.env.DEV_MODE} mode on port ${port}`.bgCyan.white);
});
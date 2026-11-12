const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { clientOrigin } = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;

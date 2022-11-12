#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import debug from 'debug';
debug('backend:server');
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from 'morgan';
import chalk from 'chalk';
import connectToDatbase from './db/mongo_db_connector.js';
import fileUpload from 'express-fileupload';

// ROUTER IMPORTS
import userRouter from './routes/users.js';
import partnersRouter from './routes/partners.js';
import ordersRouter from './routes/orders.js';
import tripsRouter from './routes/trips.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || '3000';
const STATIC = path.join(__dirname, 'public');
const app = express();
app.use(fileUpload());

// DATABASE CONNECTOR
connectToDatbase().catch((err) => console.log(err));

// EXPRESS MIDDLEWARE CONFIG
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(STATIC));

// ROUTERS MIDDLEWARE
app.use('/partners', partnersRouter);
app.use('/orders', ordersRouter);
app.use('/users', userRouter);
app.use('/trips', tripsRouter);

// PORT LISTENER
app.listen(PORT, () => {
  console.log(`
${chalk.cyanBright('SERVER LISTENING ON PORT:')} ${chalk.whiteBright(PORT)}
`);
});

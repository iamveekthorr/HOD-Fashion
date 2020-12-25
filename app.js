const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./Utils/appError');
const globalErrorHandler = require('./Controllers/errorController');

//initialize express
const app = express();

app.enable('trust proxy');

// //View Engine
// app.set('view engine', 'pug');
// app.set('views', path.join(__dirname, 'Views'));

/////////Global Middlewares
//Serving static files
app.use(express.static(path.join(__dirname, 'Public')));

//Implement CORS
app.use(cors());

app.options('*', cors());

//Set Security HTTP Headers
app.use(helmet());

//Dev logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//To limit the amount of requests from a particular IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP. Please try again in an hour',
});

app.use('/api', limiter);

//Reading data from the body into req.body. The limit option manages how large the data can be
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

//Cookie Parser
app.use(cookieParser());

//Data sanitization against NoSQL injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
    hpp({
        whitelist: [],
    })
);

//Middleware to compress text sent to client
app.use(compression());

//Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

////Mounted Routers
// app.use('/', viewRouter);

//API Routes

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'Client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'Client/build', 'index.html'));
    });
}

//To catch all unhandled routes (It has to be the last middleware or at least just after the predefined routers)
app.all('*', (req, res, next) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
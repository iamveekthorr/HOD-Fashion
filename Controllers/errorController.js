const AppError = require('../Utils/appError');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const message = `Duplicate field value: ${err.keyValue.name}. Please use another value`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
    //For API
    if (req.originalUrl.startsWith('/api')) {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
        //For Website
    } else {
        console.error('ERROR', err);
        // res
        // .status(err.statusCode)
        // .render('error', { title: 'Something went wrong', message: err.message });
    }
};

const sendErrorProd = (err, req, res) => {
    //For API
    if (req.originalUrl.startsWith('/api')) {
        //Send error to client if it is operational
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        //Programming error, do not leak to client
        else {
            console.error('ERROR', err);

            //Send generic message
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong',
            });
        }
        //For Website
    } else {
        // if (err.isOperational) {
        //     res.status(err.statusCode).render('error', {
        //         title: 'Something went wrong',
        //         message: err.message,
        //     });
        // } else {
        console.error('ERROR', err);

        //Send generic message
        // res.status(err.statusCode).render('error', {
        //     title: 'Something went wrong',
        //     message: 'Please try again later',
        // });
        // }
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { name: err.name, message: err.message, ...err };

        if (error.name === 'CastError') error = handleCastErrorDB(error);

        if (error.code === 11000) error = handleDuplicateFieldsDB(error);

        if (error.name === 'ValidationError')
            error = handleValidationErrorDB(error);

        sendErrorProd(error, req, res);
    }
};
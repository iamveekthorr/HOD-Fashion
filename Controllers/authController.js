const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const catchAsync = require('../Utils/catchAsync');
const AppError = require('../Utils/appError');
// const Email = require('../Utils/email');

const User = require('../Models/userModel');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createAndSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),

        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    };

    res.cookie('jwt', token, cookieOptions);

    //To remove the password field from the output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        data: {
            user,
        },
    });
};

exports.signup = catchAsync(async(req, res, next) => {
    const { firstName, lastName, email, password, passwordConfirm } = req.body;

    if (!firstName || !lastName || !email || !password || !passwordConfirm)
        return next(new AppError('All fields are required', 400));

    if (password !== passwordConfirm)
        return next(new AppError('Passwords do not match', 400));

    const user = await User.create({ firstName, lastName, email, password });

    createAndSendToken(user, 201, req, res);
});

exports.login = catchAsync(async(req, res, next) => {
    const { email, password } = req.body;

    //Check if email and password were given by the user
    if (!email || !password) {
        return next(new AppError('Please provide an email and password', 400));
    }

    //Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    //Send token to client if all is well
    createAndSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedOut', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        status: 'success',
    });
};

exports.protect = catchAsync(async(req, res, next) => {
    //Get JWT Token and check if it exists
    const token = req.cookies.jwt;

    if (!token) {
        return next(
            new AppError('You are not logged in. Please log in to gain access.', 401)
        );
    }
    //Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //Check if the user exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
        return next(
            new AppError('The user with this token does not exist any more', 401)
        );
    }

    //Grant access to the protected route
    req.user = currentUser;
    // res.locals.user = currentUser;

    next();
});

//Only for rendered pages. There will be no errors
exports.isLoggedIn = async(req, res, next) => {
    //Get JWT Token and check if it exists
    if (req.cookies.jwt) {
        try {
            //Verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            //Check if the user exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            //There is a logged in user
            req.user = currentUser;

            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }

        next();
    };
};

exports.updatePassword = catchAsync(async(req, res, next) => {
    //Get user from collection
    const user = await User.findById(req.user._id).select('+password');

    //Check if posted password is correct
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    if (!(await user.correctPassword(currentPassword, user.password))) {
        return next(
            new AppError('Your current password is incorrect. Please try again.', 401)
        );
    }

    //Check if newPassword and newPassword Confirm are the same
    if (newPassword !== newPasswordConfirm)
        return next(
            new AppError('New passwords do not match. Please try again.', 401)
        );

    //If so, update
    user.password = req.body.newPassword;

    await user.save();

    //Log the user in, send JWT
    createAndSendToken(user, 200, req, res);
});
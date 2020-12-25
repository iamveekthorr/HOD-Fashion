const User = require('../Models/userModel');

const factory = require('./handlerFactory');

const catchAsync = require('../Utils/catchAsync');
const AppError = require('../Utils/appError');

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.createUser = factory.createOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;

    next();
};

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};

    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
};

exports.updateMe = catchAsync(async(req, res, next) => {
    //Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /update-password',
                400
            )
        );
    }

    //If not update user document
    const filteredBody = filterObj(req.body, 'firstName', 'lastName', 'email');

    const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: 'success',
        data: {
            data: user,
        },
    });
});
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'A user must have a first name.'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'A user must have a last name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'A user must have an email address'],
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        select: false,
        minlength: [8, 'Password should have at least 8 characters'],
        required: [true, 'A user must have a password'],
    },
    googleId: String,
    facebookId: String,
    role: {
        type: String,
        enum: ['client', 'admin'],
        default: 'client',
    },
    dateCreated: Date,
}, {
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
});

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre('save', function(next) {
    if (this.isNew) this.dateCreated = Date.now();

    next();
});

userSchema.pre('save', async function(next) {
    //Check if password has been hashed
    if (!this.isModified('password')) return next();

    //Hash password
    this.password = await bcrypt.hash(this.password, 12);

    next();
});

userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
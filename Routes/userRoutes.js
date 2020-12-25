const express = require('express');

const authController = require('../Controllers/authController');
const userController = require('../Controllers/userController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.use(authController.protect);

router.get('/logout', authController.logout);

router.get('/my-account', userController.getMe, userController.getUser);

router.post('/update-password', authController.updatePassword);

router.patch('/update-my-data', userController.updateMe);

router.use(authController.restrictTo('admin'));

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;
const catchAsync = require('../Utils/catchAsync');
const AppError = require('../Utils/appError');
const APIFeatures = require('../Utils/apiFeatures');

exports.getAll = (Model) =>
    catchAsync(async(req, res, next) => {
        //Execute query
        const features = new APIFeatures(Model.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const document = await features.query;

        //Get the total number of documents for that collection
        let totalDocuments;

        if (`${features.q}` === `{}`) {
            //Get the total estimated number of documents for the collection
            totalDocuments = await Model.estimatedDocumentCount();
        } else {
            //Get the total number of documents for the collection with the given filter
            totalDocuments = await Model.countDocuments(features.q);
        }

        //Send the response
        res.status(200).send({
            status: 'success',
            totalDocuments,
            results: document.length,
            data: {
                data: document,
            },
        });
    });

exports.getOne = (Model, populateOptions) =>
    catchAsync(async(req, res, next) => {
        //Get id from request
        const { id } = req.params;

        // Define query
        let query = Model.findById(id);
        if (populateOptions) query = query.populate(populateOptions);

        //Await query and save result to document
        const document = await query;

        //Check if document exists
        if (!document) {
            return next(new AppError('No document found with that id', 404));
        }

        res.status(200).send({
            status: 'success',
            data: {
                data: document,
            },
        });
    });

exports.createOne = (Model) =>
    catchAsync(async(req, res, next) => {
        //Create document
        const document = await Model.create(req.body);

        //Check if document has password and remove it
        if (document.password) document.password = undefined;

        res.status(201).json({
            status: 'success',
            data: {
                data: document,
            },
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async(req, res, next) => {
        //Get id from request
        const { id } = req.params;

        //Check if there is a password in req.body
        if (req.body.password) {
            return next(
                new AppError('Do NOT use this route for updating passwords', 400)
            );
        }

        //Find document and update
        const document = await Model.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        //Check if document exists
        if (!document) {
            return next(new AppError('No document found with that id', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: document,
            },
        });
    });

exports.deleteOne = (Model) =>
    catchAsync(async(req, res, next) => {
        //Get id from request
        const { id } = req.params;

        //Find and delete document
        const document = await Model.findByIdAndDelete(id);

        // Check if document exists
        if (!document) {
            return next(new AppError('No document found with that id', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    });
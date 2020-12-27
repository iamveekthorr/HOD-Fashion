class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = {...this.queryString };

        const excludedFields = ['page', 'sort', 'limit', 'fields'];

        excludedFields.forEach((el) => delete queryObj[el]);

        //Implementing advanced filtering features
        //JSON.stringify converts the object to a string so that string methods can be used on it
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt|regex|options)\b/g,
            (match) => `$${match}`
        );

        //To enable nested searching
        queryStr = queryStr.replace(/__/g, '.');

        const newQueryObj = JSON.parse(queryStr);

        //For searching for elements in arrays
        if (newQueryObj.in) {
            //Get all the keys in newQueryObj.in
            const keys = Object.keys(newQueryObj.in);

            //Loop through keys and add each key to newQueryObj with its value as an array of RegEx elements
            keys.forEach((key) => {
                newQueryObj[key] = {
                    $all: newQueryObj.in[key]
                        .split(',')
                        .map((el) => new RegExp(el.trim(), 'gi')),
                };
            });

            //Delete 'in' from newQueryObj
            delete newQueryObj.in;
        }

        //Add the queryObj to the class to use it to count the documents in the collection
        this.q = newQueryObj;

        this.query = this.query.find(newQueryObj);

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-dateCreated');
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
const AWS = require('aws-sdk');
const multer = require('multer');
const User = require('./user.model')

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const s3 = new AWS.S3()

const uploadToS3 = (file) => {
    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: file.path,
        ContentType: file.mimetype,
        Body: file.buffer,
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Location);
            }
        });
    });
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.split('/')[0] === 'image') {

            const ext = file.mimetype.split('/')[1];
            const filename = `${req.body.nationalId}-${Date.now()}.${ext}`;
            file.path = `media/country/${filename}`
            cb(null, true);
        } else {
            cb(new Error('File must be an image', 400), false);
        }
    },
});

const uploadMiddleware = (req, res, next) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return next(err);
        }
        try {
            if (!req.file && req.method === 'POST') {
                return next(new Error('No file uploaded', 400));
            }

            const user = await User.findOne({ nationalId: req.body.nationalId })
            if (user)
                return next(new Error('User already exist'))

            if (req.file)
                await uploadToS3(req.file);
            next();
        } catch (err) {
            next(err);
        }
    });
};

module.exports = uploadMiddleware;

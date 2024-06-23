require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const AWS = require('aws-sdk');

const uploadMiddleware = require('./aws')
const User = require('./user.model');

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const s3 = new AWS.S3()


app.post('/', uploadMiddleware, async (req, res) => {
    try {
        const newUser = new User({
            nationalId: req.body.nationalId,
            image: req.file.path
        });
        await newUser.save();

        res.send({ message: 'Image uploaded and user data saved successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/:id', async (req, res) => {
    try {
        const nationalId = req.params.id;
        const user = await User.findOne({ nationalId });

        if (!user)
            return res.status(404).send('User not found');

        const params = {
            Bucket: process.env.AWS_BUCKET,
            Key: user.image,
        };
        const data = await s3.getObject(params).promise();
        res.set('Content-Type', data.ContentType);
        res.send(data.Body);

    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.all('*', (req, res) => {
    return res.status(404).json({ status: 'error', message: 'this resource is not available' })
})
app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({ status: error.statusText || 'error', message: error.message, code: error.statusCode || 500, data: null });
})


app.listen(3001, () => {
    console.log('running');
})
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';

mongoose.connect('mongodb://localhost:27017/mydatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    name: String,
    phone: String,
    category: String,
    subcategories: [{ type: String }],
    profilePic: String
});

const doctorSchema = new mongoose.Schema({
    name: String,
    email: String,
    address: String,
    phone: String,
    department: String,
    specialization: String,
    bio: String
});

const patientSchema = new mongoose.Schema({
    name: String,
    email: String,
    doctor: String,
    address: String,
    phone: String,
    sex: String,
    birthdate: Date,
    age: Number,
    bloodGroup: String
});

const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Patient = mongoose.model('Patient', patientSchema);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'photos');
    },
    filename: (req, file, cb) => {
        const username = req.body.username;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, `${username}${fileExtension}`);
    }
});

const upload = multer({ storage: storage }).single('photo');
const uploadUpdate = multer({ storage: storage }).single('profilePic');

export const register = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(500).json({
                state: 'failed',
                message: 'The Email/Username already existing. Please try another one.'
            });
        }
        const { username, email, password, name, phone, category, subcategories } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 10);
        const user = new User({
            username,
            email,
            password: hashedPassword,
            name,
            phone,
            category,
            subcategories,
            profilePic: req.file.filename
        });
        user.save((err, user) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }
            return res.status(200).json({
                state: 'success',
                message: 'Your registration was successful!'
            });
        });
    });
};

export const updateProfile = (req, res) => {
    uploadUpdate(req, res, (err) => {
        if (err) {
            return res.status(500).json(err);
        }
        const { id, name, email, website, phone, hobbies, username, password } = req.body;
        const profilePic = req.file ? req.file.filename : req.body.profilePic;
        const updateQuery = {
            $set: {
                email,
                name,
                website,
                phone,
                hobbies,
                profilePic,
                username,
                password: password ? bcrypt.hashSync(password, 10) : undefined
            }
        };
        User.findByIdAndUpdate(id, updateQuery, (err, user) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }
            return res.status(200).json({
                state: 'success',
                message: 'Your profile update was successful!'
            });
        });
    });
};

export const login = (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username }, (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        if (!user) {
            return res.status(404).json({
                state: 'failed',
                message: 'User not found'
            });
        }
        const checkPassword = bcrypt.compareSync(password, user.password);
        if (!checkPassword) {
            return res.status(401).json({
                state: 'failed',
                message: 'Wrong password or username!'
            });
        }
        const token = jwt.sign({ id: user.id }, 'secretkey', { expiresIn: '2d' });
        res.cookie('accessToken', token, { httpOnly: true });
        res.status(200).json({
            state: 'success',
            message: 'Your login was successful!'
        });
    });
};

export const logout = (req, res) => {
    res.clearCookie('accessToken', { secure: true, sameSite: 'none' });
    res.status(200).json('User has been logged out.');
};

export const registerDoctor = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(500).json({
                state: 'failed',
                message: 'The Email already existing. Please try another one.'
            });
        }
        const { name, email, password, address, phone, department, specialization, bio } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 10);
        const doctor = new Doctor({
            name,
            email,
            password: hashedPassword,
            address,
            phone,
            department,
            specialization,
            bio
        });
        doctor.save((err, doctor) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }
            const user = new User({
                username: email.split('@')[0],
                email,
                password: hashedPassword
            });
            user.save((err, user) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json(err);
                }
                return res.status(200).json({
                    state: 'success',
                    message: 'Your doctor registration was successful!'
                });
            });
        });
    });
};

export const registerPatient = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(500).json({
                state: 'failed',
                message: 'The Email already existing. Please try another one.'
            });
        }
        const { name, email, password, doctor, address, phone, sex, birthdate, age, bloodGroup } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 10);
        const patient = new Patient({
            name,
            email,
            doctor,
            address,
            phone,
            sex,
            birthdate,
            age,
            bloodGroup
        });
        patient.save((err, patient) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }
            const user = new User({
                username: email.split('@')[0],
                email,
                password: hashedPassword
            });
            user.save((err, user) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json(err);
                }
                return res.status(200).json({
                    state: 'success',
                    message: 'Your patient registration was successful!'
                });
            });
        });
    });
};

export const getAllDoctors = (req, res) => {
    Doctor.find({}, (err, doctors) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        res.json(doctors);
    });
};

import { db } from "../connect.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'photos'); // Save photos in the 'photos' folder
  },
  filename: (req, file, cb) => {
    const username = req.body.username;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `${username}${fileExtension}`);
  },
});

const upload = multer({ storage: storage }).single('photo');
const uploadUpdate = multer({ storage: storage }).single('profilePic');

export const register = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json(err);
    }

    const q = 'SELECT * FROM users WHERE username = ?';
    db.query(q, [req.body.username], (err, data) => {
      if (err) return res.status(500).json(err);

      if (data.length) {
        return res.status(409).json({
          state: 'failed',
          message: 'Username/Email already exists! Please choose another one',
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(req.body.password, salt);

      const q =
        'INSERT INTO users (`username`,`email`,`password`,`name`, `phone`, `profilePic`) VALUES (?, ?, ?, ?, ?, ?)';
      const photoFileName = req.file.filename;
      const values = [
        req.body.username,
        req.body.email,
        hashedPassword,
        req.body.name,
        req.body.phone,
        photoFileName,
      ];

      db.query(q, values, (err, data) => {
        if (err) return res.status(500).json(err);

        return res.status(200).json({
          state: 'success',
          message: 'Your registration was successful!',
          data,
        });
      });
    });
  });
};


// Function to handle user profile update
export const updateProfile = (req, res) => {
  uploadUpdate(req, res, (err) => {
    if (err) {
      return res.status(500).json(err);
    }
    const photoFileName = req.file?.filename;
    console.log("photoFilename", photoFileName);
    const { id, name, email, website, phone, hobbies, username, password } = req.body;

    let profilePic;

    if(!photoFileName) {
      profilePic = req.body.profilePic;
    } else {
      profilePic = photoFileName;
    }
    const userId = id; // Assuming you have a middleware to extract user ID from the token

      if(password) {
          const updateQuery = `
            UPDATE users
            SET
              email = ?,
              name = ?,
              website = ?,
              phone = ?,
              hobbies = ?,
              profilePic = ?,
              username = ?,
              password = ?
            WHERE id = ?
          `;


          const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
          const values = [email, name, website, phone, hobbies, profilePic, username, hashedPassword, userId];


          db.query(updateQuery, values, (err, data) => {
            if (err) {
              console.error(err);
              return res.status(500).json(err);
            }

            // Check if any rows were affected
            console.log("dataCumAffectedRows", data, data.affectedRows);
          if (data.affectedRows === 0) {
            return res.status(404).json({ state: 'failed', message: 'User not found' });
          }

          const token = jwt.sign({ id: userId }, "secretkey", { expiresIn: '15m' });
          const { password, ...others } = data[0];
          res
          .cookie("accessToken", token, {
            httpOnly: true,
          })
        .status(200).json({ state: 'success', message: 'Your login was successful!', data: others, token });
      });
        } else {
          const updateQuery = `
          UPDATE users
          SET
            email = ?,
            name = ?,
            website = ?,
            phone = ?,
            hobbies = ?,
            profilePic = ?,
            username = ?
          WHERE id = ?
        `;

        const values = [email, name, website, phone, hobbies, profilePic, username, userId];


        db.query(updateQuery, values, (err, data) => {
          if (err) {
            console.error(err);
            return res.status(500).json(err);
          }

          // Check if any rows were affected
          console.log("dataCumAffectedRows", data, data.affectedRows);
          if (data.affectedRows === 0) {
            return res.status(404).json({ state: 'failed', message: 'User not found' });
          }

          const token = jwt.sign({ id: userId }, "secretkey", { expiresIn: '15m' });
          const { password, ...others } = data[0];
          res
          .cookie("accessToken", token, {
            httpOnly: true,
          })
        .status(200).json({ state: 'success', message: 'Your login was successful!', data: others, token });
      });
         /*  res.status(200).json({ state: 'success', message: 'Profile updated successfully' });
        }); */
        }
      });
};

export const login = (req, res) => {
  const q = "SELECT * FROM users WHERE username = ?";

 // Inside the login API endpoint
db.query(q, [req.body.username], (err, data) => {
  console.log("REQ.BODY", req.body);
  if (err) {
    console.error(err);
    return res.status(500).json(err);
  }

  if (data.length === 0) {
    return res.status(404).json({state: 'failed', message:"User not found:"});
    //return res.status(404).json("User not found!");
  }

  const checkPassword = bcrypt.compareSync(req.body.password, data[0].password);

  if (!checkPassword) {
    console.log("Wrong password for user:", req.body.username);
    //return res.status(400).json("Wrong password or username!");
    return res.status(400).json({state: 'failed', message:"Wrong password or username!"});
  }

  const token = jwt.sign({ id: data[0].id }, "secretkey", { expiresIn: '15m' });
  const { password, ...others } = data[0];

  res
    .cookie("accessToken", token, {
      httpOnly: true,
    })
  .status(200).json({ state: 'success', message: 'Your login was successful!', data: others, token });
});

};

export const logout = (req, res) => {
  res.clearCookie("accessToken",{
    secure:true,
    sameSite:"none"
  }).status(200).json("User has been logged out.")
};

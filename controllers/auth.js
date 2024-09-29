import { db, dbCI } from "../connect.js";
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

const storageReq = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'photos'); // Save photos in the 'photos' folder
  },
  filename: (req, file, cb) => {
    const username = req.body.email.split("@")[0];
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname)+"_"+uniqueSuffix;
    cb(null, `${username}${fileExtension}`);
  },
});

const upload = multer({ storage: storage }).single('photo');
const uploadUpdate = multer({ storage: storage }).single('profilePic');
const uploadPatientrequest = multer({ storage: storageReq }).single('file');

export const register = (req, res) => {
  try {
  upload(req, res, (err) => {
    if (err) {
      //return res.status(500).json(err);
      return res.status(500).json({
        state: 'failed',
        message: 'The Email/Username already existing. Please try another one.',
      });
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
        'INSERT INTO users (`username`,`email`,`password`,`name`, `phone`, `category`, `subcategories`, `profilePic`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const photoFileName = req.file.filename;
      const values = [
        req.body.username,
        req.body.email,
        hashedPassword,
        req.body.name,
        req.body.phone,
        req.body.category,
        JSON.stringify(req.body.subcategories),
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
} catch(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    // Handle duplicate entry error
    console.error('Duplicate entry error:', error.sqlMessage);
    // Return an appropriate response or throw a custom error
    return res.status(409).json({
      state: 'failed',
      message: 'The Email/Username already existing. Please try another one.',
    });
   // return res.status(409).json({ error: 'Duplicate entry', message: 'Email is already registered.' });
  } else {
      // Handle other database errors
      console.error('Database error:', error.message);
      //return res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong.' });
      return res.status(500).json({
        state: 'failed',
        message: 'Something went wrong.'
      });
  }
}
};


// Function to handle user profile update
export const updateProfile = (req, res) => {
  uploadUpdate(req, res, async (err) => { // Make the middleware callback asynchronous
    if (err) {
      return res.status(500).json(err);
    }
    const photoFileName = req.file?.filename;
    console.log("photoFilename", photoFileName);
    const { id, first_name, last_name, email, company, phone, hobbies, username, password } = req.body;

    let profilePic;

    if(!photoFileName) {
      profilePic = req.body.profilePic;
    } else {
      profilePic = photoFileName;
    }
    var userId = id; // Assuming you have a middleware to extract user ID from the token
    console.log("MY userId", userId);

    try {
      if(password) {
        const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
        const updateQuery = `
          UPDATE users
          SET
            email = ?,
            first_name = ?,
            last_name = ?,
            company = ?,
            phone = ?,
            hobbies = ?,
            profilePic = ?,
            username = ?,
            password = ?
          WHERE id = ?
        `;
        const values = [email,  first_name, last_name, company, phone, hobbies, profilePic, username, hashedPassword, userId];

        const data = await new Promise((resolve, reject) => {
          dbCI.query(updateQuery, values, (err, data) => {
            if (err) {
              console.error(err);
              reject(err);
            }
            resolve(data);
          });
        });

        if (data.affectedRows === 0) {
          return res.status(200).json({ state: 'failed', message: 'User not found' });
        }
       // const { password, ...others } = data[0]; // Rename password variable to _ to avoid conflict
       const sanitizedData = values.map(entry => {
          const { password:_, ...rest } = entry;
          return rest;
      });
      res.status(200).json({ state: 'success', message: 'Your profile update was successful!', data: sanitizedData });
      } else {
        const updateQuery = `
          UPDATE users
          SET
            email = ?,
            first_name = ?,
            last_name = ?,
            company = ?,
            phone = ?,
            hobbies = ?,
            profilePic = ?,
            username = ?
          WHERE id = ?
        `;
        const values = [email, first_name, last_name, company, phone, hobbies, profilePic, username, userId];

        const data = await new Promise((resolve, reject) => {
          dbCI.query(updateQuery, values, (err, data) => {
            if (err) {
              console.error(err);
              reject(err);
            }
            console.log("data[0]", data);
            resolve(data);
          });
        });

        if (data.affectedRows === 0) {
          return res.status(200).json({ state: 'failed', message: 'User not found' });
        }
      // const { password, ...others } = data[0]; // Rename password variable to _ to avoid conflict
      const sanitizedData = values.map(entry => {
          const { password:_, ...rest } = entry;
          return rest;
      });
        res.status(200).json({ state: 'success', message: 'Your profile update was successful!', data: sanitizedData });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(200).json({ state: 'failed', message: 'An error occurred while updating the profile' });
    }
  });
};

export const login = (req, res) => {
  const q = "SELECT * FROM users WHERE username = ?";
  var usarData;
  console.log("REQ.BODY", req.body);
 // Inside the login API endpoint
dbCI.query(q, [req.body.username], (err, data) => {

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
  console.log("Ogbonge Login DATA ID", data[0].id );
   // Fetch Some data from doctor or patient tables based on the user type
   // If user type is doctor then fetch doctor data else if it is patent, fetch patient else do nothing

   if(data[0].usertype) {
    const usernamer = data[0].email.split('@')[0];
    const q = `SELECT * FROM ${data[0].usertype} WHERE email = ?`;
     dbCI.query(q, [usernamer+'@%'], (err, data) => {
       if (err) {
         console.error(err);
         return res.status(500).json(err);
       }
       usarData = data;
    })
  }

  const token = jwt.sign({ id: data[0].id }, "secretkey", { expiresIn: '2d' });
  const { password:_, ...others } = data[0];
  console.log("Ogbonge Login Token", token)

  res
    .cookie("accessToken", token, {
      httpOnly: true,
    })
  .status(200).json({ state: 'success', message: 'Your login was successful!', data: others, usarData, token });
});

};

export const logout = (req, res) => {
  res.clearCookie("accessToken",{
    secure:true,
    sameSite:"none"
  }).status(200).json("User has been logged out.")
};

////////////////////////////// CI TABLES ////////////////////////////////////////////////////

/* export const registerDoctor = (req, res) => {
  try {
    // Extract data from the request body
    const { name, email, password, address, phone, department, specialization, bio } = req.body;

    // Check if the doctor already exists in the database
    const checkQuery = 'SELECT * FROM doctor WHERE email = ?';
    dbCI.query(checkQuery, [email], (err, results) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          state: 'failed',
          message: 'Something went wrong.'
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          state: 'failed',
          message: 'Doctor with this email already exists. Please choose another email.'
        });
      }

      // Hash the password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Insert the doctor data into the database
      const insertQuery = `INSERT INTO doctor (name, email, address, phone, department, specialization, bio)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;
      dbCI.query(insertQuery, [name, email, address, phone, department, specialization, bio], (err, result) => {
        if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({
            state: 'failed',
            message: 'Something went wrong.'
          });
        }

        return res.status(200).json({
          state: 'success',
          message: 'Doctor registered successfully',
          data: result
        });
      });
    });
  } catch (error) {
    console.error('Error registering doctor:', error.message);
    return res.status(500).json({
      state: 'failed',
      message: 'Something went wrong.'
    });
  }
}; */
export const registerDoctor = (req, res) => {
  try {
    // Initialize some variables
    var ip_address = "", username = "", salt = "", activation_code = "",
      forgotten_password_code = "", forgotten_password_time = "888", remember_code = "",
      created_on = "", last_login = "", active = "", first_name = "", last_name = "",
      company = "", lor = "", hospital_ion_id = "", created_at = "", updated_at = "";

    // Extract data from the request body
    const { name, email, password, address, phone, department, specialization, licence_number, issuing_authority, validity_date, year_of_experience, bio } = req.body;
    username = email.split('@')[0];
    ip_address = req.connection.remoteAddress;

    // Get the current date and time
    const currentDate = new Date();

    // Format the date and time
    const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
    created_on = formattedDate;
    updated_at = formattedDate;

    // Query to get the last inserted ID from the users table
    const getLastIdQuery = 'SELECT id FROM users ORDER BY id DESC LIMIT 1';

    // Execute the query
    dbCI.query(getLastIdQuery, (err, result) => {
      if (err) {
        console.error('Database error:', err.message);
        // Handle error
        return;
      }

      // Extract the last ID from the result
      const lastId = result[0].id;

      // Increment the last ID by one
      lor = lastId + 1;
      hospital_ion_id = lastId + 1;
    });
    // Check if the doctor already exists in the database
    const checkQuery = 'SELECT * FROM doctor WHERE email = ?';
    dbCI.query(checkQuery, [email], (err, results) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(200).json({
          state: 'failed',
          message: 'Something went wrong.'
        });
      }

      if (results.length > 0) {
        return res.status(200).json({
          state: 'failed',
          message: 'Doctor with this email already exists. Please choose another email.'
        });
      }

      // Hash the password
      salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Insert user data into the database
      const userInsertQuery = `
        INSERT INTO users (
          usertype, ip_address, username, password, salt, email, activation_code,
          forgotten_password_code, forgotten_password_time, remember_code,
          created_on, last_login, active, first_name, last_name,
          company, phone, hobbies, profilePic, lor, hospital_ion_id, seenNotifications, unSeenNotifications, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const userData = [
        'doctor', ip_address, username, hashedPassword, salt, email, activation_code,
        forgotten_password_code, forgotten_password_time, remember_code,
        created_on, last_login, active, first_name, last_name,
        company, phone, 'nil', 'nil', lor, hospital_ion_id, '[]', '[]', created_at, updated_at
      ];

      // Insert doctor data into the database
      const doctorInsertQuery = `
        INSERT INTO doctor (name, email, address, phone, department, specialization, year_of_experience, license_number, issuing_authority, validity_date, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const doctorData = [
        name, email, address, phone, department, specialization, year_of_experience, licence_number, issuing_authority, validity_date, bio
      ];

      // Execute both queries in parallel
      Promise.all([
        new Promise((resolve, reject) => {
          dbCI.query(userInsertQuery, userData, (err, userResult) => {
            if (err) {
              console.error('User Insert Error:', err.message);
              reject(err);
            } else {
              resolve(userResult);
            }
          });
        }),
        new Promise((resolve, reject) => {
          dbCI.query(doctorInsertQuery, doctorData, (err, doctorResult) => {
            if (err) {
              console.error('Doctor Insert Error:', err.message);
              reject(err);
            } else {
              resolve(doctorResult);
            }
          });
        })
      ])
      .then(([userResult, doctorResult]) => {
        // Combine results and send response
        return res.status(200).json({
          state: 'success',
          message: 'Your doctor registration was successful!',
          data: { user: userResult, doctor: doctorResult }
        });
      })
      .catch(error => {
        console.error('Database error:', error.message);
        return res.status(200).json({
          state: 'failed',
          message: 'Something went wrong.'
        });
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      state: 'failed',
      message: 'Something went wrong.'
    });
  }
};


  /* export const registerPatient = (req, res) => {
  try {
    const { name, email, doctor, address, phone, sex, birthdate, age, bloodGroup } = req.body;

    const checkQuery = 'SELECT * FROM patient WHERE email = ?';
    dbCI.query(checkQuery, [email], (err, results) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          state: 'failed',
          message: 'Something went wrong.'
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          state: 'failed',
          message: 'Patient with this email already exists. Please choose another email.'
        });
      }

      const insertQuery = `INSERT INTO patient (name, email, doctor, address, phone, sex, birthdate, age, bloodgroup)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      dbCI.query(insertQuery, [name, email, doctor, address, phone, sex, birthdate, age, bloodGroup], (err, result) => {
        if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({
            state: 'failed',
            message: 'Something went wrong.'
          });
        }

        return res.status(200).json({
          state: 'success',
          message: 'Patient registered successfully!',
          data: result
        });
      });
    });
  } catch (error) {
    console.error('Error registering patient:', error.message);
    return res.status(500).json({
      state: 'failed',
      message: 'Something went wrong.'
    });
  }
}; */

export const registerPatient = (req, res) => {
  try {
    // Initialize variables for users table insertion
    var ip_address = "", username = "", salt = "", activation_code = "",
      forgotten_password_code = "", forgotten_password_time = "", remember_code = "",
      created_on = "", last_login = "", active = "", first_name = "", last_name = "",
      company = "", lor = "", hospital_ion_id = "", created_at = "", updated_at = "";

   // Extract data from the request body
   const { name, email, password, doctor, address, phone, sex, birthdate, age, bloodGroup } = req.body;
   username = email.split('@')[0];
   ip_address = req.connection.remoteAddress;

   // Get the current date and time
  const currentDate = new Date();

  // Format the date and time
  const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
  created_on = formattedDate;
  updated_at = formattedDate;

  // Query to get the last inserted ID from the users table
  const getLastIdQuery = 'SELECT id FROM users ORDER BY id DESC LIMIT 1';

  // Execute the query
  dbCI.query(getLastIdQuery, (err, result) => {
    if (err) {
      console.error('Database error:', err.message);
      // Handle error
      return;
    }

    // Extract the last ID from the result
    const lastId = result[0].id;

    // Increment the last ID by one
    lor = lastId + 1;
    hospital_ion_id = lastId + 1;
   });
    // Check if the patient already exists in the database
    const checkQuery = 'SELECT * FROM patient WHERE email = ?';
    dbCI.query(checkQuery, [email], (err, results) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(200).json({
          state: 'failed',
          message: 'Something went wrong.'
        });
      }

      if (results.length > 0) {
        return res.status(200).json({
          state: 'failed',
          message: 'Patient with this email already exists. Please choose another email.'
        });
      }

      // Hash the password for user insertion
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Define insert query for users table
      const userInsertQuery = `
        INSERT INTO users (
          usertype, ip_address, username, password, salt, email, activation_code,
          forgotten_password_code, forgotten_password_time, remember_code,
          created_on, last_login, active, first_name, last_name,
          company, phone, hobbies, profilePic, lor, hospital_ion_id, seenNotifications, unSeenNotifications, created_at, updated_at
        )
        VALUES ('patient', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Prepare user data for insertion
      const userData = [
        ip_address, username, hashedPassword, salt, email, activation_code,
        forgotten_password_code, forgotten_password_time, remember_code,
        created_on, last_login, active, first_name, last_name,
        company, phone, 'nil', 'nil', lor, hospital_ion_id, '[]', '[]', created_at, updated_at
      ];

      // Insert user data into the database
      const userInsertPromise = new Promise((resolve, reject) => {
        dbCI.query(userInsertQuery, userData, (err, userResult) => {
          if (err) {
            console.error('User Insert Error:', err.message);
            reject(err);
          } else {
            resolve(userResult);
          }
        });
      });

      // Define insert query for patient table
      const patientInsertQuery = `
        INSERT INTO patient (name, email, doctor, address, phone, sex, birthdate, age, bloodgroup, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Prepare patient data for insertion
      const patientData = [
        name, email, doctor, address, phone, sex, birthdate, age, bloodGroup,  created_at, updated_at
      ];

      // Insert patient data into the database
      const patientInsertPromise = new Promise((resolve, reject) => {
        dbCI.query(patientInsertQuery, patientData, (err, patientResult) => {
          if (err) {
            console.error('Patient Insert Error:', err.message);
            reject(err);
          } else {
            resolve(patientResult);
          }
        });
      });

      // Execute both queries in parallel
      Promise.all([userInsertPromise, patientInsertPromise])
        .then(([userResult, patientResult]) => {
          // Combine results and send response
          return res.status(200).json({
            state: 'success',
            message: 'Your patient registration was successful!',
            data: { user: userResult, patient: patientResult }
          });
        })
        .catch(error => {
          console.error('Database error:', error.message);
          return res.status(200).json({
            state: 'failed',
            message: 'Something went wrong.'
          });
        });
    });
  } catch (error) {
    console.error('Error registering patient:', error.message);
    return res.status(200).json({
      state: 'failed',
      message: 'Something went wrong.'
    });
  }
};



/* // Controller function to handle the request and retrieve all doctors
  export const getAllDoctors = (req, res) => {
  // Query to retrieve all doctors from the database
  const query = 'SELECT * FROM doctor';

  // Execute the query
  dbCI.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching doctors:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    // Return the list of doctors as a JSON response
    res.json(results);
  });
};
 */

/* // Controller function to handle the request and retrieve all doctors
export const getAllDoctors = (req, res) => {
  // Query to retrieve all doctors from the database, excluding the 'id' column
 // const query = "SELECT * FROM doctor order by online=yes";
 // It makes sure the doctors that have online = yes to come first
 const query = "SELECT * FROM doctor ORDER BY CASE WHEN online = 'yes' THEN 1 ELSE 2 END";

  // Execute the query
  dbCI.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching doctors:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Remove the 'id' field from each result
    const doctorsWithoutId = results.map((doctor) => {
      const { id, ...rest } = doctor;
      const restWithCounty = {countinent: id, ...rest};
      return restWithCounty;
    });

    // Return the list of doctors (without 'id') as a JSON response
    res.json(doctorsWithoutId);
  });
}; */

// Controller function to handle the request and retrieve all doctors
export const getAllDoctors = (req, res) => {
  // Step 1: Fetch all doctors
  const doctorQuery = "SELECT * FROM doctor ORDER BY CASE WHEN online = 'yes' THEN 1 ELSE 2 END";

  dbCI.query(doctorQuery, (doctorError, doctorResults) => {
    if (doctorError) {
      console.error('Error fetching doctors:', doctorError);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Step 2: Fetch all users
    const userQuery = "SELECT id, username FROM users";

    dbCI.query(userQuery, (userError, userResults) => {
      if (userError) {
        console.error('Error fetching users:', userError);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      // Step 3: Create a map of username to userId
      const userMap = {};
      userResults.forEach(user => {
        userMap[user.username] = user.id;
      });

      // Step 4: Map doctor data to include the correct userId based on email prefix
      const doctorsWithUserId = doctorResults.map((doctor) => {
        const emailPrefix = doctor.email.split('@')[0];
        const userId = userMap[emailPrefix];
        return {
          ...doctor,
          doctorUserId: userId || null // Add null if no matching user is found
        };
      });

      // Step 5: Log the results for debugging
      //console.log('doctorsWithUserId:', doctorsWithUserId);

      // Step 6: Return the list of doctors with the associated user ID as a JSON response
      res.json(doctorsWithUserId);
    });
  });
};





// Controller function to handle the request and retrieve patients for a particular doctor
export const getPatientsByDoctorId = (req, res) => {
  const doctorId = req.params.doctorId;

  // Query to retrieve patients who have booked an appointment with the specified doctor
  /*  const query = `
    SELECT p.id, p.name, p.sex
    FROM patient p
    JOIN appointment a ON p.id = a.patientid
    WHERE a.doctorid = ?
  `;  */
  const query = 'SELECT * FROM patient';

  // Execute the query with the provided doctorId
  dbCI.query(query, [doctorId], (error, results) => {
    if (error) {
      console.error('Error fetching patients:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Return the list of patients as a JSON response
    res.json(results);
  });
};

/* export const getPatientsByDoctorId = (req, res) => {
  const doctorId = req.params.doctorId; // Assuming doctorId is passed as a URL parameter

  const query = `
    SELECT p.id, p.name, p.sex, u.id AS user_id, u.name AS user_name, u.lor
    FROM patient p
    JOIN appointment a ON p.id = a.patientid
    JOIN users u ON u.lor = a.doctorid
    WHERE a.doctorid = ?
  `;

  dbCI.query(query, [doctorId], (error, results) => {
    if (error) {
      console.error('Error fetching patients:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Return the list of patients as a JSON response
    res.json(results);
  });
}; */


// Controller method
export const submitPatientRequestForm = (req, res) => {
  try {
    uploadPatientrequest(req, res, (err) => {
      if (err) {
        console.error('File upload error:', err);
        return res.status(500).json({ success: false, message: 'File upload failed.' });
      }

      const {
        fullname,
        email,
        stateOfOrigin,
        stateOfResidence,
        lga,
        surgery,
        symptoms,
        symptomSeverity,
        covidVaccine,
        emergencyServices,
        physicianPreference,
        physicianPreferencesDetails,
        adverseReactions,
        adverseReactionsDetails,
        meansOfIdentification
      } = req.body;

      // Validate required fields
      if (!fullname || !email || !stateOfOrigin || !stateOfResidence || !lga || !symptomSeverity) {
          return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
      }

      // Convert symptoms array to a string
      const symptomsString = symptoms.join(', ');

      // Construct the form data object
      const formData = {
          fullname,
          email,
          stateOfOrigin,
          stateOfResidence,
          lga,
          surgery: surgery || null,
          symptoms: symptomsString || null, // Ensure that symptoms is not empty
          symptomSeverity,
          covidVaccine: covidVaccine || null,
          emergencyServices: emergencyServices || null,
          physicianPreference: physicianPreference || null,
          physicianPreferencesDetails: physicianPreferencesDetails || null,
          adverseReactions: adverseReactions || null,
          adverseReactionsDetails: adverseReactionsDetails || null,
          meansOfIdentification: meansOfIdentification || null
      };

      // Handle file upload if available
      const uploadedFile = req.file ? req.file.path : null;

      // Insert form data into the database
      const insertQuery = 'INSERT INTO patient_request_form SET ?';
      const values = { ...formData, uploadedFile };

      dbCI.query(insertQuery, values, (insertError, insertResults) => {
        if (insertError) {
          console.error('Database insert error:', insertError);
          return res.status(500).json({ success: false, message: 'Database error.' });
        }

        res.status(200).json({ success: true, message: 'Form submitted successfully.' });
      });
    });
  } catch (error) {
    console.error('Form submission error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};







import mysql from 'mysql';
import { db, dbCI } from "../connect.js";


// Check availability of time slot
const checkAvailability = (date, timeSlot) => {
  return new Promise((resolve, reject) => {
    // Query to check if the time slot is already booked
    const query = `
      SELECT * FROM appointment 
      WHERE date = ? AND time_slot = ?
    `;
    
    // Execute the query
    dbCI.query(query, [date, timeSlot], (error, results) => {
      if (error) {
        return reject(error);
      }
      
      // If there are no results, the time slot is available
      const isAvailable = results.length === 0;
      resolve({ isAvailable });
    });
  });
};

// Controller method to handle availability check
export const checkAppointmentAvailability= async (req, res) => {
  const { date, timeSlot } = req.body; // Assuming date and timeSlot are provided in the request body

  try {
    // Check availability of the time slot
    const { isAvailable } = await checkAvailability(date, timeSlot);
    
    // Return JSON response based on availability
    res.json({ available: isAvailable });
  } catch (error) {
    // Handle error
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller method to get all appointments
export const getAllAppointments = (req, res) => {
  const query = 'SELECT * FROM appointment';
  dbCI.query(query, (error, results) => {
    if (error) {
      console.error('Error getting appointments:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
};

// Controller method to get appointments by id and status
export const getAppointmentsByIdAndStatus = (req, res) => {
  const { id, userIdName, status } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  const query = `SELECT * FROM appointment WHERE ${userIdName} = ? AND status = ?`;
  dbCI.query(query, [id, status], (error, results) => {
    if (error) {
      console.error('Error getting appointments:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    const formattedResult = results.map((result, index) => {
      return {...result, add_date:result.add_date.split(" ")[0]}
    })
    res.json(formattedResult);
  });
};


/* // Controller method to insert a new appointment
export const insertAppointment = (req, res) => {
  const appointmentData = req.body.appointment; // Assuming appointment data is provided in the request body
  console.log('appointmentData:', appointmentData);
  
  const query = `
    INSERT INTO appointment (
      doctor, patient, location, s_time, e_time, status, date, time_slot, remarks, add_date, registration_time, s_time_key, user, request, hospital_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    appointmentData.doctor,
    appointmentData.patient,
    appointmentData.location,
    appointmentData.start,
    appointmentData.end,
    appointmentData.status,
    appointmentData.date,
    appointmentData.time_slot,
    appointmentData.remarks,
    appointmentData.add_date,
    appointmentData.registration_time,
    appointmentData.s_time_key,
    appointmentData.user,
    appointmentData.request,
    appointmentData.hospital_id
  ];
  
  dbCI.query(query, values, (error, result) => {
    if (error) {
      console.error('Error inserting appointment:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  
    return res.status(200).json({
      state: 'success',
      message: 'Appointment inserted successfully',
      id: result.insertId
    });
  });
  } */

  // Controller method to insert a new appointment
export const insertAppointment = (req, res) => {
  const appointmentData = req.body.appointment; // Assuming appointment data is provided in the request body
  console.log('appointmentData:', appointmentData);

  // Query to check for overlapping appointments
  const checkQuery = `
    SELECT * FROM appointment
    WHERE doctor = ? 
    AND date = ?
    AND (
      (s_time < ? AND e_time > ?) OR
      (s_time >= ? AND s_time < ?) OR
      (e_time > ? AND e_time <= ?)
    )
  `;
  
  const checkValues = [
    appointmentData.doctor,
    appointmentData.date,
    appointmentData.end, // Check if the end time overlaps with any existing start time
    appointmentData.start, // Check if the start time overlaps with any existing end time
    appointmentData.start, // Check if the new start time is within any existing time range
    appointmentData.end, // Check if the new end time is within any existing time range
    appointmentData.start, // Check if the new start time is before any existing end time
    appointmentData.end // Check if the new end time is after any existing start time
  ];
  
  dbCI.query(checkQuery, checkValues, (checkError, checkResult) => {
    if (checkError) {
      console.error('Error checking appointment availability:', checkError);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (checkResult.length > 0) {
      return res.status(409).json({ error: 'Appointment slot is not available' });
    }
    
    // Query to insert the new appointment if no overlapping appointments found
    const insertQuery = `
      INSERT INTO appointment (
        appointment_type, patientid, doctorid, doctor, patient, location, s_time, e_time, status, date, time_slot, remarks, add_date, registration_time, s_time_key, user, request, hospital_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const insertValues = [
      appointmentData.appointment_type,
      appointmentData.patientid,
      appointmentData.doctor.split("__")[0],
      appointmentData.doctor.split("__")[1],
      appointmentData.patient,
      appointmentData.location,
      appointmentData.start,
      appointmentData.end,
      appointmentData.status,
      appointmentData.date,
      appointmentData.time_slot,
      appointmentData.remarks,
      appointmentData.add_date,
      appointmentData.registration_time,
      appointmentData.s_time_key,
      appointmentData.user,
      appointmentData.request,
      appointmentData.hospital_id
    ];
    
    dbCI.query(insertQuery, insertValues, (insertError, insertResult) => {
      if (insertError) {
        console.error('Error inserting appointment:', insertError);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      return res.status(200).json({
        state: 'success',
        message: 'Appointment inserted successfully',
        id: insertResult.insertId
      });
    });
  });
};

  

// Controller method to update an appointment
// Controller method to update an existing appointment
export const updateAppointment = (req, res) => {
  const appointmentId = req.params.appointmentId;
  const appointmentData = req.body.appointment; // Assuming appointment data is provided in the request body
  console.log('appointmentData:', appointmentData);
  
  // Check appointment availability
  const checkAvailabilityQuery = `
    SELECT id FROM appointment 
    WHERE 
      doctor = ? 
      AND date = ? 
      AND id != ? 
      AND (
        (s_time <= ? AND e_time >= ?) 
        OR 
        (s_time <= ? AND e_time >= ?)
      )
  `;
  
  const checkAvailabilityValues = [
    appointmentData.doctor,
    appointmentData.date,
    appointmentId,
    appointmentData.start,
    appointmentData.start,
    appointmentData.end,
    appointmentData.end
  ];

  dbCI.query(checkAvailabilityQuery, checkAvailabilityValues, (availabilityError, availabilityResult) => {
    if (availabilityError) {
      console.error('Error checking appointment availability:', availabilityError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (availabilityResult.length > 0) {
      // Appointment slot is not available
      return res.status(400).json({ error: 'Appointment slot is not available' });
    }

    // Appointment slot is available, proceed to update
    const updateQuery = `
      UPDATE appointment SET 
        doctor = ?, 
        patient = ?, 
        location = ?, 
        s_time = ?, 
        e_time = ?, 
        status = ?, 
        date = ?, 
        time_slot = ?, 
        remarks = ?, 
        add_date = ?, 
        registration_time = ?, 
        s_time_key = ?, 
        user = ?, 
        request = ?, 
        hospital_id = ? 
      WHERE id = ?
    `;

    const updateValues = [
      appointmentData.doctor,
      appointmentData.patient,
      appointmentData.location,
      appointmentData.start,
      appointmentData.end,
      appointmentData.status,
      appointmentData.date,
      appointmentData.time_slot,
      appointmentData.remarks,
      appointmentData.add_date,
      appointmentData.registration_time,
      appointmentData.s_time_key,
      appointmentData.user,
      appointmentData.request,
      appointmentData.hospital_id,
      appointmentId
    ];

    dbCI.query(updateQuery, updateValues, (updateError, updateResult) => {
      if (updateError) {
        console.error('Error updating appointment:', updateError);
        return res.status(500).json({ error: 'Internal server error' });
      }

      return res.status(200).json({
        state: 'success',
        message: 'Appointment updated successfully',
        affectedRows: updateResult.affectedRows
      });
    });
  });
};

// Controller method to delete an appointment
export const deleteAppointment = (req, res) => {
  const { id } = req.params; // Assuming appointment ID is provided in the request parameters
  const query = 'DELETE FROM appointment WHERE id = ?';
  dbCI.query(query, id, (error, result) => {
    if (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json({ message: 'Appointment deleted successfully', id });
  });
};

// Controller method to approve an appointment
export const approveAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;

  try {
      // Update appointment status to 'confirmed'
      const queryUpdate = 'UPDATE appointment SET status = ? WHERE id = ?';
      dbCI.query(queryUpdate, [status, appointmentId], (error, result) => {
          if (error) {
              console.error('Error updating appointment status:', error);
              return res.status(500).json({ error: 'Internal server error' });
          }

          // Fetch appointment details after update
          const querySelect = 'SELECT appointmentDate, patientId FROM appointment WHERE id = ?';
          dbCI.query(querySelect, [appointmentId], (error, result) => {
              if (error) {
                  console.error('Error fetching appointment details:', error);
                  return res.status(500).json({ error: 'Internal server error' });
              }

              const { appointmentDate, patientId } = result[0];

              // Construct notification object
              const notification = {
                  message: `Your appointment has been confirmed to hold on ${appointmentDate}`,
                  patientId
              };

              // Insert notification into the database
              const queryInsertNotification = 'INSERT INTO notifications SET ?';
              dbCI.query(queryInsertNotification, notification, (error, result) => {
                  if (error) {
                      console.error('Error adding notification:', error);
                      return res.status(500).json({ error: 'Internal server error' });
                  }

                  // Check if receiver (patient) is online
                  if (receiverIsOnline(patientId)) {
                      // Send real-time notification to receiver's WebSocket connection
                      sendRealTimeNotification(patientId, notification);
                  }

                  res.json({ message: 'Appointment approved successfully', appointmentDate, patientId });
              });
          });
      });
  } catch (error) {
      console.error('Error approving appointment:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};


// Controller method to decline an appointment
export const declineAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;

  try {
      // Update appointment status to 'declined'
      const queryUpdate = 'UPDATE appointment SET status = ? WHERE id = ?';
      dbCI.query(queryUpdate, [status, appointmentId], (error, result) => {
          if (error) {
              console.error('Error updating appointment status:', error);
              return res.status(500).json({ error: 'Internal server error' });
          }

          // Fetch appointment details after update
          const querySelect = 'SELECT appointmentDate, patientId FROM appointment WHERE id = ?';
          dbCI.query(querySelect, [appointmentId], (error, result) => {
              if (error) {
                  console.error('Error fetching appointment details:', error);
                  return res.status(500).json({ error: 'Internal server error' });
              }

              const { appointmentDate, patientId } = result[0];

              // Construct notification object
              const notification = {
                  message: `Your appointment has been declined to hold on ${appointmentDate}`,
                  patientId
              };

              // Insert notification into the database
              const queryInsertNotification = 'INSERT INTO notifications SET ?';
              dbCI.query(queryInsertNotification, notification, (error, result) => {
                  if (error) {
                      console.error('Error adding notification:', error);
                      return res.status(500).json({ error: 'Internal server error' });
                  }

                  // Check if receiver (patient) is online
                  if (receiverIsOnline(patientId)) {
                      // Send real-time notification to receiver's WebSocket connection
                      sendRealTimeNotification(patientId, notification);
                  }

                  res.json({ message: 'Appointment declined successfully', appointmentDate, patientId });
              });
          });
      });
  } catch (error) {
      console.error('Error declining appointment:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};


/* module.exports = {
  checkAppointmentAvailability,
  getAllAppointments,
  insertAppointment,
  updateAppointment,
  deleteAppointment
};
 */
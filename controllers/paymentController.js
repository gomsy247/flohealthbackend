import { dbCI, pool } from "../connect.js";

// Method to insert a new payment into the database
export const insertPayment = (req, res) => {
    const { amount, patientName, date } = req.body;
    const query = 'INSERT INTO payments (amount, patient_name, date) VALUES (?, ?, ?)';
    pool.query(query, [amount, patientName, date], (error, results) => {
      if (error) {
        console.error('Error inserting payment:', error);
        return res.status(500).json({ success: false, message: 'Failed to insert payment details' });
      }
      return res.status(201).json({ success: true, message: 'Payment details inserted successfully' });
    });
  };
  


  
// Method to get all payments from the database
export const getPayments = (req, res) => {
  const query = 'SELECT * FROM payments';
  dbCI.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching payments:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
    }
    console.log('Error fetching payments:', results);
    return res.status(200).json({ success: true, payments: results });
  });
};


  // Method to get a payment by its ID from the database
  export const getPaymentById = (req, res) => {
    const paymentId = req.params.id; // Extract payment ID from request parameters
    
    // SQL query to fetch payment by ID
    const query = 'SELECT * FROM payments WHERE id = ?';
  
    // Execute SQL query
    dbCI.query(query, [paymentId], (error, results) => {
      if (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payment' });
      } else {
        if (results.length === 0) {
          res.status(404).json({ success: false, message: 'Payment not found' });
        } else {
          const payment = results[0]; // Extract the first row (assuming only one payment with that ID)
          res.status(200).json({ success: true, payment });
        }
      }
    });
  };


  // Controller method to get patient payment details by doctor ID
export const getPatientPaymentsByDoctorId = async (req, res) => {
    const doctorId = req.params.doctorId; // Extract doctor ID from request parameters
  
    try {
      // SQL query to fetch patient payment details by doctor ID
      const query = 'SELECT * FROM payments WHERE doctorId = ?';
  
      // Execute the query with doctor ID
      const result = await pool.query(query, [doctorId]);
  
      // Return patient payment details if found
      if (result.length > 0) {
        res.status(200).json({ success: true, data: result });
      } else {
        res.status(404).json({ success: false, message: 'No payments found for this doctor' });
      }
    } catch (error) {
      // Handle errors
      console.error('Error fetching patient payments:', error.message);
      res.status(500).json({ success: false, message: 'Error fetching patient payments' });
    }
  };


  // Method to update a payment by ID
export const adminUpdatePayment = async (req, res) => {
    const paymentId = req.params.id; // Extract payment ID from request parameters
    const { amount, patientName, date } = req.body; // Extract new payment data from request body
  
    try {
      // SQL query to update a payment by ID
      const query = 'UPDATE payments SET amount = ?, patientName = ?, date = ? WHERE id = ?';
  
      // Execute the query with new data and payment ID
      const result = await pool.query(query, [amount, patientName, date, paymentId]);
  
      // Return true if the payment was successfully updated
      if (result.affectedRows > 0) {
        res.status(200).json({ success: true, message: 'Payment updated successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Payment not found' });
      }
    } catch (error) {
      // Handle errors
      console.error('Error updating payment:', error.message);
      res.status(500).json({ success: false, message: 'Error updating payment' });
    }
  };

 /*  module.exports = { getPaymentById, getPayments, insertPayment, adminUpdatePayment } */
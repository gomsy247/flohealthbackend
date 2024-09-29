io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    console.log('List of doctors connected', doctors);
  
    // When a doctor joins, save their socket ID using their doctorId
    socket.on('doctor-join', ({ doctorId }) => {
      doctors[doctorId] = socket.id;
      console.log(`Doctor connected with ID: ${doctorId}, Socket ID: ${socket.id}`);
    });
  
    // When the patient joins, save their socket ID
    socket.on('patient-join', ({ patientName, userId, doctorId, socketId }) => {
      users[userId] = socketId;
      console.log(`Patient Name: ${patientName}, User ID: ${userId}, Doctor ID: ${doctorId}, Socket ID: ${socketId}`);
      // Send to the specified Doctor using their ID
      const doctorSocketId = doctors[doctorId];
      if (doctorSocketId) {
        console.log(`Doctors: ${JSON.stringify(doctors)}`)
        io.to(doctorSocketId).emit('consultationRequest', { patientName, userId, doctorId, socketId });
      } else {
        console.log(`Doctor with ID ${doctorId} is not connected.`);
      }
    });
  
    // Handle consultation response from the doctor
    socket.on('consultation-response', ({ userId, status }) => {
      const patientSocketId = users[userId];
      if (patientSocketId) {
        io.to(patientSocketId).emit('consultation-status', { status });
      }
    });
  
    socket.on('disconnect', () => {
      console.log('Client disconnected');
      // Remove the user or doctor from the tracking list
      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
          break;
        }
      }
      for (let doctorId in doctors) {
        if (doctors[doctorId] === socket.id) {
          delete doctors[doctorId];
          break;
        }
      }
    });
  });
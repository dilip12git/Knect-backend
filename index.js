// server.js
require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Initialize the app with Firebase Admin SDK using environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const port = 3000;

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Function to send push notification with an image
const sendPushNotification = (fcmToken, title, body, imageUrl) => {
  const message = {
    notification: {
      title: title,
      body: body,
      image: imageUrl,  // Image URL to be displayed in the notification
    },
    token: fcmToken, // FCM token of the target device
  };

  admin.messaging().send(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};

// API endpoint to send notification
app.post('/send-notification', (req, res) => {
  const { fcmToken, title, body, imageUrl } = req.body;

  // Validate request data
  if (!fcmToken || !title || !body || !imageUrl) {
    return res.status(400).send({ error: 'Missing parameters' });
  }

  // Send push notification
  sendPushNotification(fcmToken, title, body, imageUrl);

  // Respond to the client
  res.status(200).send({ success: 'Notification sent successfully!' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

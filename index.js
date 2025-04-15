require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} catch (error) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY', error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('✅ Server is running!');
});

const sendPushNotification = (fcmToken, title, body, imageUrl) => {
  const message = {
    notification: {
      title,
      body,
      image: imageUrl,
    },
    token: fcmToken,
  };

  return admin.messaging().send(message);
};

app.post('/send-notification', async (req, res) => {
  const { fcmToken, title, body, imageUrl } = req.body;

  if (!fcmToken || !title || !body) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const response = await sendPushNotification(fcmToken, title, body, imageUrl);
    res.status(200).json({ success: 'Notification sent successfully!', response });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: 'Failed to send notification', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

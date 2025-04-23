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

// Function to send multiple notifications with custom data
const sendPushNotifications = (tokens, notificationData) => {
  const promises = tokens.map(token => {
    const message = {
      token,
      notification: {
        title: notificationData.title,
        body: notificationData.body,
        image: notificationData.imageUrl || undefined,
      },
      data: {
        screen: notificationData.screen || '',
        senderId: notificationData.senderId || '',
        postId: notificationData.postId || '',
        type: notificationData.type || '',
      },
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    };

    return admin.messaging().send(message);
  });

  return Promise.all(promises); // Will return an array of results
};

// API endpoint to receive notification payload from frontend
app.post('/send-notification', async (req, res) => {
  const {
    tokens,
    title,
    body,
    imageUrl,
    screen,
    senderId,
    postId,
    type,
  } = req.body;

  if (!tokens || !Array.isArray(tokens) || tokens.length === 0 || !title || !body) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  try {
    const response = await sendPushNotifications(tokens, {
      title,
      body,
      imageUrl,
      screen,
      senderId,
      postId,
      type,
    });

    res.status(200).json({ success: 'Notifications sent successfully!', response });
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

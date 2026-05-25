import * as admin from "firebase-admin";
import logger from "../utils/logger";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

let firebaseApp: admin.app.App | null = null;

if (projectId && clientEmail && privateKey) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    logger.info("Firebase Admin SDK initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin SDK:", error);
  }
} else {
  logger.warn(
    "FCM configuration credentials missing. Push notifications will run in mock mode."
  );
}

export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<boolean> => {
  if (!token) return false;

  if (!firebaseApp) {
    logger.debug(`[Mock Push] Sending notification to ${token}:`);
    logger.debug(`Title: ${title} | Body: ${body}`);
    logger.debug(`Data: ${JSON.stringify(data)}`);
    return true;
  }

  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent successfully. Message ID: ${response}`);
    return true;
  } catch (error) {
    logger.error(`Error sending push notification to token ${token}:`, error);
    return false;
  }
};

export default firebaseApp;

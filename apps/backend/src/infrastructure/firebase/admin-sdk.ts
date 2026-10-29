import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.cert({
    clientEmail: process.env.FIREBASE_client_email,
    privateKey: process.env.FIREBASE_private_key,
    projectId: process.env.FIREBASE_project_id,
  }),
});

export default admin;

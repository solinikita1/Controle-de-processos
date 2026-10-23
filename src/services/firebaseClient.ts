import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import config from "../../firebase-applet-config.json";
export const app = getApps().length ? getApp() : initializeApp(config);
export const db = getFirestore(app, config.firestoreDatabaseId || "(default)");
export const auth = getAuth(app);

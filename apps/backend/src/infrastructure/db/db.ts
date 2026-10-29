import "@core/env/load-env.js";

import mongoose from "mongoose";

export async function connectDb(
  uri: string = process.env.MONGODB_URI ??
    (() => {
      throw new Error("MONGODB_URI is not defined");
    })(),
): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    return mongoose;
  }
  return mongoose.connect(uri);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

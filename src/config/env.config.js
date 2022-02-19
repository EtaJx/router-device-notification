import dotenv from 'dotenv';

dotenv.config();

export const { NOTIFICATION_URI, LOCAL_HOST, PASSWORD } = process.env;

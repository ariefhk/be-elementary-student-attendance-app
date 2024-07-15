import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export const generateUUID = () => uuidv4();

export const createBcryptPassword = async (password, salt = 10) => {
  return await bcrypt.hash(password, salt);
};

export const compareBcryptPassword = async (data, encriptedData) => {
  return await bcrypt.compare(data, encriptedData);
};

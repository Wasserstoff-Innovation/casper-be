import { Types } from 'mongoose';

/**
 * Safely converts a userId (string or number) to MongoDB ObjectId
 * Throws an error if the userId is not a valid ObjectId format
 *
 * @param userId - User ID from JWT token (could be old integer or new ObjectId string)
 * @returns MongoDB ObjectId
 * @throws Error if userId is not a valid ObjectId format
 */
export function toObjectId(userId: string | number): Types.ObjectId {
  const userIdStr = userId.toString();

  if (!Types.ObjectId.isValid(userIdStr)) {
    throw new Error('Invalid user session. Please log out and log in again to refresh your authentication token.');
  }

  return new Types.ObjectId(userIdStr);
}

/**
 * Checks if a value is a valid MongoDB ObjectId format
 *
 * @param value - Value to check
 * @returns true if value is a valid ObjectId format
 */
export function isValidObjectId(value: any): boolean {
  if (!value) return false;
  return Types.ObjectId.isValid(value.toString());
}

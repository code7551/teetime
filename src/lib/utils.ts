import { AppUser } from "@/types";
import { differenceInYears } from "date-fns";

/**
 * Calculate age from a birthdate string (YYYY-MM-DD).
 * Returns null if the birthdate is invalid or not provided.
 */
export function calculateAge(
  birthdate: string | undefined | null,
): number | null {
  if (!birthdate) return null;
  const date = new Date(birthdate);
  if (isNaN(date.getTime())) return null;
  return differenceInYears(new Date(), date);
}

/**
 * Find a user by their UID from an array of user data
 * @param userDatas - Array of user data
 * @param uid - User ID
 * @returns User data
 */
export const findUserByUid = ({
  userDatas,
  uid,
}: {
  userDatas: AppUser[];
  uid: string;
}) => {
  return userDatas.find((user) => user.uid === uid);
};

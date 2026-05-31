import { hash } from "bcryptjs";

export type RegistrationInput = {
  email: string;
  playerName: string;
  displayName: string;
  password: string;
};

export async function buildRegistrationCreateData(
  input: RegistrationInput,
  hashPassword: (password: string) => Promise<string> = (password) =>
    hash(password, 12),
) {
  return {
    email: input.email,
    emailVerifiedAt: null,
    playerName: input.playerName,
    displayName: input.displayName,
    passwordHash: await hashPassword(input.password),
  };
}

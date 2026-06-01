import { hashPassword as defaultHashPassword } from "./password-hashing";

export type RegistrationInput = {
  email: string;
  playerName: string;
  displayName: string;
  password: string;
};

export async function buildRegistrationCreateData(
  input: RegistrationInput,
  hashPassword: (password: string) => Promise<string> = defaultHashPassword,
) {
  return {
    email: input.email,
    emailVerifiedAt: null,
    playerName: input.playerName,
    displayName: input.displayName,
    passwordHash: await hashPassword(input.password),
  };
}

export type VerifiableAccount = {
  emailVerifiedAt: Date | string | null;
};

export function isVerifiedAccount(user: VerifiableAccount) {
  return Boolean(user.emailVerifiedAt);
}

export function isValidPhoneNumber(value: string) {
  return /^[0-9+()\-\s]+$/.test(value);
}

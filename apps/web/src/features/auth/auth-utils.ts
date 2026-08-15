export type AuthRole = "renter" | "owner";

export interface LoginValues {
  email: string;
  password: string;
}

export interface RegisterValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: AuthRole;
  acceptTerms: boolean;
}

export type AuthErrorCode =
  | "required"
  | "email"
  | "passwordLength"
  | "passwordMatch"
  | "phone"
  | "terms";

export type LoginErrors = Partial<Record<keyof LoginValues, AuthErrorCode>>;
export type RegisterErrors = Partial<
  Record<keyof RegisterValues, AuthErrorCode>
>;

export const MIN_PASSWORD_LENGTH = 8;

// Deliberately permissive: the API is the authority on what a valid address is,
// so this only catches obvious typos before a request would be made.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Indonesian mobile numbers, written as 08xx, +628xx, or 628xx.
const phonePattern = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/;

export const emptyLoginValues: LoginValues = {
  email: "",
  password: "",
};

export const emptyRegisterValues: RegisterValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "renter",
  acceptTerms: false,
};

export function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, "");
}

export function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {};

  if (!values.email.trim()) errors.email = "required";
  else if (!emailPattern.test(values.email.trim())) errors.email = "email";

  if (!values.password) errors.password = "required";

  return errors;
}

export function validateRegister(values: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {};

  if (!values.name.trim()) errors.name = "required";

  if (!values.email.trim()) errors.email = "required";
  else if (!emailPattern.test(values.email.trim())) errors.email = "email";

  const phone = normalizePhone(values.phone);
  if (!phone) errors.phone = "required";
  else if (!phonePattern.test(phone)) errors.phone = "phone";

  if (!values.password) errors.password = "required";
  else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = "passwordLength";
  }

  if (!values.confirmPassword) errors.confirmPassword = "required";
  else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "passwordMatch";
  }

  if (!values.acceptTerms) errors.acceptTerms = "terms";

  return errors;
}

export function hasErrors(errors: Record<string, unknown>): boolean {
  return Object.keys(errors).length > 0;
}

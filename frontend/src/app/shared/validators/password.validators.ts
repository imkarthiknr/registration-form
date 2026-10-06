import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Requires at least one letter and one digit (mirrors the API rule). */
export const lettersAndNumbers: ValidatorFn = (control: AbstractControl) => {
  const value = String(control.value ?? '');
  if (!value) return null;
  return /[A-Za-z]/.test(value) && /\d/.test(value) ? null : { lettersAndNumbers: true };
};

/** Group-level validator: `password` and `confirmPassword` must match. */
export const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
};

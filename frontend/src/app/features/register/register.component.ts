import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { describeHttpError } from '../../core/http-error';
import { ApiError, RegistrationRequest, User } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';
import { lettersAndNumbers, passwordsMatch } from '../../shared/validators/password.validators';

export const PASSWORD_MIN_LENGTH = 8;

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly users = inject(UserService);

  protected readonly minLength = PASSWORD_MIN_LENGTH;
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly registered = signal<User | null>(null);

  protected readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH), lettersAndNumbers],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  /** True when a control should show its error (touched or form submitted). */
  protected showError(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.getRawValue();
    const request: RegistrationRequest = { name: name.trim(), email: email.trim(), password };

    this.submitting.set(true);
    this.error.set(null);
    this.users.register(request).subscribe({
      next: (user) => {
        this.submitting.set(false);
        this.registered.set(user);
        this.form.reset();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.applyServerErrors(err);
        this.error.set(describeHttpError(err));
      },
    });
  }

  protected registerAnother(): void {
    this.registered.set(null);
  }

  /** Copy per-field messages from a 400/409 response onto the form controls. */
  private applyServerErrors(err: unknown): void {
    if (!(err instanceof HttpErrorResponse)) return;
    const fields = (err.error as Partial<ApiError> | null)?.fields ?? {};
    for (const [field, message] of Object.entries(fields)) {
      const control = this.form.get(field);
      control?.setErrors({ ...control.errors, server: message });
      control?.markAsTouched();
    }
  }
}

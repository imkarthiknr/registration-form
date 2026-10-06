import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { describeHttpError } from '../../core/http-error';
import { User } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';

/**
 * Look up a registered user by ID.
 *
 * The ID lives in the URL (`/lookup?id=3`) so results are shareable and the
 * browser back button works; submitting the form just updates the query param.
 */
@Component({
  selector: 'app-lookup',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './lookup.component.html',
  styleUrl: './lookup.component.css',
})
export class LookupComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly users = inject(UserService);

  protected readonly idControl = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(1),
    Validators.pattern(/^\d+$/),
  ]);
  protected readonly loading = signal(false);
  protected readonly user = signal<User | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        tap((raw) => {
          this.user.set(null);
          this.error.set(null);
          if (raw !== null) this.idControl.setValue(Number(raw));
        }),
        switchMap((raw) => {
          const id = Number(raw);
          if (raw === null) return EMPTY;
          if (!Number.isInteger(id) || id < 1) {
            this.error.set('User ID must be a positive whole number.');
            return EMPTY;
          }
          this.loading.set(true);
          return this.users.getById(id).pipe(
            catchError((err: unknown) => {
              this.loading.set(false);
              this.error.set(describeHttpError(err));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((user) => {
        this.loading.set(false);
        this.user.set(user);
      });
  }

  protected search(): void {
    if (this.idControl.invalid) {
      this.idControl.markAsTouched();
      return;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: this.idControl.value },
    });
  }
}

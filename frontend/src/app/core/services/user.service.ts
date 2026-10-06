import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RegistrationRequest, User } from '../models/user.model';

/**
 * Thin wrapper around the users REST API.
 * Requests go to the relative `/api` path; in development the Angular dev
 * server proxies that to the backend (see `proxy.conf.json`).
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  register(request: RegistrationRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, request);
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }
}

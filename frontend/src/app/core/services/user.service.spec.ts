import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POSTs the registration payload to /api/users', () => {
    const payload = { name: 'Ada', email: 'ada@example.com', password: 'analytical1' };
    service.register(payload).subscribe();
    const req = http.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1, name: 'Ada', email: 'ada@example.com', createdAt: '' });
  });

  it('GETs a user by ID', () => {
    let name = '';
    service.getById(7).subscribe((u) => (name = u.name));
    const req = http.expectOne('/api/users/7');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 7, name: 'Alan', email: 'alan@example.com', createdAt: '' });
    expect(name).toBe('Alan');
  });
});

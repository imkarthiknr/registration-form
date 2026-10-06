import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const fill = (values: Record<string, string>) => {
    for (const [id, value] of Object.entries(values)) {
      const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
    }
  };
  const submit = async () => {
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };
  const validValues = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'analytical1',
    confirmPassword: 'analytical1',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterComponent);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('does not call the API and shows errors when the form is empty', async () => {
    await submit();
    http.expectNone('/api/users');
    expect(el.querySelectorAll('.field-error').length).toBeGreaterThan(0);
  });

  it('flags mismatched passwords', async () => {
    fill({ ...validValues, confirmPassword: 'different1' });
    await fixture.whenStable();
    expect(el.textContent).toContain('Passwords do not match.');
  });

  it('submits a valid form without sending confirmPassword and shows the new ID', async () => {
    fill(validValues);
    await submit();
    const req = http.expectOne('/api/users');
    expect(req.request.body).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'analytical1',
    });
    req.flush({ id: 3, name: 'Ada Lovelace', email: 'ada@example.com', createdAt: '' });
    await fixture.whenStable();
    expect(el.textContent).toContain('Your user ID is 3');
  });

  it('shows the server message for a duplicate email', async () => {
    fill(validValues);
    await submit();
    http.expectOne('/api/users').flush(
      {
        error: 'An account with this email already exists.',
        fields: { email: 'This email is already registered.' },
      },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();
    expect(el.textContent).toContain('This email is already registered.');
    expect(el.querySelector('.form-error')?.textContent).toContain('already exists');
  });
});

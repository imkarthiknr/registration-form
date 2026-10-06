import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LookupComponent } from './lookup.component';

describe('LookupComponent', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'lookup', component: LookupComponent }]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  it('loads the user named in the ?id query param', async () => {
    await harness.navigateByUrl('/lookup?id=2', LookupComponent);
    http
      .expectOne('/api/users/2')
      .flush({ id: 2, name: 'Alan Turing', email: 'alan@example.com', createdAt: '2026-01-01' });
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).toContain('Alan Turing');
  });

  it('shows the API error message for an unknown ID', async () => {
    await harness.navigateByUrl('/lookup?id=99', LookupComponent);
    http
      .expectOne('/api/users/99')
      .flush({ error: 'No user found with ID 99.' }, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).toContain('No user found with ID 99.');
  });

  it('rejects a non-numeric ID without calling the API', async () => {
    await harness.navigateByUrl('/lookup?id=abc', LookupComponent);
    http.expectNone(() => true);
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).toContain('positive whole number');
  });

  it('puts the searched ID into the URL', async () => {
    await harness.navigateByUrl('/lookup', LookupComponent);
    const el = harness.routeNativeElement!;
    const input = el.querySelector<HTMLInputElement>('#userId')!;
    input.value = '5';
    input.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/lookup?id=5');
    http.expectOne('/api/users/5').flush({ id: 5, name: 'X', email: 'x@y.io', createdAt: '' });
  });
});

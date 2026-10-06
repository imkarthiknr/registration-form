import { FormControl, FormGroup } from '@angular/forms';
import { lettersAndNumbers, passwordsMatch } from './password.validators';

describe('password validators', () => {
  it('lettersAndNumbers accepts mixed input and rejects letters-only', () => {
    expect(lettersAndNumbers(new FormControl('abc12345'))).toBeNull();
    expect(lettersAndNumbers(new FormControl('abcdefgh'))).toEqual({ lettersAndNumbers: true });
    expect(lettersAndNumbers(new FormControl(''))).toBeNull();
  });

  it('passwordsMatch flags a mismatch only when both fields are filled', () => {
    const group = (a: string, b: string) =>
      new FormGroup({ password: new FormControl(a), confirmPassword: new FormControl(b) });
    expect(passwordsMatch(group('abc12345', 'abc12345'))).toBeNull();
    expect(passwordsMatch(group('abc12345', 'xyz12345'))).toEqual({ passwordsMismatch: true });
    expect(passwordsMatch(group('abc12345', ''))).toBeNull();
  });
});

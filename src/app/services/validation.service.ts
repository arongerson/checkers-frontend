import { Injectable } from '@angular/core';
import { AbstractControl, Validators} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor(
  ) {}

  getNameValidators() {
    return [
      Validators.minLength(2),
      Validators.maxLength(10)
    ];
  }

  getCodeValidators() {
    return [
      Validators.minLength(1),
      Validators.maxLength(10)
    ];
  }

  getChatValidators() {
    return [
      Validators.minLength(1),
      Validators.maxLength(255)
    ];
  }

  getErrorMessage(control: AbstractControl) {
    return control.hasError('required') ? 'You must enter a value' :
      control.hasError('minlength') ? 'Length must be at least ' + control.errors.minlength.requiredLength :
      control.hasError('maxlength') ? 'Maximum length is ' + control.errors.maxlength.requiredLength :
      control.hasError('min') ? 'Min is ' + control.errors.min.min :
      control.hasError('max') ? 'Max is ' + control.errors.max.max :
      control.hasError('email') ? 'Not a valid email': '';
  }
}
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

export class ErrorHandler {

  handleError(errorResponse: HttpErrorResponse) {
    if(errorResponse.status === 400) {
      return throwError(errorResponse.error.errors);
    }

    if(errorResponse.status === 500) {
      return throwError(errorResponse.error.message);
    }

    return throwError(errorResponse.message);
  }
}

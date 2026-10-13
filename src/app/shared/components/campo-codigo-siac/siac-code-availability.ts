import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

/** Context sent to the adapter that checks a SIAC code against the backend. */
export interface SiacCodeAvailabilityRequest {
  /** Entity name understood by the SIAC endpoint (for example, "materia"). */
  entity: string;
  code: string;
  /** Current record ID, excluded when checking uniqueness during an edit. */
  currentId?: string | number;
}

/** Backend adapter contract. `true` means the code is available for this entity. */
export interface SiacCodeAvailabilityChecker {
  checkAvailability(request: SiacCodeAvailabilityRequest): Observable<boolean>;
}

/**
 * Provide an implementation when the SIAC endpoint contract is agreed.
 * Keeping HTTP details behind this token lets this shared control work with
 * mocks now and different API response shapes later.
 */
export const SIAC_CODE_AVAILABILITY_CHECKER = new InjectionToken<SiacCodeAvailabilityChecker>(
  'SIAC_CODE_AVAILABILITY_CHECKER',
);

import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SiacService } from './siac.service';

describe('SiacService', () => {
  let service: SiacService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SiacService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should report an existing SIAC code as unavailable', async () => {
    const disponible = await firstValueFrom(
      service.checkAvailability({
        entity: 'materia',
        code: 'MAT-101',
      }),
    );

    expect(disponible).toBe(false);
  });

  it('should report a new SIAC code as available', async () => {
    const disponible = await firstValueFrom(
      service.checkAvailability({
        entity: 'materia',
        code: 'MAT-999',
      }),
    );

    expect(disponible).toBe(true);
  });

  it('should exclude the current record when editing', async () => {
    const disponible = await firstValueFrom(
      service.checkAvailability({
        entity: 'materia',
        code: 'MAT-101',
        currentId: 1,
      }),
    );

    expect(disponible).toBe(true);
  });
});
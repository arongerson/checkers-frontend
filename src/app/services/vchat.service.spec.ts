import { TestBed } from '@angular/core/testing';

import { VchatService } from './vchat.service';

describe('VchatService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VchatService = TestBed.get(VchatService);
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { DragEventService } from './drag-event.service';

describe('DragEventService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DragEventService = TestBed.get(DragEventService);
    expect(service).toBeTruthy();
  });
});

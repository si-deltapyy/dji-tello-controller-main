import { TestBed } from '@angular/core/testing';

import { TelloService } from './tello.service';

describe('TelloService', () => {
  let service: TelloService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TelloService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

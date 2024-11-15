import { TestBed } from '@angular/core/testing';

import { TelloVideoService } from './tello-video.service';

describe('TelloVideoService', () => {
  let service: TelloVideoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TelloVideoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TelloService {
  private apiUrl = 'http://localhost:5000/run-python';  // URL API Python

  constructor(private http: HttpClient) {}

  runPythonScript(): Observable<any> {
    return this.http.post<any>(this.apiUrl, {});  // Kirim POST request ke API
  }
}

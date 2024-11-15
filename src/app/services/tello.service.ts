import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TelloServic {

  private apiUrl = 'http://localhost:3000/run-python';  // URL API backend Node.js

  constructor(private http: HttpClient) {}

  // Fungsi untuk memanggil API yang menjalankan skrip Python
  runPythonScript(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}

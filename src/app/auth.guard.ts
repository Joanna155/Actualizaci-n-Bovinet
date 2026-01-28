import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences'; // Para leer el token guardado

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    // 1. Buscamos si existe el token en el almacenamiento del celular
    const { value } = await Preferences.get({ key: 'userToken' });

    if (value) {
      // Si existe el token, lo dejamos pasar
      return true;
    } else {
      // Si NO existe, lo mandamos al login para que se identifique
      this.router.navigate(['/login']);
      return false;
    }
  }
}
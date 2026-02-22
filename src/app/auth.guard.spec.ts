import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Le preguntamos al servicio si hay una sesión fija en el teléfono
  const isLoggedIn = await authService.getAuthState();

  if (isLoggedIn) {
    return true; // ✅ El usuario está logueado, lo deja pasar
  } else {
    // ❌ No hay sesión, lo mandamos al login
    console.warn('Acceso no autorizado - Redirigiendo a Login');
    router.navigate(['/login']);
    return false;
  }
};
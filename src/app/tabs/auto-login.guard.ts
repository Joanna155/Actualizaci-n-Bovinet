import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { Preferences } from "@capacitor/preferences";

//EVITA A NO DAR EL PARPADEO DEL LOGIN A LA TAB 1 
@Injectable({ providedIn: 'root' })
export class AutoLoginGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'userToken' });

    if (value) {
      // SI HAY TOKEN: Lo mandamos al Home directamente
      this.router.navigate(['/home'], { replaceUrl: true });
      return false; 
    } else {
      // NO HAY TOKEN: Lo dejamos entrar al Login
      return true;
    }
  }
}
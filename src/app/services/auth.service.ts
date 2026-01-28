import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { DatabaseService } from "./database.service"
import { Preferences } from '@capacitor/preferences';
import { NavController } from '@ionic/angular';

@Injectable({
  providedIn: "root",
})
export class AuthService {
  getCurrentUser(): string {
    throw new Error('Method not implemented.');
  }
  private isLoggedInSubject = new BehaviorSubject<boolean>(false)
  public isLoggedIn$ = this.isLoggedInSubject.asObservable()

  constructor(
    private databaseService: DatabaseService,
    private navCtrl: NavController // Agregado para redirección
  ) {
    this.checkInitialSession();
  }

  // Nueva función para verificar sesión de forma asíncrona (Capacitor)
  private async checkInitialSession() {
    const { value } = await Preferences.get({ key: 'isLoggedIn' });
    const isLoggedIn = value === "true";
    
    this.isLoggedInSubject.next(isLoggedIn);

    if (isLoggedIn) {
      console.log("🔄 Sesión persistente detectada en Android, inicializando IndexedDB...");
      await this.initializeDatabaseAsync();
    }
  }

  private async initializeDatabaseAsync() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const dbInitialized = await this.databaseService.initializeDatabase();
      if (dbInitialized) console.log("✅ IndexedDB lista para uso Offline");
    } catch (error) {
      console.error("❌ Error en DB inicial:", error);
    }
  }

  public async login(username: string): Promise<boolean> {
    try {
      // Guardar sesión fija en el hardware del teléfono
      await Preferences.set({ key: 'isLoggedIn', value: 'true' });
      await Preferences.set({ key: 'username', value: username });
      await Preferences.set({ key: 'loginTime', value: new Date().toISOString() });

      console.log("⏳ Preparando entorno Offline...");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const dbInitialized = await this.databaseService.initializeDatabase();

      if (dbInitialized) {
        this.isLoggedInSubject.next(true);
        console.log("✅ Login exitoso: Bovinet listo.");
        return true;
      }
      this.isLoggedInSubject.next(true);
      return true;
    } catch (error) {
      console.error("❌ Error en login:", error);
      return false;
    }
  }

  public async logout(): Promise<void> {
    console.log("🚪 Cerrando sesión y limpiando token...");
    
    // Borrar llaves físicas
    await Preferences.remove({ key: 'isLoggedIn' });
    await Preferences.remove({ key: 'username' });
    await Preferences.remove({ key: 'loginTime' });

    await this.databaseService.closeDatabase();
    this.isLoggedInSubject.next(false);
    
    // Mandar al login al cerrar sesión
    this.navCtrl.navigateRoot('/login');
  }

  // Versión asíncrona necesaria para Capacitor
  public async getAuthState(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'isLoggedIn' });
    return value === "true";
  }

  public async getUsername(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'username' });
    return value;
  }
}
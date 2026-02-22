import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { DatabaseService } from "./database.service"
<<<<<<< HEAD
=======
import { Preferences } from '@capacitor/preferences';
import { NavController } from '@ionic/angular';
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f

@Injectable({
  providedIn: "root",
})
export class AuthService {
<<<<<<< HEAD
  private isLoggedInSubject = new BehaviorSubject<boolean>(false)
  public isLoggedIn$ = this.isLoggedInSubject.asObservable()

  constructor(private databaseService: DatabaseService) {
    // Verificar si ya hay una sesión activa al inicializar
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    this.isLoggedInSubject.next(isLoggedIn)

    // Si ya está logueado, inicializar la base de datos
    if (isLoggedIn) {
      console.log("🔄 Sesión activa detectada, inicializando IndexedDB...")
      this.initializeDatabaseAsync()
=======
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
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f
    }
  }

  private async initializeDatabaseAsync() {
    try {
<<<<<<< HEAD
      // Esperar un poco para que IndexedDB esté completamente listo
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("🔄 Inicializando IndexedDB para sesión existente...")
      const dbInitialized = await this.databaseService.initializeDatabase()

      if (dbInitialized) {
        console.log("✅ IndexedDB inicializada para sesión existente")
      } else {
        console.warn("⚠️ Fallo inicializando IndexedDB para sesión existente")
      }
    } catch (error) {
      console.error("❌ Error inicializando IndexedDB para sesión existente:", error)
=======
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const dbInitialized = await this.databaseService.initializeDatabase();
      if (dbInitialized) console.log("✅ IndexedDB lista para uso Offline");
    } catch (error) {
      console.error("❌ Error en DB inicial:", error);
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f
    }
  }

  public async login(username: string): Promise<boolean> {
    try {
<<<<<<< HEAD
      console.log(`🔐 Iniciando sesión para: ${username}`)

      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("username", username)
      localStorage.setItem("loginTime", new Date().toISOString())

      // Esperar un poco para que IndexedDB esté completamente listo
      console.log("⏳ Esperando que IndexedDB esté completamente listo...")
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Inicializar base de datos al hacer login
      console.log("🔄 Inicializando IndexedDB después del login...")
      const dbInitialized = await this.databaseService.initializeDatabase()

      if (dbInitialized) {
        this.isLoggedInSubject.next(true)
        console.log("✅ Login exitoso e IndexedDB inicializada")

        // Mostrar estadísticas
        const stats = await this.databaseService.getStats()
        console.log(`📊 Estadísticas: ${stats.animals} animales, ${stats.eventos} eventos`)

        return true
      } else {
        // Si falla la inicialización de la DB, continuar sin base de datos
        console.warn("⚠️ Fallo en inicialización de IndexedDB, continuando sin base de datos")
        this.isLoggedInSubject.next(true)
        return true
      }
    } catch (error) {
      console.error("❌ Error en login:", error)
      return false
=======
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
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f
    }
  }

  public async logout(): Promise<void> {
<<<<<<< HEAD
    console.log("🚪 Cerrando sesión...")

    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("username")
    localStorage.removeItem("loginTime")

    // Cerrar base de datos al hacer logout
    await this.databaseService.closeDatabase()

    this.isLoggedInSubject.next(false)
    console.log("✅ Sesión cerrada correctamente")
  }

  public isLoggedIn(): boolean {
    return localStorage.getItem("isLoggedIn") === "true"
  }

  public getUsername(): string | null {
    return localStorage.getItem("username")
  }

  public getCurrentUser(): string | null {
    return this.getUsername()
  }

  public getLoginTime(): Date | null {
    const loginTime = localStorage.getItem("loginTime")
    return loginTime ? new Date(loginTime) : null
  }

  public isSessionValid(): boolean {
    const loginTime = this.getLoginTime()
    if (!loginTime) return false

    // Sesión válida por 24 horas
    const now = new Date()
    const diffHours = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
    return diffHours < 24
  }

  public isDatabaseReady(): boolean {
    return this.databaseService.isReady()
  }
}
=======
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
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f

import { Component, OnInit } from "@angular/core";
import { DatabaseService } from "./services/database.service";
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common'; 
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen'; // Importar Plugin

@Component({
  selector: "app-root",
  standalone: true,
  templateUrl: "app.component.html",
  styleUrls: ["app.component.scss"],
  imports: [IonicModule, CommonModule],
})
export class AppComponent implements OnInit {
  constructor(
    private databaseService: DatabaseService,
    private navCtrl: NavController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    // Iniciamos la lógica pero mantenemos la Splash Screen visible
    await this.initializeApp();
    
    // El monitoreo de red puede correr en segundo plano
  //   this.setupNetworkMonitoring();
  }

  async initializeApp() {
    try {
      // 1. Buscamos el token
      const { value } = await Preferences.get({ key: 'userToken' });
      
      if (value) {
        console.log("🔐 Sesión detectada localmente");
        // 2. Cargamos la base de datos antes de entrar
        await this.databaseService.initializeDatabase();
        
        // 3. Navegamos a la parte principal (sin animación para que sea instantáneo)
        await this.navCtrl.navigateRoot('/tabs/tab1', { animated: false });
      } else {
        // Si no hay token, aseguramos que vaya al login
        await this.navCtrl.navigateRoot('/login', { animated: false });
      }
    } catch (error) {
      console.error("Error inicializando:", error);
      this.navCtrl.navigateRoot('/login');
    } finally {
      // 4. EL PASO CLAVE: Ocultamos el logo solo cuando la ruta ya cambió
      // Usamos un pequeño delay para que Angular termine de pintar el HTML
      setTimeout(async () => {
        await SplashScreen.hide();
      }, 400); 
    }
  }

 //  async setupNetworkMonitoring() {
   //  Network.addListener('networkStatusChange', async (status) => {
      // const message = status.connected 
     //   ? '📶 Conexión restaurada. Sincronizando Bovinet...' 
       // : '⚠️ Modo Offline: Los datos se guardarán en el celular.';
      
      // const toast = await this.toastController.create({ 
        //message: message,
        // duration: 3000,
        // color: status.connected ? 'primary' : 'danger',
        // position: 'bottom'
      // });
      // toast.present();
    // });
  }
// }
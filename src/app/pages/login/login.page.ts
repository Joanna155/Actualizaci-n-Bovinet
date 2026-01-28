import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { Preferences } from '@capacitor/preferences'; // Para guardar el token
import { NavController } from '@ionic/angular'; // Recomendado para navegación limpia
import { Router } from "@angular/router"
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonCheckbox,
  AlertController,
   ToastController,
} from "@ionic/angular/standalone"
import { addIcons } from "ionicons"
import { personOutline, lockClosedOutline, logInOutline, eyeOutline, eyeOffOutline, keyOutline } from "ionicons/icons"
import { AuthService } from "../../services/auth.service"

@Component({
  selector: "app-login",
  templateUrl: "./login.page.html",
  styleUrls: ["./login.page.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonIcon, IonCheckbox],
})
export class LoginPage {
  username = ""
  password = ""
  rememberMe = false
  showPassword = false
  hasSavedCredentials = true // Simular credenciales guardadas
  savedUsername = "ganadero"

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
  ) {
    addIcons({personOutline,lockClosedOutline,logInOutline,eyeOutline,eyeOffOutline,keyOutline,});
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword
  }

  onInputChange() {
    // Lógica adicional cuando cambian los inputs si es necesario
  }

  useSavedCredentials() {
    this.username = this.savedUsername
    this.password = "123456"
  }

  async forgotPassword(event: Event) {
    event.preventDefault()
    const alert = await this.alertController.create({
      header: "Recuperar Contraseña",
      message: "Contacta al administrador del sistema para recuperar tu contraseña.",
      buttons: ["OK"],
    })
    await alert.present()
  }

  async register(event: Event) {
    event.preventDefault()
    const alert = await this.alertController.create({
      header: "Registro",
      message: "Contacta al administrador del sistema para crear una nueva cuenta.",
      buttons: ["OK"],
    })
    await alert.present()
  }

  async login() {
    if (!this.username.trim() || !this.password.trim()) {
      const toast = await this.toastController.create({
        message: "Por favor, completa todos los campos",
        duration: 3000,
        color: "warning",
        position: "top",
      })
      await toast.present()
      return;
    }
//Validación de credenciales
    if (this.username.toLowerCase() === "ganadero" && this.password === "123456") {
       
      // 1. ✅ GUARDAR EL TOKEN PARA USO DE UNA SOLA VEZ
      // Esto hace que el AuthGuard te deje pasar en el futuro
      const userData = {
    username: this.username,
    role: 'administrador',
    lastLogin: new Date().toISOString()
  };

  // Guardamos el token y el perfil
  await Preferences.set({ key: 'userToken', value: 'token_fijo' });
  await Preferences.set({ key: 'userData', value: JSON.stringify(userData) });

  this.router.navigate(["/tabs/tab1"], { replaceUrl: true });
}
    
  } 
  else: any  }
    // ... (tu código de error de credenciales)

import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
<<<<<<< HEAD
=======
import { Preferences } from '@capacitor/preferences'; // Para guardar el token
import { NavController } from '@ionic/angular'; // Recomendado para navegación limpia
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f
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
<<<<<<< HEAD
    addIcons({
      personOutline,
      lockClosedOutline,
      logInOutline,
      eyeOutline,
      eyeOffOutline,
      keyOutline,
    })
=======
    addIcons({personOutline,lockClosedOutline,logInOutline,eyeOutline,eyeOffOutline,keyOutline,});
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f
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
<<<<<<< HEAD
      return
    }

    if (this.username.toLowerCase() === "ganadero" && this.password === "123456") {
      this.authService.login(this.username)
      const toast = await this.toastController.create({
        message: "¡Bienvenido!",
        duration: 3000,
        color: "success",
        position: "top",
      })
      await toast.present()
      // ✅ Cambiar la navegación para ir directamente a tab1
      this.router.navigate(["/tabs/tab1"], { replaceUrl: true })
    } else {
      const toast = await this.toastController.create({
        message: "Credenciales incorrectas",
        duration: 3000,
        color: "danger",
        position: "top",
      })
      await toast.present()
    }
  }
}

export default LoginPage
=======
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
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f

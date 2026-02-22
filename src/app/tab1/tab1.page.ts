import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DatabaseService, Animal } from '../services/database.service';
import { AlertController, ToastController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataShareService } from '../services/data-share.service';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonicModule, CommonModule
  ]
})
export class Tab1Page implements OnInit, OnDestroy {
  // Cambia los valores iniciales a 0
  totalAnimales = 0;
  totalHembras = 0;
  totalMachos = 0;
  reproductores = 0;
  cargandoDatos = true;
  modoMock = false;

  // Próximos eventos (ahora vendrán de la base de datos)
  proximosEventos: any[] = [];

  // Nuevas propiedades para notificaciones
  notificacionesHoy: any[] = [];
  mostrarNotificaciones = true;
  modalNotificacionesOpen = false;
  notificacionesVistas: Set<string> = new Set();

  // Suscripción para actualizaciones de datos
  private dataUpdateSubscription!: Subscription;

  constructor(
    private databaseService: DatabaseService,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router,
    private dataShareService: DataShareService,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    // Cargar estado de notificaciones primero
    this.cargarEstadoNotificaciones();
    
    await this.loadDashboardData();
    
    // Suscribirse a las actualizaciones de datos
    this.dataUpdateSubscription = this.dataShareService.dataUpdated$.subscribe(() => {
      console.log('🔄 Actualizando datos desde Tab2...');
      this.loadDashboardData();
    });
  }

  ngOnDestroy() {
    // Limpiar la suscripción cuando el componente se destruye
    if (this.dataUpdateSubscription) {
      this.dataUpdateSubscription.unsubscribe();
    }
  }

  // MÉTODO LOGOUT (debe ser público)
  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar sesión',
          handler: () => {
            // Aquí va tu lógica de logout
            // Por ejemplo, limpiar storage y redirigir al login
            localStorage.clear();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  async loadDashboardData() {
    this.cargandoDatos = true;
    
    try {
      // 1. Inicializar base de datos
      const dbReady = await this.databaseService.initializeDatabase();
      
      if (!dbReady) {
        throw new Error('La base de datos no se pudo inicializar');
      }

      // 2. Obtener datos reales
      const animals = await this.databaseService.getAllAnimals();
      
      // 3. Obtener eventos desde MÚLTIPLES FUENTES:
      //    - De la base de datos (para eventos de Tab2)
      //    - De localStorage (para eventos de Tab3)
      const eventosDB = await this.databaseService.getAllEventos();
      
      // Obtener eventos de Tab3 desde localStorage
      const eventosTab3Guardados = localStorage.getItem('eventosTab3');
      const eventosTab3 = eventosTab3Guardados ? JSON.parse(eventosTab3Guardados) : [];
      
      // Combinar eventos de ambas fuentes
      const todosLosEventos = [...eventosDB, ...eventosTab3];
      
      // 4. Calcular estadísticas
      this.totalAnimales = animals.length;
      this.totalHembras = animals.filter(a => a.sexo === 'Hembra').length;
      this.totalMachos = animals.filter(a => a.sexo === 'Macho').length;
      this.reproductores = animals.filter(animal => {
  // Verificar que tenga fecha de nacimiento
  if (!animal.fechaNacimiento) return false;
  
  // Calcular edad en años
  const edad = this.calculateAgeInYears(animal.fechaNacimiento);
  
  // Verificar edad reproductiva (2 años o más para ambos sexos)
  if (edad < 2) return false;
  
  // Verificar que esté activo para reproducción
  if (animal.activoReproduccion === false) return false;
  
  // Para machos: deben ser sementales (no becerros)
  if (animal.sexo === 'Macho') {
    return animal.estadoReproductivo === 'Semental';
  }
  
  // Para hembras: no deben estar secas o en estado no reproductivo
  if (animal.sexo === 'Hembra') {
    const estadosNoReproductivos = ['Seca', 'Vacia', 'Becerro'];
    return !estadosNoReproductivos.includes(animal.estadoReproductivo || '');
  }
  
  return false;
}).length;

      // 5. Procesar próximos eventos (de ambas fuentes)
      this.proximosEventos = this.processEventos(todosLosEventos);
      
      // 6. Cargar notificaciones para hoy
      await this.cargarNotificacionesHoy(todosLosEventos);
      
      await this.showToast('Datos actualizados', 'success');
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.modoMock = true;
      await this.showToast('Error cargando datos. Usando modo simulación.', 'danger');
      
      // Valores por defecto para modo mock (incluyendo eventos de Tab3)
      this.setDefaultStatsWithTab3Events();
    } finally {
      this.cargandoDatos = false;
    }
  }

  // Método para calcular edad en años (más preciso)
private calculateAgeInYears(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0;
  
  try {
    const birth = new Date(fechaNacimiento);
    const today = new Date();
    
    if (isNaN(birth.getTime())) return 0;
    
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const ageYears = diffDays / 365.25;
    
    return Math.floor(ageYears * 100) / 100; // Redondear a 2 decimales
  } catch (error) {
    console.error('Error calculando edad en años:', error);
    return 0;
  }
}

  // Método para cargar notificaciones del día
  private async cargarNotificacionesHoy(eventos: any[]) {
    const hoy = new Date().toISOString().split('T')[0];
    
    // Filtrar eventos de hoy que no estén realizados
    this.notificacionesHoy = eventos.filter(evento => 
      evento.fecha === hoy && 
      evento.estado !== 'Realizado' &&
      !this.notificacionesVistas.has(evento.id)
    );

    // Mostrar notificaciones solo si hay eventos pendientes para hoy
    this.mostrarNotificaciones = this.notificacionesHoy.length > 0;
    
    // Guardar en localStorage para persistencia
    this.guardarEstadoNotificaciones();
  }

  // Método auxiliar para modo mock que incluye eventos de Tab3
  private setDefaultStatsWithTab3Events() {
    this.totalAnimales = 24;
    this.totalHembras = 18;
    this.totalMachos = 6;
    this.reproductores = 8;

    // Obtener eventos de Tab3 incluso en modo mock
    const eventosTab3Guardados = localStorage.getItem('eventosTab3');
    const eventosTab3 = eventosTab3Guardados ? JSON.parse(eventosTab3Guardados) : [];

    // Eventos de ejemplo para modo mock + eventos reales de Tab3
    const eventosMock = [
      {
        id: '1',
        animalNombre: 'Vaca 01',
        animalId: 'B001',
        tipo: 'Celo',
        notas: 'En periodo de celo',
        fecha: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estado: 'Pendiente'
      },
      {
        id: '2',
        animalNombre: 'Vaca 05',
        animalId: 'B005',
        tipo: 'Vacunación',
        notas: 'Vacuna anual',
        fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estado: 'Programado'
      }
    ];

    // Combinar eventos mock con eventos reales de Tab3
    const todosLosEventos = [...eventosMock, ...eventosTab3];
    
    this.proximosEventos = this.processEventos(todosLosEventos);
    
    // También cargar notificaciones en modo mock
    this.cargarNotificacionesHoy(todosLosEventos);
  }

  // Método processEventos actualizado para manejar múltiples fuentes
  private processEventos(eventos: any[]): any[] {
    const hoy = new Date().toISOString().split('T')[0];
    
    return eventos
      .filter(e => e.estado !== 'Realizado')
      .sort((a, b) => {
        // Priorizar eventos de hoy primero
        if (a.fecha === hoy && b.fecha !== hoy) return -1;
        if (a.fecha !== hoy && b.fecha === hoy) return 1;
        
        // Luego ordenar por fecha
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      })
      .slice(0, 6)
      .map(evento => ({
        ...evento,
        fechaCorta: this.formatShortDate(evento.fecha),
        icono: this.getEventIcon(evento.tipo),
        color: this.getEventColor(evento.tipo)
      }));
  }

  // Método calculateAge (asegúrate de que esté disponible)
  private calculateAge(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const birth = new Date(fechaNacimiento);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25)); // Edad en años considerando años bisiestos
  }

  // Métodos para manejar notificaciones
  verNotificaciones() {
    this.modalNotificacionesOpen = true;
  }

  cerrarModalNotificaciones() {
    this.modalNotificacionesOpen = false;
  }

  ocultarNotificaciones() {
    // Marcar todas las notificaciones actuales como vistas
    this.notificacionesHoy.forEach(evento => {
      this.notificacionesVistas.add(evento.id);
    });
    
    this.mostrarNotificaciones = false;
    this.guardarEstadoNotificaciones();
  }

  irATab3(evento: any) {
  console.log('Navegando a Tab3 para gestionar evento:', evento);
  this.cerrarModalNotificaciones();
  
  // Guardar el evento seleccionado para pasarlo a Tab3
  localStorage.setItem('eventoParaGestionar', JSON.stringify(evento));
  
  // Navegar a Tab3
  this.navCtrl.navigateForward('/tabs/tab3');
  
  // Opcional: También puedes usar el router
  // this.router.navigate(['/tabs/tab3']);
}

  // Guardar estado de notificaciones en localStorage
  private guardarEstadoNotificaciones() {
    localStorage.setItem('notificacionesVistas', JSON.stringify(Array.from(this.notificacionesVistas)));
  }

  // Cargar estado de notificaciones desde localStorage
  private cargarEstadoNotificaciones() {
    const vistasGuardadas = localStorage.getItem('notificacionesVistas');
    if (vistasGuardadas) {
      this.notificacionesVistas = new Set(JSON.parse(vistasGuardadas));
    }
  }

  // Método para formatear fecha completa
  formatFullDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ESTOS MÉTODOS DEBEN SER PÚBLICOS PORQUE SE USAN EN EL TEMPLATE

  public formatShortDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  public getEventColor(tipo: string): string {
    const colors: {[key: string]: string} = {
<<<<<<< HEAD
      'Celo': '#eb445a',
      'Vacunación': '#3880ff',
      'Inseminación': '#2dd36f',
      'Parto': '#ffc409'
=======
      'Celo': '#FEF08A',
      'Vacunación': '#BFDBFE',
      'Inseminación': '#BBF7D0',
      'Parto': '#EE4057'
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f
    };
    return colors[tipo] || '#92949c';
  }

  public getEventIcon(tipo: string): string {
    const icons: {[key: string]: string} = {
      'Celo': 'heart-outline',
      'Vacunación': 'medical-outline',
      'Inseminación': 'flower-outline',
      'Parto': 'person-outline'
    };
    return icons[tipo] || 'time-outline';
  }

  // MÉTODO getEstadoColor
  public getEstadoColor(estado: string): string {
    const colors: {[key: string]: string} = {
      'Pendiente': 'warning',
      'Programado': 'primary',
      'Realizado': 'success',
      'Cancelado': 'danger',
      'Alerta': 'danger'
    };
    return colors[estado] || 'medium';
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
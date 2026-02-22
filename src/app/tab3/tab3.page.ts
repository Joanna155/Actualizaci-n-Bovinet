import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReportService } from '../services/report.service';
import { DatabaseService } from '../services/database.service'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Animal } from '../services/database.service';

import { 
   IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonModal,
  IonButtons,
  IonTextarea,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonToggle,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
 calendarOutline,
  addOutline,
  timeOutline,
  heartOutline,
  medicalOutline,
  flowerOutline,
  personOutline,
  createOutline,
  trashOutline,
  closeOutline,
  saveOutline,
  listOutline,
  gridOutline,
  checkmarkOutline,
  logOutOutline,
  todayOutline,
  chevronBackOutline,
  chevronForwardOutline,
  leafOutline, medkitOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DataShareService } from '../services/data-share.service';

interface Evento {
  id: string;
  fecha: string;
  animalId: string;
  animalNombre: string;
  tipo: "Celo" | "Vacunación" | "Inseminación" | "Parto" | "Secado" | "Reto" | "Test Preñez" | "Revisión";
  estado: "Programado" | "Realizado" | "Pendiente" | "Alerta";
  notas: string;
  fechaCreacion: string;
  recordatorio?: boolean;
  diasPostParto?: number;
  protocoloParto?: boolean;
}


interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Evento[];
  dateString: string;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
   CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonBadge,
    IonModal,
    IonButtons,
    IonTextarea,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonInput,
    IonSegment,
    IonSegmentButton,
    IonToggle,
  ]
})
export class Tab3Page implements OnInit, OnDestroy {
  eventos: Evento[] = [];
  filteredEventos: Evento[] = [];
  animals: Animal[] = [];

// En Tab3Page - CORRIGE este método completo
private validarEdadReproductiva(animal: Animal, tipoEvento: string): { valido: boolean; mensaje: string } {
  console.log(`🔍 Validando edad para ${animal.nombre} (${animal.sexo}, ${animal.edadMeses} meses) - Evento: ${tipoEvento}`);
  
  // ✅ VALIDACIÓN MÁS ESTRICTA: No permitir si no tenemos edad
  if (!animal.edadMeses && animal.edadMeses !== 0) {
    return {
      valido: false,
      mensaje: `No se puede registrar ${tipoEvento.toLowerCase()}: ${animal.nombre} no tiene edad registrada`
    };
  }

  const edadMeses = animal.edadMeses;
  
  // ✅ NO PERMITIR ANIMALES DE 0 MESES PARA EVENTOS REPRODUCTIVOS
  if (edadMeses === 0) {
    const eventosReproductivos = ['Celo', 'Inseminación', 'Monta natural', 'Parto'];
    if (eventosReproductivos.includes(tipoEvento)) {
      return {
        valido: false,
        mensaje: `No se puede registrar ${tipoEvento.toLowerCase()}: ${animal.nombre} tiene 0 meses (recién nacido)`
      };
    }
  }

  // ✅ VALIDACIONES ESPECÍFICAS POR SEXO Y TIPO DE EVENTO
  if (animal.sexo === 'Hembra') {
    switch (tipoEvento) {
      case 'Inseminación':
      case 'Celo':
      case 'Monta natural':
        if (edadMeses < 15) {
          return {
            valido: false,
            mensaje: `La hembra ${animal.nombre} tiene solo ${edadMeses} meses. Mínimo 15 meses para reproducción.`
          };
        }
        if (edadMeses > 144) {
          return {
            valido: false,
            mensaje: `La hembra ${animal.nombre} tiene ${edadMeses} meses. Es demasiado mayor para reproducción.`
          };
        }
        break;
        
      case 'Parto':
        if (edadMeses < 24) {
          return {
            valido: false,
            mensaje: `La hembra ${animal.nombre} tiene solo ${edadMeses} meses. Mínimo 24 meses para parto.`
          };
        }
        if (edadMeses > 180) {
          return {
            valido: false,
            mensaje: `La hembra ${animal.nombre} tiene ${edadMeses} meses. Es demasiado mayor para parto.`
          };
        }
        break;
        
      case 'Secado':
        if (edadMeses < 24) {
          return {
            valido: false,
            mensaje: `La hembra ${animal.nombre} tiene solo ${edadMeses} meses. Mínimo 24 meses para secado.`
          };
        }
        break;
    }
  }

  if (animal.sexo === 'Macho') {
    const eventosReproductivosMacho = ['Celo', 'Monta natural'];
    if (eventosReproductivosMacho.includes(tipoEvento)) {
      if (edadMeses < 12) {
        return {
          valido: false,
          mensaje: `El macho ${animal.nombre} tiene solo ${edadMeses} meses. Mínimo 12 meses para reproducción.`
        };
      }
      if (edadMeses > 120) {
        return {
          valido: false,
          mensaje: `El macho ${animal.nombre} tiene ${edadMeses} meses. Es demasiado mayor para reproducción.`
        };
      }
    }
  }

  console.log(`✅ Validación de edad exitosa para ${animal.nombre}`);
  return { valido: true, mensaje: "" };
}

async repararBaseDatosUrgente() {
  console.log("🚨 Reparación URGENTE de base de datos...");
  
  try {
    // 1. Eliminar base de datos existente
    await this.databaseService.deleteDatabase();
    
    // 2. Inicializar desde cero
    const success = await this.databaseService.initializeDatabase();
    
    if (success) {
      console.log("✅ Base de datos recreada exitosamente");
      // Recargar datos
      this.animals = await this.databaseService.getAllAnimals();
    } else {
      console.log("❌ Error recreando base de datos");
    }
    
  } catch (error) {
    console.error("❌ Error en reparación urgente:", error);
  }
}

  // Constantes para edades reproductivas
  private readonly EDADES_REPRODUCTIVAS = {
    HEMBRA: {
      MINIMA: 15,
      MAXIMA: 144
    },
    MACHO: {
      MINIMA: 12,
      MAXIMA: 120
    }
  };

  // Filtros
  selectedTipoFilter = "Todos";
  selectedEstadoFilter = "Todos";
  selectedAnimalFilter = "Todos";
  viewMode = "list";

  // Modal para agregar/editar evento
  isModalOpen = false;
  isEditMode = false;
  currentEvento: Evento = this.getEmptyEvento();

  // Estadísticas
  totalEventos = 0;
  eventosPendientes = 0;
  eventosHoy = 0;

  // Propiedades del calendario
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  selectedDay: CalendarDay | null = null;
  calendarDays: CalendarDay[] = [];
  weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Nuevas propiedades para el ciclo reproductivo
  animalesEnCiclo = 0;
  generarProtocoloParto = true;

  // Modales para parto y reproducción
  isPartoModalOpen = false;
  isReproduccionModalOpen = false;
  isEstadoModalOpen = false;
  estadoModalData = {
    animalId: '',
    nuevoEstado: '',
    tratamiento: ''
  };


  // Datos para el formulario de parto
  partoData = {
    animalId: '',
    fecha: this.getLocalDateString(new Date()),
    raza: 'Angus',
    observaciones: ''
  };

  // Datos para el formulario de reproducción
  reproduccionData = {
    tipo: 'Monta natural',
    animalId: '',
    fecha: this.getLocalDateString(new Date()),
    semental: '',
    observaciones: ''
  };

  constructor(
   private alertController: AlertController,
    private toastController: ToastController,
    private router: Router,
    private authService: AuthService,
    private dataShareService: DataShareService,
    private databaseService: DatabaseService,
    private reportService: ReportService,
    private loadingController: LoadingController,
  ) {
    addIcons({calendarOutline,logOutOutline,addOutline,flowerOutline,heartOutline,medkitOutline,timeOutline,todayOutline,leafOutline,listOutline,checkmarkOutline,createOutline,trashOutline,chevronBackOutline,chevronForwardOutline,closeOutline,saveOutline,medicalOutline,personOutline,gridOutline,});
  }

  async ngOnInit() {
    console.log('🔄 Tab3 - Inicializando...');
    await this.inicializarDatos();
  }


  async inicializarDatos() {
    try {
      await this.loadAnimals()
      await this.loadEventsFromDatabase()
      await this.verificarYActualizarSecado() // Verificar secado automático
      this.updateStats()
      this.applyFilters()
      this.generateCalendar()

      await this.verificarDatosCriticos()
    } catch (error) {
      console.error("❌ Error en inicialización:", error)
      await this.showToast("Error cargando datos", "danger")
    }
  }

  

  async verificarDatosCriticos() {
    console.log('🔍 Verificando datos críticos...');
    
    const animalesSinEdad = this.animals.filter(a => !a.edadMeses || a.edadMeses === 0);
    if (animalesSinEdad.length > 0) {
      console.warn('⚠️ Animales sin edad:', animalesSinEdad);
      await this.corregirEdadesAnimales();
    }
    
    await this.debugAnimalData();
  }

  async corregirEdadesAnimales() {
    console.log('🛠️ Corrigiendo edades de animales...');
    
    this.animals = this.animals.map(animal => {
      let edadMeses = animal.edadMeses;
      
      if (!edadMeses || edadMeses === 0) {
        const esHembra = animal.sexo === 'Hembra';
        const esMacho = animal.sexo === 'Macho';
        const ultimoCaracter = animal.id.slice(-1);
        const edadBase = parseInt(ultimoCaracter) || 1;
        
        if (esHembra) {
          edadMeses = 24 + (edadBase * 6);
        } else if (esMacho) {
          edadMeses = 36 + (edadBase * 6);
        } else {
          edadMeses = 24;
        }
        
        console.log(`📅 Corrigiendo edad de ${animal.nombre}: ${edadMeses} meses`);
      }
      
      return {
        ...animal,
        edadMeses: edadMeses,
        activoReproduccion: animal.activoReproduccion ?? true,
        estadoReproductivo: animal.estadoReproductivo ?? (animal.sexo === 'Hembra' ? 'Limpia' : undefined)
      };
    });
    
    await this.guardarCorreccionesEnBD();
  }

  async guardarCorreccionesEnBD() {
    try {
      console.log('💾 Guardando correcciones en BD...');
      for (const animal of this.animals) {
        // Crear un objeto compatible con la interfaz del DatabaseService
        const animalParaBD = {
          ...animal,
          // Agregar campos requeridos por DatabaseService.Animal
          siniga: animal.siniga || '',
          madre: '',
          padre: '',
          fechaNacimiento: new Date().toISOString().split('T')[0],
          edad: animal.edad || '',
          estado: 'Bueno' as const,
          observaciones: '',
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString()
        };
        await this.databaseService.updateAnimal(animalParaBD);
      }
      console.log('✅ Correcciones guardadas');
    } catch (error) {
      console.error('❌ Error guardando correcciones:', error);
    }
  }

  // Filtros de animales CORREGIDOS
  get animalsHembras(): Animal[] {
    const hembras = this.animals.filter(animal => animal.sexo === 'Hembra');
    console.log('🔍 Hembras encontradas:', hembras.length);
    return hembras;
  }

  get animalsHembrasReproductivas(): Animal[] {
    const hembrasReproductivas = this.animalsHembras.filter(animal => {
      if (!this.tieneDatosReproductivos(animal)) {
        console.log(`❌ Hembra ${animal.nombre} excluida: falta datos reproductivos`);
        return false;
      }
      
      const cond1 = animal.activoReproduccion !== false;
      const cond2 = animal.estadoReproductivo !== "Seca";
      const cond3 = animal.estadoReproductivo !== "Reto";
      
      const edadMeses = animal.edadMeses || 0;
      const cond4 = edadMeses >= this.EDADES_REPRODUCTIVAS.HEMBRA.MINIMA && 
                   edadMeses <= this.EDADES_REPRODUCTIVAS.HEMBRA.MAXIMA;
      
      const esValida = cond1 && cond2 && cond3 && cond4;
      
      console.log(`🔍 Hembra ${animal.nombre}: ${edadMeses} meses, válida=${esValida}`);
      
      return esValida;
    });
    
    console.log('✅ Hembras reproductivas finales:', hembrasReproductivas.length);
    return hembrasReproductivas;
  }

 // TEMPORAL: Getter menos restrictivo para debug
get animalsMachosReproductivos(): Animal[] {
  const machosReproductivos = this.animals.filter(animal => {
    if (animal.sexo !== "Macho") return false;
    
    // Verificación básica sin filtros estrictos temporalmente
    const cond1 = animal.activoReproduccion !== false;
    const edadMeses = animal.edadMeses || 0;
    const cond2 = edadMeses >= 12; // Mínimo 1 mes temporalmente para debug
    
    console.log(`🔍 Macho ${animal.nombre}: activo=${cond1}, edadOk=${cond2} (${edadMeses} meses)`);
    
    return cond1 && cond2;
  });
  
  console.log('✅ Machos reproductivos (debug):', machosReproductivos.length, machosReproductivos);
  return machosReproductivos;
}
  get animalsMachos(): Animal[] {
    const machos = this.animals.filter(animal => animal.sexo === "Macho");
    console.log('🔍 Todos los machos:', machos.length);
    return machos;
  }

  private tieneDatosReproductivos(animal: Animal): boolean {
    return !!(animal.edadMeses && animal.edadMeses > 0 && animal.estadoReproductivo);
  }

  // Métodos del ciclo de vida
  ionViewWillEnter() {
    console.log('🔄 Tab3 - Recargando datos...');
    this.inicializarDatos();
  }

  ngOnDestroy() {
    console.log('🧹 Tab3 - Limpiando...');
  }

  // Métodos para cargar datos
  async loadAnimals() {
    try {
      console.log('🐄 Cargando animales desde base de datos...');
      
      const dbStatus = await this.databaseService.getDatabaseStatus();
      if (!dbStatus.isReady) {
        console.log('🔄 Base de datos no está lista, inicializando...');
        const initialized = await this.databaseService.initializeDatabase();
        if (!initialized) {
          throw new Error('No se pudo inicializar la base de datos');
        }
      }

      const dbAnimals = await this.databaseService.getAllAnimals();
      if (dbAnimals && dbAnimals.length > 0) {
        this.animals = dbAnimals;
        console.log(`✅ ${dbAnimals.length} animales cargados desde BD`);
      } else {
        console.log('⚠️ Usando animales por defecto');
        this.animals = this.getDefaultAnimals();
      }
      
    } catch (error) {
      console.error('❌ Error cargando animales:', error);
      this.animals = this.getDefaultAnimals();
    }
  }

// En Tab3Page - método para validar eventos duplicados
// En Tab3Page - método mejorado
private async validarEventoDuplicado(evento: any): Promise<boolean> {
  try {
    console.log(`🔍 Validando duplicado para: ${evento.tipo} - ${evento.animalNombre}`);
    
    // Eventos que NO deben duplicarse en absoluto
    const eventosNoDuplicables = ['Parto', 'Inseminación'];
    if (eventosNoDuplicables.includes(evento.tipo)) {
      const existe = this.eventos.some(e => 
        e.animalId === evento.animalId && 
        e.tipo === evento.tipo && 
        e.fecha === evento.fecha &&
        (this.isEditMode ? e.id !== evento.id : true)
      );
      
      if (existe) {
        console.log(`❌ ${evento.tipo} duplicado encontrado para misma fecha`);
        return true;
      }
    }

    // Para celos, permitir máximo 1 por mes
    if (evento.tipo === 'Celo') {
      const fecha = new Date(evento.fecha);
      const mes = fecha.getMonth();
      const año = fecha.getFullYear();
      
      const celosEsteMes = this.eventos.filter(e => {
        if (e.animalId !== evento.animalId || e.tipo !== 'Celo') return false;
        if (this.isEditMode && e.id === evento.id) return false;
        
        const fechaExistente = new Date(e.fecha);
        return fechaExistente.getMonth() === mes && fechaExistente.getFullYear() === año;
      });
      
      if (celosEsteMes.length >= 1) {
        console.log(`❌ Ya existe un celo registrado para ${evento.animalNombre} este mes`);
        return true;
      }
    }

    return false;

  } catch (error) {
    console.error('❌ Error validando evento duplicado:', error);
    return false;
  }
}
// Método auxiliar para calcular diferencia en días
private diferenciaEnDias(fecha1: string, fecha2: string): number {
  const date1 = new Date(fecha1 + 'T12:00:00');
  const date2 = new Date(fecha2 + 'T12:00:00');
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Validación específica para partos (solo debe haber uno por animal)
  private getDefaultAnimals(): Animal[] {
    return [
      { 
        id: "H001", 
        nombre: "Paloma", 
        sexo: "Hembra", 
        edadMeses: 36, 
        activoReproduccion: true, 
        estadoReproductivo: "Limpia" 
      },
      { 
        id: "H002", 
        nombre: "Estrella", 
        sexo: "Hembra", 
        edadMeses: 24, 
        activoReproduccion: true, 
        estadoReproductivo: "Limpia" 
      },
      { 
        id: "M001", 
        nombre: "Toro Bravo", 
        sexo: "Macho", 
        edadMeses: 48, 
        activoReproduccion: true, 
        estadoReproductivo: "Limpia" 
      },
      { 
        id: "H003", 
        nombre: "Bonita", 
        sexo: "Hembra", 
        edadMeses: 18, 
        activoReproduccion: true, 
        estadoReproductivo: "Limpia" 
      },
      { 
        id: "M002", 
        nombre: "Torito", 
        sexo: "Macho", 
        edadMeses: 60, 
        activoReproduccion: true, 
        estadoReproductivo: "Limpia" 
      }
    ];
  }

 // En Tab3Page - agregar este método después de saveEventsToDatabase()
private async actualizarEstadoReproductivoDesdeEvento(evento: any): Promise<void> {
  try {
    console.log('🔄 Tab3: Actualizando estado reproductivo desde evento:', evento.tipo, evento.estado);

    const animal = this.animals.find(a => a.id === evento.animalId);
    if (!animal) {
      console.log('❌ Tab3: Animal no encontrado para actualizar estado');
      return;
    }

    let nuevoEstado: string | undefined;

    switch (evento.tipo) {
      case 'Parto':
        if (evento.estado === 'Realizado') {
          nuevoEstado = 'Limpia';
          // Actualizar fechas importantes
          animal.ultimoParto = evento.fecha;
          animal.diasPostParto = 0;
          console.log('✅ Parto realizado → Estado: Limpia');
        }
        break;

      case 'Inseminación':
        if (evento.estado === 'Realizado') {
          nuevoEstado = 'Prefiada';
          animal.ultimaInseminacion = evento.fecha;
          console.log('✅ Inseminación realizada → Estado: Preñada');
        }
        break;

      case 'Celo':
        if (evento.estado === 'Realizado') {
          nuevoEstado = 'Sucia';
          animal.ultimaMonta = evento.fecha;
          console.log('✅ Celo detectado → Estado: Sucia');
        }
        break;

      case 'Test Preñez':
        if (evento.estado === 'Realizado') {
          if (evento.notas?.toLowerCase().includes('positivo') || evento.notas?.toLowerCase().includes('preñada')) {
            nuevoEstado = 'Prefiada';
            console.log('✅ Test preñez positivo → Estado: Preñada');
          } else {
            nuevoEstado = 'Vacia';
            console.log('✅ Test preñez negativo → Estado: Vacía');
          }
        }
        break;

      case 'Secado':
        if (evento.estado === 'Realizado') {
          nuevoEstado = 'Seca';
          console.log('✅ Secado realizado → Estado: Seca');
        }
        break;
    }

    // Actualizar el animal si hay cambio de estado
    if (nuevoEstado && animal.estadoReproductivo !== nuevoEstado) {
      console.log(`🔄 Tab3: Cambiando estado de ${animal.nombre}: ${animal.estadoReproductivo} → ${nuevoEstado}`);
      
      animal.estadoReproductivo = nuevoEstado as any;

      // Actualizar en la base de datos
      const animalActualizado = {
        ...animal,
        fechaActualizacion: new Date().toISOString()
      };

      const success = await this.databaseService.updateAnimal(animalActualizado);
      console.log('✅ Tab3: Base de datos actualizada:', success);

      if (success) {
        // Notificar a Tab2 para que se actualice
        this.dataShareService.notifyAnimalUpdate(animal);
        console.log('✅ Tab3: Notificación enviada a Tab2');
      }
    } else {
      console.log('ℹ️ Tab3: No hay cambio de estado necesario');
    }

  } catch (error) {
    console.error('❌ Tab3: Error actualizando estado reproductivo:', error);
  }
}
  // ========== MÉTODOS FALTANTES AGREGADOS ==========

  // Métodos para reportes
  async mostrarOpcionesReporte() {
    const alert = await this.alertController.create({
      header: 'Generar Reporte',
      message: 'Seleccione el tipo de reporte:',
      buttons: [
        {
          text: 'Semana Actual (PDF)',
          handler: () => this.generarReporteSemanal('actual', 'pdf')
        },
        {
          text: 'Semana Actual (Excel)',
          handler: () => this.generarReporteSemanal('actual', 'excel')
        },
        {
          text: 'Semana Pasada (PDF)',
          handler: () => this.generarReporteSemanal('pasada', 'pdf')
        },
        {
          text: 'Semana Pasada (Excel)',
          handler: () => this.generarReporteSemanal('pasada', 'excel')
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async generarReporteSemanal(tipo: string, formato: string) {
    let rango: any;
    
    if (tipo === 'actual') {
      rango = this.reportService.getSemanaActual();
    } else {
      rango = this.reportService.getSemanaPasada();
    }

    const loading = await this.showLoading('Generando reporte...');
    
    try {
      const reporte = await this.reportService.generarReporteSemanal(
        rango.inicio, 
        rango.fin
      );

      if (formato === 'pdf') {
        await this.reportService.generarPDF(reporte);
      } else {
        await this.reportService.generarExcel(reporte);
      }

      await loading.dismiss();
      await this.showToast('Reporte generado exitosamente', 'success');
      
    } catch (error) {
      await loading.dismiss();
      console.error('Error generando reporte:', error);
      await this.showToast('Error al generar el reporte', 'danger');
    }
  }

 async cambiarEstadoReproductivo(animal: Animal, nuevoEstado: "Limpia" | "Sucia", tratamiento?: string) {
    if (nuevoEstado === "Sucia" && !tratamiento) {
      await this.showToast('Debe especificar el tratamiento para estado "Sucia"', "warning")
      return
    }

    animal.estadoReproductivo = nuevoEstado

    const evento: Evento = {
      id: `estado-${nuevoEstado.toLowerCase()}-${Date.now()}`,
      fecha: this.getLocalDateString(new Date()),
      animalId: animal.id,
      animalNombre: animal.nombre,
      tipo: "Revisión",
      estado: "Realizado",
      notas:
        nuevoEstado === "Sucia"
          ? `Estado cambiado a Sucia. Tratamiento: ${tratamiento}`
          : "Estado cambiado a Limpia - Condiciones óptimas verificadas",
      fechaCreacion: this.getLocalDateString(new Date()),
    }

    this.eventos.push(evento)
    await this.saveEventsToDatabase()
    await this.showToast(`Estado actualizado a "${nuevoEstado}"`, "success")
  }

  private async showLoading(message: string): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({ 
      message,
      duration: 30000,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  

  // Métodos para logout
  async logout() {
    const alert = await this.alertController.create({
      header: "Cerrar Sesión",
      message: "¿Estás seguro de que deseas cerrar sesión?<br><br>Se perderán los datos no guardados.",
      cssClass: "custom-alert",
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
          cssClass: "alert-button-cancel",
          handler: () => {
            console.log("Logout cancelado");
          },
        },
        {
          text: "Aceptar",
          cssClass: "alert-button-confirm",
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login'], { replaceUrl: true });
          },
        },
      ]
    });

    await alert.present();
  }



  async confirmDelete(evento: Evento) {
    const alert = await this.alertController.create({
      header: "Confirmar Eliminación",
      message: `¿Estás seguro de que deseas eliminar el evento de <strong>${evento.tipo}</strong> para <strong>${evento.animalNombre}</strong>?<br><br>Esta acción no se puede deshacer.`,
      cssClass: "custom-alert",
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
          cssClass: "alert-button-cancel",
          handler: () => {
            console.log("Eliminación cancelada");
          },
        },
        {
          text: "Aceptar",
          cssClass: "alert-button-confirm",
          handler: () => {
            this.deleteEvento(evento);
          }
        },
      ],
    });

    await alert.present();
  }

  async deleteEvento(evento: Evento) {
    const index = this.eventos.findIndex((e) => e.id === evento.id);
    if (index !== -1) {
      this.eventos.splice(index, 1);
      
      try {
        await this.databaseService.deleteEvento(evento.id);
        console.log('✅ Evento eliminado de la BD');
      } catch (error) {
        console.error('❌ Error eliminando evento de BD:', error);
      }
      
      await this.saveEventsToDatabase();
      
      this.updateStats();
      this.applyFilters();
      this.generateCalendar();
      await this.showToast("Evento eliminado correctamente", "success");
    }
  }


async openEstadoModal() {
  if (this.animalsHembras.length === 0) {
    await this.showToast('No hay hembras disponibles', 'warning');
    return;
  }
  
  this.estadoModalData = {
      animalId: '',
      nuevoEstado: '',
      tratamiento: ''
    };
    this.isEstadoModalOpen = true;
}

closeEstadoModal() {
  this.isEstadoModalOpen = false;
}

async confirmarCambioEstado() {
  if (!this.estadoModalData.animalId || !this.estadoModalData.nuevoEstado) {
    await this.showToast('Seleccione un animal y estado', 'warning');
    return;
  }

  if (this.estadoModalData.nuevoEstado === 'Sucia' && !this.estadoModalData.tratamiento) {
    await this.showToast('Debe especificar el tratamiento para estado "Sucia"', 'warning');
    return;
  }

 const animal = this.animals.find(a => a.id === this.estadoModalData.animalId);
    if (animal) {
      await this.cambiarEstadoReproductivo(
        animal,
        this.estadoModalData.nuevoEstado as "Limpia" | "Sucia",
        this.estadoModalData.tratamiento
      );
      this.closeEstadoModal();
    }
}

// Métodos para abrir modales - AGREGAR ESTOS
openPartoModal() {
  this.partoData = {
    animalId: '',
    fecha: this.getLocalDateString(new Date()),
    raza: 'Angus',
    observaciones: ''
  };
  
  console.log('📋 Abriendo modal de parto...');
  console.log('Hembras reproductivas disponibles:', this.animalsHembrasReproductivas);
  
  if (this.animalsHembrasReproductivas.length === 0) {
    this.showToast('No hay hembras en edad reproductiva disponibles', 'warning');
  }
  
  this.isPartoModalOpen = true;
}

private debugAnimalesParaEvento(tipoEvento: string) {
  console.log(`🐄 DEBUG ANIMALES PARA ${tipoEvento}:`);
  
  this.animals.forEach(animal => {
    const validacion = this.validarEdadReproductiva(animal, tipoEvento);
    console.log(`   ${animal.sexo === 'Hembra' ? '♀' : '♂'} ${animal.nombre}:`);
    console.log(`     - Edad: ${animal.edadMeses} meses`);
    console.log(`     - Estado Reprod: ${animal.estadoReproductivo}`);
    console.log(`     - Válido para ${tipoEvento}: ${validacion.valido}`);
    if (!validacion.valido) {
      console.log(`     - Razón: ${validacion.mensaje}`);
    }
  });
}

openReproduccionModal() {
  this.reproduccionData = {
    tipo: 'Monta natural',
    animalId: '',
    fecha: this.getLocalDateString(new Date()),
    semental: '',
    observaciones: ''
  };
  
  console.log('💕 Abriendo modal de reproducción...');
  
  // DEBUG: Verificar machos
  this.debugMachos();
  
  console.log('Hembras disponibles:', this.animalsHembras.length);
  console.log('Machos reproductivos disponibles:', this.animalsMachosReproductivos.length);
  
  if (this.animalsHembras.length === 0) {
    this.showToast('No hay hembras disponibles', 'warning');
  }
  if (this.animalsMachosReproductivos.length === 0) {
    this.showToast('No hay sementales en edad reproductiva disponibles', 'warning');
  }
  
  this.isReproduccionModalOpen = true;
}

closePartoModal() {
  this.isPartoModalOpen = false;
}


  closeReproduccionModal() {
    this.isReproduccionModalOpen = false;
  }

  onAnimalFilterChange(event: any) {
    this.selectedAnimalFilter = event.detail.value;
<<<<<<< HEAD
    this.applys();
=======
    this.applyFilters();
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f
  }

  async corregirEstadosReproductivos() {
  console.log("🔧 Corrigiendo estados reproductivos...");
  
  for (const animal of this.animals) {
    // Si el animal no tiene estado reproductivo, asignar uno por defecto
    if (!animal.estadoReproductivo || animal.estadoReproductivo.trim() === '') {
      const nuevoEstado = animal.sexo === 'Hembra' ? 'Limpia' : 'Semental';
      console.log(`🔄 Corrigiendo estado de ${animal.nombre}: "" -> "${nuevoEstado}"`);
      
      animal.estadoReproductivo = nuevoEstado;
      
      // Actualizar en base de datos
      const animalActualizado = {
        ...animal,
        fechaActualizacion: new Date().toISOString()
      };
      
      await this.databaseService.updateAnimal(animalActualizado);
    }
  }
  
  console.log("✅ Estados reproductivos corregidos");
  await this.showToast("Estados reproductivos corregidos", "success");
}

  // Métodos para parto y reproducción
  async confirmarParto() {
    if (!this.partoData.animalId || !this.partoData.fecha) {
      await this.showToast('Complete todos los campos', 'warning');
      return;
    }

    const duplicado = await this.validarPartoDuplicado(this.partoData.animalId, this.partoData.fecha);
    if (duplicado) {
      await this.showToast('Ya existe un parto registrado para este animal en la misma fecha', 'warning');
      return;
    }

    const animal = this.animals.find(a => a.id === this.partoData.animalId);
    if (!animal) {
      await this.showToast('Animal no encontrado', 'danger');
      return;
    }

    await this.registrarParto(animal, this.partoData.fecha, this.partoData.observaciones);
    this.isPartoModalOpen = false;
  }

  async confirmarReproduccion() {
    if (!this.reproduccionData.animalId || !this.reproduccionData.fecha) {
      await this.showToast('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    const duplicado = await this.validarReproduccionDuplicada(
      this.reproduccionData.animalId, 
      this.reproduccionData.fecha
    );
    if (duplicado) {
      await this.showToast('Ya existe un registro de reproducción para este animal en la misma fecha', 'warning');
      return;
    }

    const animal = this.animals.find(a => a.id === this.reproduccionData.animalId);
    if (!animal) {
      await this.showToast('Animal no encontrado', 'danger');
      return;
    }

    await this.registrarReproduccion(
      animal, 
      this.reproduccionData.tipo as "Monta natural" | "Inseminación", 
      this.reproduccionData.fecha, 
      this.reproduccionData.semental
    );
    this.isReproduccionModalOpen = false;
  }

  // Métodos de validación
  async validarPartoDuplicado(animalId: string, fecha: string): Promise<boolean> {
    const partosExistentes = this.eventos.filter(evento => 
      evento.animalId === animalId && 
      evento.tipo === "Parto" && 
      evento.fecha === fecha
    );
    return partosExistentes.length > 0;
  }

  async validarReproduccionDuplicada(animalId: string, fecha: string): Promise<boolean> {
    const reproduccionesExistentes = this.eventos.filter(evento => 
      evento.animalId === animalId && 
      (evento.tipo === "Celo" || evento.tipo === "Inseminación") && 
      evento.fecha === fecha
    );
    return reproduccionesExistentes.length > 0;
  }

  // Métodos para base de datos
  private async loadEventsFromDatabase() {
    try {
      this.eventos = await this.databaseService.getAllEventos();
      console.log(`✅ ${this.eventos.length} eventos cargados desde BD`);
    } catch (error) {
      console.error('❌ Error cargando eventos:', error);
      this.eventos = [];
    }
  }

  private async saveEventsToDatabase() {
    try {
      console.log('💾 Guardando eventos en base de datos...');
      
      const dbReady = await this.databaseService.initializeDatabase();
      if (!dbReady) {
        throw new Error('Base de datos no disponible');
      }
      
      for (const evento of this.eventos) {
        const eventoExistente = await this.databaseService.getEventoById(evento.id);
        
        if (eventoExistente) {
          await this.databaseService.updateEvento(evento);
        } else {
          await this.databaseService.insertEvento(evento);
        }
      }
      
      console.log('✅ Eventos guardados en BD');
      this.dataShareService.notifyDataUpdate();
      
    } catch (error) {
      console.error('❌ Error guardando eventos en BD:', error);
      throw error;
    }
  }

  // Métodos para parto y reproducción
  async registrarParto(animal: Animal, fechaParto: string, observaciones?: string) {
    const eventoParto: Evento = {
      id: `parto-${Date.now()}`,
      fecha: fechaParto,
      animalId: animal.id,
      animalNombre: animal.nombre,
      tipo: "Parto",
      estado: "Realizado",
      notas: observaciones || 'Parto registrado',
      fechaCreacion: this.getLocalDateString(new Date()),
      protocoloParto: true,
      diasPostParto: 0
    };

    this.eventos.push(eventoParto);

    animal.ultimoParto = fechaParto;
    animal.diasPostParto = 0;
    animal.estadoReproductivo = "Limpia";

    await this.generarEventosProtocoloParto(animal, fechaParto);
    await this.saveEventsToDatabase();
    this.updateStats();
    this.applyFilters();
    this.generateCalendar();
  }

  async registrarReproduccion(animal: Animal, tipo: "Monta natural" | "Inseminación", fecha: string, semental?: string) {
    const evento: Evento = {
      id: `repro-${tipo.toLowerCase()}-${Date.now()}`,
      fecha: fecha,
      animalId: animal.id,
      animalNombre: animal.nombre,
      tipo: tipo === "Monta natural" ? "Celo" : "Inseminación",
      estado: "Realizado",
      notas: `${tipo} ${semental ? 'con ' + semental : ''}`,
      fechaCreacion: this.getLocalDateString(new Date()),
      protocoloParto: true
    };

    this.eventos.push(evento);

    if (tipo === "Monta natural") {
      animal.ultimaMonta = fecha;
    } else {
      animal.ultimaInseminacion = fecha;
    }

    await this.generarEventosPostReproduccion(animal, fecha);
    await this.saveEventsToDatabase();
    this.updateStats();
    this.applyFilters();
    this.generateCalendar();
  }



  // ========== MÉTODOS EXISTENTES ==========

// En Tab3Page - Agrega este método para debug
debugMachos() {
  console.log('=== 🐂 DEBUG MACHOS ===');
  
  // Todos los animales
  console.log('📊 Total animales:', this.animals.length);
  console.log('📋 Todos los animales:', this.animals);
  
  // Machos
  console.log('🐂 Total machos:', this.animalsMachos.length);
  console.log('📋 Todos los machos:', this.animalsMachos);
  
  // Machos reproductivos
  console.log('🔍 Machos reproductivos:', this.animalsMachosReproductivos.length);
  console.log('📋 Detalle machos reproductivos:', this.animalsMachosReproductivos);
  
  // Verificar cada macho individualmente
  this.animalsMachos.forEach(macho => {
    const edadMeses = macho.edadMeses || 0;
    const activo = macho.activoReproduccion !== false;
    const edadMinima = 12;
    const edadMaxima = 120;
    const edadOk = edadMeses >= edadMinima && edadMeses <= edadMaxima;
    const esReproductivo = activo && edadOk;
    
    console.log(`🔍 ${macho.nombre} (${macho.id}):`, {
      edadMeses,
      activoReproduccion: macho.activoReproduccion,
      estadoReproductivo: macho.estadoReproductivo,
      edadOk,
      esReproductivo,
      categoria: this.getCategoriaEdad(macho)
    });
  });
}

  // Métodos de utilidad
  getCategoriaEdad(animal: Animal): string {
    if (!animal.edadMeses) return 'Edad desconocida';
    
    const edad = animal.edadMeses;
    const años = Math.floor(edad / 12);
    const meses = edad % 12;
    
    if (animal.sexo === 'Hembra') {
      if (edad < 15) return `📅 ${años}a ${meses}m (Muy joven)`;
      if (edad <= 24) return `👶 ${años}a ${meses}m (Primera monta)`;
      if (edad <= 96) return `🐄 ${años}a ${meses}m (Plena producción)`;
      if (edad <= 144) return `👵 ${años}a ${meses}m (Adulto mayor)`;
      return `🛑 ${años}a ${meses}m (Edad avanzada)`;
    } else {
      if (edad < 12) return `📅 ${años}a ${meses}m (Muy joven)`;
      if (edad <= 24) return `👦 ${años}a ${meses}m (Macho joven)`;
      if (edad <= 96) return `🐂 ${años}a ${meses}m (Adulto reproductivo)`;
      if (edad <= 120) return `👴 ${años}a ${meses}m (Semental mayor)`;
      return `🛑 ${años}a ${meses}m (Edad avanzada)`;
    }
  }

  // Debug methods
  async debugAnimalData() {
    console.log('=== 🐄 DEBUG ANIMAL DATA ===');
    console.log('Total animales:', this.animals.length);
    console.log('Hembras reproductivas:', this.animalsHembrasReproductivas.length);
    console.log('Machos reproductivos:', this.animalsMachosReproductivos.length);
    
    this.animals.forEach(animal => {
      console.log(`${animal.sexo === 'Hembra' ? '🐄' : '🐂'} ${animal.nombre}: ${animal.edadMeses} meses - ${this.getCategoriaEdad(animal)}`);
    });
  }

  // El resto de tus métodos existentes (sin cambios)
  private createLocalDate(year: number, month: number, day: number): Date {
  // Crear fecha en UTC para evitar desplazamientos
  return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
}

  private getLocalDateString(date: Date): string {
  // Usar UTC para evitar problemas de zona horaria
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

  private isSameDate(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

// CORREGIR: Método formatDate para mostrar correctamente
formatDate(dateString: string): string {
  if (!dateString) return "";
  
  // Usar UTC para evitar problemas de zona horaria
  const date = new Date(dateString + 'T12:00:00Z'); // Forzar UTC
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  // Usar fechas UTC para comparación
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const tomorrowUTC = new Date(Date.UTC(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()));
  const dateUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  if (this.isSameDate(dateUTC, todayUTC)) {
    return "Hoy";
  } else if (this.isSameDate(dateUTC, tomorrowUTC)) {
    return "Mañana";
  } else {
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: 'UTC' // Forzar zona horaria UTC
    });
  }
}

// CORREGIR: Método para verificar si un evento está vencido
isEventOverdue(evento: Evento): boolean {
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const eventDate = new Date(evento.fecha + 'T12:00:00Z');
  const eventDateUTC = new Date(Date.UTC(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()));
  
  return eventDateUTC < todayUTC && evento.estado !== "Realizado";
}

// CORREGIR: En el método generarCalendar - usar UTC
generateCalendar() {
  const firstDay = this.createLocalDate(this.currentYear, this.currentMonth, 1);
  const lastDay = this.createLocalDate(this.currentYear, this.currentMonth + 1, 0);

  const startDate = this.createLocalDate(this.currentYear, this.currentMonth, 1);
  startDate.setUTCDate(startDate.getUTCDate() - firstDay.getUTCDay());

  const endDate = this.createLocalDate(this.currentYear, this.currentMonth + 1, 0);
  endDate.setUTCDate(endDate.getUTCDate() + (6 - lastDay.getUTCDay()));

  this.calendarDays = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateString = this.getLocalDateString(currentDate);
    const dayEvents = this.eventos.filter((evento) => evento.fecha === dateString);
    
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const currentUTC = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));
    
    const isToday = this.isSameDate(currentUTC, todayUTC);
    const isCurrentMonth = currentDate.getUTCMonth() === this.currentMonth;

    this.calendarDays.push({
      date: new Date(currentDate),
      day: currentDate.getUTCDate(),
      isCurrentMonth,
      isToday,
      events: dayEvents,
      dateString: dateString,
    });

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
}


  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
    this.selectedDay = null;
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
    this.selectedDay = null;
  }

  getMonthName(month: number): string {
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return months[month];
  }

  selectDay(day: CalendarDay) {
    this.selectedDay = day;
  }

  formatSelectedDay(day: CalendarDay): string {
    return day.date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  addEventToSelectedDay() {
    if (this.selectedDay) {
      this.isEditMode = false;
      this.currentEvento = this.getEmptyEvento();
      this.currentEvento.fecha = this.selectedDay.dateString;
      this.isModalOpen = true;
    }
  }

  // En Tab3Page - mejora updateStats:
updateStats() {
  this.totalEventos = this.eventos.length;
  this.eventosPendientes = this.eventos.filter((e) => 
    e.estado === "Pendiente" || e.estado === "Programado").length;

  const today = this.getLocalDateString(new Date());
  this.eventosHoy = this.eventos.filter((e) => e.fecha === today).length;

  // Mejorar cálculo de animales en ciclo
  this.animalesEnCiclo = this.animalsHembras.filter(animal => {
    const tieneParto = !!animal.ultimoParto;
    const diasPostParto = animal.diasPostParto || 0;
    const enRango = diasPostParto > 0 && diasPostParto < 300;
    const estadoValido = !['Seca', 'Vacia'].includes(animal.estadoReproductivo || '');
    
    console.log(`Ciclo: ${animal.nombre} - Parto: ${tieneParto} - DPP: ${diasPostParto} - Estado: ${animal.estadoReproductivo} - EnCiclo: ${tieneParto && enRango && estadoValido}`);
    
    return tieneParto && enRango && estadoValido;
  }).length;

  console.log(`Animales en ciclo: ${this.animalesEnCiclo}`);
}

  applyFilters() {
    this.filteredEventos = this.eventos.filter((evento) => {
      const matchesTipo = this.selectedTipoFilter === "Todos" || evento.tipo === this.selectedTipoFilter;
      const matchesEstado = this.selectedEstadoFilter === "Todos" || evento.estado === this.selectedEstadoFilter;
      const matchesAnimal = this.selectedAnimalFilter === "Todos" || evento.animalId === this.selectedAnimalFilter;
      
      return matchesTipo && matchesEstado && matchesAnimal;
    });

    this.filteredEventos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  onTipoFilterChange(event: any) {
    this.selectedTipoFilter = event.detail.value;
    this.applyFilters();
  }

  onEstadoFilterChange(event: any) {
    this.selectedEstadoFilter = event.detail.value;
    this.applyFilters();
  }

  setViewMode(mode: string) {
    if (mode !== this.viewMode) {
      this.viewMode = mode;
    }
  }

  async openAddModal() {
    this.isEditMode = false;
    this.currentEvento = this.getEmptyEvento();
    this.isModalOpen = true;
  }

  async openEditModal(evento: Evento) {
    this.isEditMode = true;
    this.currentEvento = { ...evento };
    this.isModalOpen = true;
  }

  async closeModal() {
    this.isModalOpen = false;
    setTimeout(() => {
      this.currentEvento = this.getEmptyEvento();
      this.isEditMode = false;
    }, 100);
  }

 async saveEvento() {
  if (!this.validateEvento()) {
    await this.showToast("Por favor complete todos los campos requeridos", "warning");
    return;
  }

  // ✅ VALIDAR EDAD REPRODUCTIVA - CON MÁS DETALLES
  const animal = this.animals.find((a) => a.id === this.currentEvento.animalId);
  
  if (!animal) {
    await this.showToast("Animal no encontrado", "danger");
    return;
  }

  console.log(`🔍 Iniciando validación para: ${animal.nombre} (${animal.sexo}, ${animal.edadMeses} meses)`);
  
  const validationEdad = this.validarEdadReproductiva(animal, this.currentEvento.tipo);
  
  if (!validationEdad.valido) {
    console.log(`❌ Validación fallida: ${validationEdad.mensaje}`);
    await this.showToast(validationEdad.mensaje, "warning");
    return;
  }

  this.currentEvento.animalNombre = animal.nombre;

  // ✅ VALIDAR EVENTOS DUPLICADOS
  const esDuplicado = await this.validarEventoDuplicado(this.currentEvento);
  if (esDuplicado) {
    await this.showToast(`Ya existe un evento de ${this.currentEvento.tipo} para este animal en fechas similares`, "warning");
    return;
  }

  // ✅ VALIDACIÓN ESPECIAL PARA PARTOS
  if (this.currentEvento.tipo === 'Parto') {
    const partoDuplicado = await this.validarPartoDuplicado(this.currentEvento.animalId, this.currentEvento.fecha);
    if (partoDuplicado) {
      await this.showToast("Ya existe un parto registrado para este animal en fechas cercanas", "danger");
      return;
    }
  }

  // VALIDACIÓN ESPECIAL PARA PARTOS
  if (this.currentEvento.tipo === 'Parto') {
    const partoDuplicado = await this.validarPartoDuplicado(this.currentEvento.animalId, this.currentEvento.fecha);
    if (partoDuplicado) {
      await this.showToast("Ya existe un parto registrado para este animal", "danger");
      return;
    }
  }


  if (this.isEditMode) {
    const index = this.eventos.findIndex((e) => e.id === this.currentEvento.id);
    if (index !== -1) {
      this.eventos[index] = { ...this.currentEvento };
      await this.actualizarEstadoReproductivoDesdeEvento(this.currentEvento);
      await this.showToast("Evento actualizado correctamente", "success");
    }
  } else {
    this.currentEvento.id = `evento-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.currentEvento.fechaCreacion = this.getLocalDateString(new Date());
    this.eventos.push({ ...this.currentEvento });
    await this.actualizarEstadoReproductivoDesdeEvento(this.currentEvento);
    await this.showToast("Evento registrado correctamente", "success");
  }

  await this.saveEventsToDatabase();
  this.updateStats();
  this.applyFilters();
  this.generateCalendar();
  this.closeModal();
}
// En markAsCompleted() - después de cambiar el estado
async markAsCompleted(evento: any) {
  const index = this.eventos.findIndex((e) => e.id === evento.id);
  if (index !== -1) {
    this.eventos[index].estado = "Realizado";
    // AÑADIR ESTA LÍNEA
    await this.actualizarEstadoReproductivoDesdeEvento(this.eventos[index]);
    await this.saveEventsToDatabase();
    this.updateStats();
    this.applyFilters();
    this.generateCalendar();
    await this.showToast(`${evento.tipo} marcado como realizado`, "success");
  }
}

  validateEvento(): boolean {
    return !!(
      this.currentEvento.fecha &&
      this.currentEvento.animalId &&
      this.currentEvento.tipo &&
      this.currentEvento.estado
    );
  }

  getEmptyEvento(): Evento {
    return {
      id: "",
      fecha: "",
      animalId: "",
      animalNombre: "",
      tipo: "Celo",
      estado: "Programado",
      notas: "",
      fechaCreacion: "",
      recordatorio: true,
    };
  }

  getEventColor(tipo: string): string {
    switch (tipo) {
<<<<<<< HEAD
      case "Celo": return "#eb445a";
      case "Vacunación": return "#3880ff";
      case "Inseminación": return "#2dd36f";
      case "Secado": return "#ff6b35";
      case "Reto": return "#9c27b0";
      case "Test Preñez": return "#00bcd4";
      case "Revisión": return "#ff9800";
=======
      case "Celo": return "#FEF08A";
      case "Vacunación": return "#BFDBFE";
      case "Inseminación": return "#BBF7D0";
      case "Parto": return "#EE4057";
      case "Secado": return "#340a47ff";
      case "Reto": return "#a94fb9ff";
      case "Test Preñez": return "#00bcd4";
      case "Revisión": return "#eeb155ff";
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f
      default: return "#92949c";
    }
  }

  getEventIcon(tipo: string): string {
    switch (tipo) {
      case "Celo": return "heart-outline";
      case "Vacunación": return "medical-outline";
      case "Inseminación": return "flower-outline";
      case "Parto": return "person-outline";
      default: return "time-outline";
    }
  }

  getStatusColor(estado: string): string {
    switch (estado) {
      case "Realizado": return "success";
      case "Programado": return "primary";
      case "Pendiente": return "warning";
      case "Alerta": return "danger";
      default: return "medium";
    }
  }

 

  // Métodos para protocolos (agregar estos también)
  private async generarEventosProtocoloParto(animal: Animal, fechaParto: string) {
    console.log("📋 Generando protocolo completo de parto para:", animal.nombre)

    const fechaPartoDate = new Date(fechaParto + "T12:00:00")

    // Día 7: Revisión post-parto
    this.crearEventoProtocolo(
      animal,
      7,
      "Revisión",
      "Revisión post-parto - Verificar involución uterina y estado general",
      "Programado",
      fechaPartoDate,
    )

    // Día 26: Primer celo (Amarillo) - Celo de limpieza
    this.crearEventoProtocolo(
      animal,
      26,
      "Celo",
      "Primer celo post-parto (Amarillo) - Celo de limpieza, NO SERVIR",
      "Programado",
      fechaPartoDate,
    )

    // Día 52: Segundo celo (Verde) - Apto para servicio
    this.crearEventoProtocolo(
      animal,
      52,
      "Celo",
      "Segundo celo post-parto (Verde) - APTO PARA SERVICIO",
      "Programado",
      fechaPartoDate,
    )

    // Día 85: Diagnóstico de vacía
    this.crearEventoProtocolo(
      animal,
      85,
      "Revisión",
      "Diagnóstico de vacía - Verificar si quedó preñada o está vacía",
      "Programado",
      fechaPartoDate,
    )

    console.log("✅ Protocolo de parto generado: 4 eventos programados")
  }

  private calcularProximoCelo(animal: Animal, fechaCelo: string) {
    const fechaCeloDate = new Date(fechaCelo + "T12:00:00")
    fechaCeloDate.setDate(fechaCeloDate.getDate() + 21)

    const proximoCelo: Evento = {
      id: `celo-auto-${Date.now()}`,
      fecha: this.getLocalDateString(fechaCeloDate),
      animalId: animal.id,
      animalNombre: animal.nombre,
      tipo: "Celo",
      estado: "Programado",
      notas: "Próximo celo estimado (calculado automáticamente cada 21 días)",
      fechaCreacion: this.getLocalDateString(new Date()),
      recordatorio: true,
    }

    this.eventos.push(proximoCelo)
    console.log(`📅 Próximo celo calculado para ${animal.nombre}: ${this.getLocalDateString(fechaCeloDate)}`)
  }
  
private async verificarYActualizarSecado() {
    const hoy = new Date()

    for (const animal of this.animalsHembras) {
      // Buscar última inseminación o monta natural
      const ultimaReproduccion = this.eventos
        .filter(
          (e) =>
            e.animalId === animal.id && (e.tipo === "Inseminación" || e.tipo === "Celo") && e.estado === "Realizado",
        )
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]

      if (ultimaReproduccion) {
        const fechaReproduccion = new Date(ultimaReproduccion.fecha + "T12:00:00")
        const diasTranscurridos = Math.floor((hoy.getTime() - fechaReproduccion.getTime()) / (1000 * 60 * 60 * 24))

        // Si han pasado 220 días, actualizar a "Secar"
        if (diasTranscurridos >= 220 && animal.estadoReproductivo !== "Seca") {
          animal.estadoReproductivo = "Seca"

          // Crear evento de secado si no existe
          const eventoSecadoExiste = this.eventos.some(
            (e) => e.animalId === animal.id && e.tipo === "Secado" && e.fecha === this.getLocalDateString(hoy),
          )

          if (!eventoSecadoExiste) {
            const eventoSecado: Evento = {
              id: `secado-auto-${Date.now()}-${animal.id}`,
              fecha: this.getLocalDateString(hoy),
              animalId: animal.id,
              animalNombre: animal.nombre,
              tipo: "Secado",
              estado: "Realizado",
              notas: "Secado automático a los 220 días post-reproducción",
              fechaCreacion: this.getLocalDateString(new Date()),
            }

            this.eventos.push(eventoSecado)
            console.log(`🔄 Estado actualizado a "Seca" para ${animal.nombre} (220 días)`)
          }
        }
      }
    }

    await this.saveEventsToDatabase()
  }


  private async generarEventosPostReproduccion(animal: Animal, fechaReproduccion: string) {
    console.log("📋 Generando protocolo post-reproducción para:", animal.nombre, "Raza:", animal.raza)

    const fechaReproDate = new Date(fechaReproduccion + "T12:00:00")
    
    // Obtener días de gestación según la raza del animal
    const diasGestacion = this.getDiasGestacionPorRaza(animal.raza || "Angus")
    
    console.log(`📊 Días de gestación para ${animal.raza}: ${diasGestacion} días`)

    // 21 días: Próximo celo estimado (si no quedó preñada)
    this.crearEventoProtocolo(
      animal,
      21,
      "Celo",
      "Próximo celo estimado - Verificar si repite celo (no quedó preñada)",
      "Programado",
      fechaReproDate,
    )

    // 35 días: Test de preñez 1 (temprano)
    this.crearEventoProtocolo(
      animal,
      35,
      "Test Preñez",
      "Test de preñez 1 - Diagnóstico temprano por ultrasonido",
      "Programado",
      fechaReproDate,
    )

    // 60 días: Test de preñez 2 (confirmación por palpación)
    this.crearEventoProtocolo(
      animal,
      60,
      "Test Preñez",
      "Test de preñez 2 - Confirmación por palpación rectal",
      "Programado",
      fechaReproDate,
    )

    // 90 días: Test de preñez 3 (seguimiento avanzado)
    this.crearEventoProtocolo(
      animal,
      90,
      "Test Preñez",
      "Test de preñez 3 - Seguimiento de gestación avanzada",
      "Programado",
      fechaReproDate,
    )

    // 120 días: Control de desarrollo fetal
    this.crearEventoProtocolo(
      animal,
      120,
      "Revisión",
      "Control de desarrollo fetal - Verificar crecimiento y salud",
      "Programado",
      fechaReproDate,
    )

    // 150 días: Seguimiento nutricional
    this.crearEventoProtocolo(
      animal,
      150,
      "Revisión",
      "Seguimiento nutricional - Ajustar alimentación para gestación",
      "Programado",
      fechaReproDate,
    )

    // 180 días: Control de condición corporal
    this.crearEventoProtocolo(
      animal,
      180,
      "Revisión",
      "Control de condición corporal - Evaluar estado de gestación",
      "Programado",
      fechaReproDate,
    )

    // Secado (preparación para parto) - 45-60 días antes del parto
    const diasSecado = diasGestacion - 60;
    this.crearEventoProtocolo(
      animal,
      diasSecado,
      "Secado",
      `Secado - Suspender ordeño, preparación para parto (${diasSecado} días post-inseminación)`,
      "Programado",
      fechaReproDate,
    )

    // Reto (próxima a parir) - 21 días antes del parto
    const diasReto = diasGestacion - 21;
    this.crearEventoProtocolo(
      animal,
      diasReto,
      "Reto",
      `Reto - Vaca próxima a parir, aumentar alimentación y cuidados (${diasReto} días post-inseminación)`,
      "Programado",
      fechaReproDate,
    )

    // Preparación final - 7 días antes del parto
    const diasPreparacion = diasGestacion - 7;
    this.crearEventoProtocolo(
      animal,
      diasPreparacion,
      "Revisión",
      `Preparación final - Área de parto, signos de parto inminente (${diasPreparacion} días post-inseminación)`,
      "Programado",
      fechaReproDate,
    )

    // Parto estimado (según raza específica)
    this.crearEventoProtocolo(
      animal,
      diasGestacion,
      "Parto",
      `Parto estimado - Gestación de ${diasGestacion} días (${animal.raza || "Angus"}) - ${this.getDescripcionRaza(animal.raza)}`,
      "Programado",
      fechaReproDate,
    )

    // Post-parto inmediato (1 día después del parto estimado)
    this.crearEventoProtocolo(
      animal,
      diasGestacion + 1,
      "Revisión",
      "Revisión post-parto inmediata - Verificar salud de madre y cría",
      "Programado",
      fechaReproDate,
    )

    // Primer celo post-parto (45 días después del parto)
    this.crearEventoProtocolo(
      animal,
      diasGestacion + 45,
      "Celo",
      "Primer celo post-parto estimado - Inicio nuevo ciclo reproductivo",
      "Programado",
      fechaReproDate,
    )

    console.log(`✅ Protocolo post-reproducción generado para ${animal.raza}: ${diasGestacion} días de gestación - 13 eventos programados`)
}

// Método auxiliar para obtener descripción de la raza
private getDescripcionRaza(raza: string | undefined): string {
  const descripciones: { [key: string]: string } = {
    'Brahman': '🐂 Raza resistente al calor, zonas tropicales',
    'Suizo': '🐂 Alta producción lechera y gran fortaleza física',
    'Indubrasil': '🐄 Raza zebuina resistente al clima cálido',
    'Guzerat': '🐂 Raza india longeva, buena conversión alimenticia',
    'Angus': 'Raza carnicera de alta calidad',
    'Holstein': 'Raza lechera de alta producción',
    'Jersey': 'Raza lechera de alto contenido graso',
    'Hereford': 'Raza carnicera rustica',
    'Charoláis': 'Excelente calidad de carne y crecimiento rápido',
    'Simental': 'Raza doble propósito (carne y leche)'
  };
  
  return descripciones[raza || 'Angus'] || 'Raza bovina';
}

private getDiasGestacionPorRaza(raza: string): number {
  const diasGestacion: { [key: string]: number } = {
    'Angus': 283,
    'Holstein': 279,
    'Jersey': 279,
    'Hereford': 285,
    'Charoláis': 286, // Corregido según tu documento: 286 días
    'Simental': 289,  // Corregido según tu documento: 289 días
    'Brahman': 282,   // 🐂 282 días - resistente al calor
    'Suizo': 290,     // 🐂 290 días - alta producción lechera  
    'Indubrasil': 280, // 🐄 280 días - zebuina resistente
    'Guzerat': 291     // 🐂 291 días - longeva y fuerte
  };
  
  const dias = diasGestacion[raza] || 283;
  console.log(`📅 Raza: ${raza} - Gestación: ${dias} días`);
  return dias;
}

  private crearEventoProtocolo(
    animal: Animal,
    diasDespues: number,
    tipo: Evento["tipo"],
    notas: string,
    estado: Evento["estado"] = "Programado",
    fechaBase?: Date,
  ) {
    const fecha = fechaBase ? new Date(fechaBase) : new Date()
    fecha.setDate(fecha.getDate() + diasDespues)

    const evento: Evento = {
      id: `protocolo-${tipo.toLowerCase()}-${Date.now()}-${Math.random()}`,
      fecha: this.getLocalDateString(fecha),
      animalId: animal.id,
      animalNombre: animal.nombre,
      tipo: tipo,
      estado: estado,
      notas: notas,
      fechaCreacion: this.getLocalDateString(new Date()),
      protocoloParto: true,
      diasPostParto: diasDespues,
    }

    this.eventos.push(evento)
    console.log(`📝 Evento creado: ${tipo} para ${animal.nombre} en ${diasDespues} días`)
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: "top",
    });
    await toast.present();
  }

  // En Tab3Page - método para determinar estado automáticamente
private determinarEstadoAutomatico(animal: Animal, evento: Evento): string {
  const hoy = new Date();
  const fechaEvento = new Date(evento.fecha + 'T12:00:00');
  const diasDiferencia = Math.floor((hoy.getTime() - fechaEvento.getTime()) / (1000 * 60 * 60 * 24));

  switch (evento.tipo) {
    case 'Parto':
      if (diasDiferencia <= 7) return 'Limpia';
      if (diasDiferencia <= 26) return 'Sucia';
      if (diasDiferencia <= 52) return 'A calor';
      return 'Vacia';

    case 'Inseminación':
      if (diasDiferencia < 35) return 'Sucia';
      if (diasDiferencia >= 35 && diasDiferencia < 90) {
        // Después del primer test de preñez
        return evento.notas?.toLowerCase().includes('positivo') ? 'Prefiada' : 'Vacia';
      }
      return 'Vacia';

    default:
      return animal.estadoReproductivo || 'Limpia';
  }
}



}

export default Tab3Page;
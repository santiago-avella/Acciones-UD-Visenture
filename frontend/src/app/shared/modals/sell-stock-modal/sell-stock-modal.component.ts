import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SellsService } from '../../../services/sells.service';
import { SellOrder } from '../../../models/sell.model';
import { Order } from '../../../models/order.model';
import { Stock } from '../../../models/portfolio.model';

export interface SellStockDialogData {
  stock: Stock;
  price?: number;
  action?: 'sell';
  clientId?: number;
}

@Component({
  selector: 'app-sell-stock-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule
  ],  templateUrl: './sell-stock-modal.component.html',
  styleUrls: ['./sell-stock-modal.component.css']
})
export class SellStockModalComponent implements OnInit {
  sellForm: FormGroup;
  
  sellOrderTypes = [
    { value: 'market', label: 'Mercado', description: 'Ejecutar la orden inmediatamente al precio de mercado actual' },
    { value: 'limit', label: 'Límite', description: 'Ejecutar la orden cuando el precio alcance o supere el valor especificado' },
    { value: 'stop', label: 'Stop Loss', description: 'Vender cuando el precio caiga por debajo del valor especificado para limitar pérdidas' }
  ];
  
  timeInForceOptions = [
    { value: 'day', label: 'Día', description: 'Válida solo durante el día actual de mercado' },
    { value: 'gtc', label: 'GTC', description: 'Good Till Canceled - Válida hasta que se cancele explícitamente' },
    { value: 'ioc', label: 'IOC', description: 'Immediate or Cancel - Ejecutar inmediatamente o cancelar' }
  ];
  
  maxQuantity: number;
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  operationResult: Order | null = null;
  
  constructor(
    private fb: FormBuilder,
    private sellsService: SellsService,
    public dialogRef: MatDialogRef<SellStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SellStockDialogData
  ) {
    this.maxQuantity = data.stock.quantity;
    
    // Inicializar el formulario
    this.sellForm = this.fb.group({
      quantity: [1, [
        Validators.required, 
        Validators.min(1), 
        Validators.max(this.maxQuantity)
      ]],
      orderType: ['market', Validators.required],
      limitPrice: [{ value: data.price || data.stock.unitValue, disabled: true }],
      timeInForce: ['day'], // Vigencia de la orden (por defecto 'day')
      extendedHours: [false] // Operación fuera de horario regular
    });
    
    // Suscribirnos a cambios en el campo de cantidad para validación en tiempo real
    this.sellForm.get('quantity')?.valueChanges.subscribe(() => {
      this.validateQuantity();
    });
      // Actualizar validators según cambie el tipo de orden
    this.sellForm.get('orderType')?.valueChanges.subscribe(orderType => {
      const limitPriceControl = this.sellForm.get('limitPrice');
      if (!limitPriceControl) return;
      
      if (orderType === 'market') {
        limitPriceControl.disable();
        limitPriceControl.clearValidators();
        limitPriceControl.updateValueAndValidity();
      } else {
        // Para órdenes no de mercado, necesitamos el precio límite
        limitPriceControl.enable();
        limitPriceControl.setValidators([Validators.required, Validators.min(0.01)]);
        limitPriceControl.updateValueAndValidity();
        
        // Actualizar la sugerencia de precio límite según el tipo de orden
        this.updatePrices();
        
        // Asegurarse de que el valor sea numérico
        const currentValue = limitPriceControl.value;
        if (currentValue === null || currentValue === undefined || isNaN(parseFloat(currentValue))) {
          // Si el valor actual no es válido, establecer un valor predeterminado
          const defaultPrice = this.data.price || this.data.stock.unitValue || 100;
          limitPriceControl.setValue(defaultPrice);
        }
      }
    });
  }

  ngOnInit(): void {
    // Establecemos el precio de mercado actual
    if (!this.data.price) {
      this.data.price = this.data.stock.unitValue;
    }
  }
  
  // Calcular el valor total de la venta
  get totalValue(): number {
    const quantity = this.sellForm.get('quantity')?.value || 0;
    return quantity * this.data.price!;
  }
  
  // Calcular comisión (simulada 0.5%)
  get estimatedFee(): number {
    return this.totalValue * 0.005;
  }
  
  // Calcular monto neto estimado
  get estimatedNet(): number {
    return this.totalValue - this.estimatedFee;
  }
  /**
   * Validación personalizada para la cantidad de acciones a vender
   * Realiza validaciones avanzadas en tiempo real y muestra mensajes apropiados
   */
  validateQuantity(): void {
    const quantityControl = this.sellForm.get('quantity');
    if (!quantityControl) return;
    
    const currentValue = quantityControl.value;
    
    // Verificar si el valor es válido
    if (currentValue === null || currentValue === undefined || currentValue <= 0) {
      // Usamos setValidators en lugar de setErrors para mantener consistencia con Angular
      quantityControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(this.maxQuantity)
      ]);
      quantityControl.updateValueAndValidity();
    } else if (currentValue > this.maxQuantity) {
      // Aplicamos validadores y actualizamos para que Angular maneje el error
      quantityControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(this.maxQuantity)
      ]);
      quantityControl.updateValueAndValidity();
      
      // Mostrar advertencia si está intentando vender más de lo disponible
      const diff = currentValue - this.maxQuantity;
      this.error = `No dispone de suficientes acciones. Está intentando vender ${diff} acciones más de las que posee.`;
      
      // Borrar el error después de 3 segundos
      setTimeout(() => {
        if (this.error && this.error.includes('No dispone de suficientes acciones')) {
          this.error = null;
        }
      }, 3000);
    } else {
      // Cuando el valor es válido, mantenemos los validadores pero limpiamos errores
      quantityControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(this.maxQuantity)
      ]);
      quantityControl.updateValueAndValidity();
      
      // Limpiar mensajes de error relacionados
      if (this.error && this.error.includes('No dispone de suficientes acciones')) {
        this.error = null;
      }
      
      // Si no hay errores de validación, actualizar los cálculos
      this.updatePrices();
    }
  }
  /**
   * Actualiza los precios sugeridos según el tipo de orden
   * También actualiza los cálculos de valor total y comisiones
   */
  updatePrices(): void {
    // La lógica se maneja automáticamente con los getters
    const orderType = this.sellForm.get('orderType')?.value;
    const limitPriceControl = this.sellForm.get('limitPrice');
    
    // Si es una orden que no es de mercado, sugerimos un precio límite adecuado
    if (orderType !== 'market' && limitPriceControl) {
      const currentPrice = this.data.price || this.data.stock.unitValue || 0;
      
      if (currentPrice <= 0) {
        console.warn('Precio actual no válido:', currentPrice);
        return; // Evitar calcular con precios no válidos
      }
      
      try {
        // Sugerencia de precios según el tipo de orden
        if (orderType === 'limit') {
          // Para límite, sugerimos un precio ligeramente mejor que el mercado (+2%)
          const limitPrice = parseFloat((currentPrice * 1.02).toFixed(2));
          limitPriceControl.setValue(limitPrice);
        } else if (orderType === 'stop') {
          // Para stop loss, sugerimos un precio ligeramente inferior (-5%)
          const stopLossPrice = parseFloat((currentPrice * 0.95).toFixed(2));
          limitPriceControl.setValue(stopLossPrice);
        } else if (orderType === 'take-profit') {
          // Para take profit, sugerimos un precio significativamente mejor (+10%)
          const takeProfitPrice = parseFloat((currentPrice * 1.1).toFixed(2));
          limitPriceControl.setValue(takeProfitPrice);
        }
        
        // Validar después de establecer el valor
        limitPriceControl.updateValueAndValidity();
      } catch (error) {
        console.error('Error al actualizar precios sugeridos:', error);
      }
    }
  }
  /**
   * Enviar orden de venta
   * Valida el formulario, verifica disponibilidad y procesa la orden
   */
  submitSellOrder(): void {
    if (this.sellForm.invalid) {
      this.error = 'Por favor, complete correctamente todos los campos del formulario.';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = 'Procesando orden de venta...';

    const formValues = this.sellForm.value;
    const sellOrder: SellOrder = {
      symbol: this.data.stock.symbol,
      qty: formValues.quantity,
      type: formValues.orderType,
      time_in_force: formValues.timeInForce,
    };

    if (formValues.orderType !== 'market') {
      sellOrder.limit_price = formValues.limitPrice;
    }

    this.sellsService.submitSellOrder(sellOrder).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = '¡Orden de venta procesada con éxito!';
          this.operationResult = response.data;
          try {
            const audio = new Audio('/assets/sounds/success.mp3');
            audio.volume = 0.2;
            audio.play().catch(() => {});
          } catch (e) {}
        } else {
          this.error = response.message || 'Error al procesar la orden de venta.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Error de conexión. Por favor, inténtelo de nuevo.';
        console.error('Error en la venta:', err);
      },
    });
  }
  
  // Cancelar y cerrar el diálogo
  cancel(): void {
    this.dialogRef.close();
  }
  
  // Confirmar y cerrar el diálogo con el resultado
  confirm(): void {
    this.dialogRef.close(this.operationResult);
  }
}

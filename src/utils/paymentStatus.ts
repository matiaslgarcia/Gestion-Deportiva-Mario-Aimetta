// src/utils/paymentStatus.ts
export function getPaymentStatusColor(payment_date: string, last_payment?: string): 'green' | 'yellow' | 'red' {
  const scheduled = new Date(payment_date);
  const today = new Date();

  // Si existe last_payment y corresponde al mes y año actuales, consideramos que se actualizó el pago → verde.
  if (last_payment) {
    const last = new Date(last_payment);
    if (last.getMonth() === today.getMonth() && last.getFullYear() === today.getFullYear()) {
      return 'green';
    }
  }
  
  // Si no existe last_payment y estamos en el mes inmediatamente posterior al programado
  // y la fecha programada está entre el 1 y 10, se muestra amarillo.
  if (
    today.getFullYear() === scheduled.getFullYear() &&
    today.getMonth() === scheduled.getMonth() + 1 &&
    scheduled.getDate() >= 1 &&
    scheduled.getDate() <= 10
  ) {
    return 'yellow';
  }

  // En otros casos, se muestra rojo.
  return 'red';
}

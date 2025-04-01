export function getPaymentStatusColor(payment_date: string, last_payment?: string): 'green' | 'yellow' | 'red' {
  const scheduled = new Date(payment_date);
  const today = new Date();

  if (last_payment) {
    const last = new Date(last_payment);
    // Comparar usando UTC para evitar discrepancias de zona horaria
    if (last.getUTCMonth() === today.getUTCMonth() && last.getUTCFullYear() === today.getUTCFullYear()) {
      return 'green';
    }
  }
  
  if (
    today.getUTCFullYear() === scheduled.getUTCFullYear() &&
    today.getUTCMonth() === scheduled.getUTCMonth() + 1 &&
    scheduled.getUTCDate() >= 1 &&
    scheduled.getUTCDate() <= 10
  ) {
    return 'yellow';
  }

  return 'red';
}
import { Handler } from '@netlify/functions'
import { getDbPool } from './_db'

// Lógica de evaluación del estado de pago.
export function getPaymentStatusColor(payment_date: string, last_payment?: string): 'green' | 'yellow' | 'red' {
  const scheduled = new Date(payment_date);
  const today = new Date();

  // Si existe last_payment y corresponde al mes y año actuales, se considera pago actualizado → green.
  if (last_payment) {
    const last = new Date(last_payment);
    if (last.getMonth() === today.getMonth() && last.getFullYear() === today.getFullYear()) {
      return 'green';
    }
  }
  
  // Si no existe last_payment y estamos en el mes inmediatamente posterior al programado
  // y la fecha programada está entre el 1 y 10, se muestra yellow.
  if (
    today.getFullYear() === scheduled.getFullYear() &&
    today.getMonth() === scheduled.getMonth() + 1 &&
    scheduled.getDate() >= 1 &&
    scheduled.getDate() <= 10
  ) {
    return 'yellow';
  }

  // En otros casos, se muestra red.
  return 'red';
}

export const handler: Handler = async () => {
  const pool = getDbPool()

  const result = await pool.query(
    'SELECT id, payment_date, last_payment FROM public.clients WHERE payment_date IS NOT NULL'
  )

  for (const client of result.rows) {
    const status = getPaymentStatusColor(client.payment_date, client.last_payment || undefined)
    await pool.query(
      'UPDATE public.clients SET payment_status = $2 WHERE id = $1 AND payment_status IS DISTINCT FROM $2',
      [client.id, status]
    )
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Evaluación y actualización de estado de pago completada.' })
  }
}

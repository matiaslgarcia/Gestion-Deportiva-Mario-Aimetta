import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

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

export const handler: Handler = async (event, context) => {
  // Conexión a Supabase mediante variables de entorno (asegúrate de configurarlas en Netlify)
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Se consultan todos los clientes de la tabla "clients"
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*');

  if (error) {
    console.error("Error al obtener clientes:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }

  // Se recorre cada cliente y se actualiza su campo payment_status
  if (clients) {
    for (const client of clients) {
      const status = getPaymentStatusColor(client.payment_date, client.last_payment || undefined);
      const { error: updateError } = await supabase
        .from('clients')
        .update({ payment_status: status })
        .eq('id', client.id);

      if (updateError) {
        console.error(`Error actualizando cliente ${client.id}:`, updateError);
      } else {
        console.log(`Cliente ${client.id} actualizado con estado ${status}`);
      }
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Evaluación y actualización de estado de pago completada.' })
  };
}

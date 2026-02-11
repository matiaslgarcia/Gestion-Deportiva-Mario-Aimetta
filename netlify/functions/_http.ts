export function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(body)
  };
}

export function badRequest(message: string) {
  return json(400, { error: message });
}

export function notFound(message = 'No encontrado') {
  return json(404, { error: message });
}

export function methodNotAllowed() {
  return json(405, { error: 'Método no permitido' });
}


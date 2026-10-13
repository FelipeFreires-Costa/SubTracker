const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function validarData(data: string) {
  if (!DATA_REGEX.test(data)) {
    throw new AppError('Data inválida. Use o formato YYYY-MM-DD.');
  }

  const dataObj = new Date(`${data}T00:00:00`);
  if (Number.isNaN(dataObj.getTime())) {
    throw new AppError('Data inválida.');
  }
}

function validarNome(nome: unknown) {
  if (typeof nome !== 'string') {
    throw new AppError('Nome é obrigatório.');
  }

  const nomeLimpo = nome.trim();
  if (nomeLimpo.length < 2 || nomeLimpo.length > 255) {
    throw new AppError('Nome deve ter entre 2 e 255 caracteres.');
  }

  return nomeLimpo;
}

function validarPreco(preco: unknown) {
  const valor = Number(preco);

  if (Number.isNaN(valor) || valor < 0 || valor > 999999.99) {
    throw new AppError('Preço inválido.');
  }

  return valor;
}

function validarCategoria(categoria: unknown) {
  if (categoria === undefined || categoria === null) {
    return 'Outros';
  }

  if (typeof categoria !== 'string') {
    throw new AppError('Categoria inválida.');
  }

  const categoriaLimpa = categoria.trim();
  if (categoriaLimpa.length > 100) {
    throw new AppError('Categoria muito longa.');
  }

  return categoriaLimpa || 'Outros';
}

function validarPago(pago: unknown) {
  if (typeof pago !== 'boolean') {
    throw new AppError('Campo pago deve ser true ou false.');
  }

  return pago;
}

function validarPeriodicidade(
  valor: unknown,
  obrigatorio = false,
): 'mensal' | 'bimestral' | 'anual' | null {
  if (valor === undefined || valor === null || valor === '') {
    if (obrigatorio) return 'mensal' as const;
    return null;
  }

  if (valor === 'mensal' || valor === 'bimestral' || valor === 'anual') {
    return valor;
  }

  throw new AppError('Periodicidade inválida.');
}

export function validarCriarConta(body: unknown) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Dados inválidos.');
  }

  const dados = body as Record<string, unknown>;

  return {
    nome: validarNome(dados.nome),
    preco: validarPreco(dados.preco),
    data: (() => {
      const data = String(dados.data ?? '');
      validarData(data);
      return data;
    })(),
    pago: dados.pago === undefined ? false : validarPago(dados.pago),
    categoria: validarCategoria(dados.categoria),
    periodicidade: validarPeriodicidade(dados.periodicidade, true),
  };
}

export function validarAtualizarConta(body: unknown) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Dados inválidos.');
  }

  const dados = body as Record<string, unknown>;
  const data = String(dados.data ?? '');
  validarData(data);

  return {
    nome: validarNome(dados.nome),
    preco: validarPreco(dados.preco),
    data,
    categoria: validarCategoria(dados.categoria),
    periodicidade: validarPeriodicidade(dados.periodicidade, true),
  };
}

export function validarAtualizarStatus(body: unknown) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Dados inválidos.');
  }

  const dados = body as Record<string, unknown>;

  return {
    pago: validarPago(dados.pago),
  };
}

export function validarIdParam(id: unknown) {
  const contaId = Number(id);

  if (!Number.isInteger(contaId) || contaId <= 0) {
    throw new AppError('ID inválido.', 400);
  }

  return contaId;
}

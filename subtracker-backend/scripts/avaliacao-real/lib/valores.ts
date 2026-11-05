export function parsearValor(bruto: string): number | null {
  const original = bruto.trim();
  if (!original) return null;

  const negativoContabil = /^\(.*\)$/.test(original);
  let texto = original.replace(/[R$\s]/gi, '').replace(/[()]/g, '');
  const negativoSinal = texto.startsWith('-') || texto.endsWith('-') || negativoContabil;
  texto = texto.replace(/^[+-]/, '').replace(/-$/, '');
  if (!texto) return null;

  if (texto.includes(',') && texto.includes('.')) {
    if (texto.lastIndexOf(',') > texto.lastIndexOf('.')) {
      texto = texto.replace(/\./g, '').replace(',', '.');
    } else {
      texto = texto.replace(/,/g, '');
    }
  } else if (texto.includes(',')) {
    const partes = texto.split(',');
    texto = partes.length === 2 && (partes[1]?.length ?? 0) <= 2
      ? texto.replace(',', '.')
      : texto.replace(/,/g, '');
  }

  const numero = Number(texto);
  if (!Number.isFinite(numero)) return null;
  return negativoSinal ? -Math.abs(numero) : numero;
}

export function parsearData(bruto: string): string | null {
  const texto = bruto.trim();
  if (!texto) return null;

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const compacto = texto.match(/^(\d{4})(\d{2})(\d{2})(?:\d{6,})?$/);
  if (compacto) return validarIso(compacto[1] as string, compacto[2] as string, compacto[3] as string);

  const br = texto.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (br) {
    const ano = (br[3] as string).length === 2 ? `20${br[3]}` : (br[3] as string);
    return validarIso(ano, (br[2] as string).padStart(2, '0'), (br[1] as string).padStart(2, '0'));
  }

  const serial = Number(texto.replace(',', '.'));
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    return excelSerialParaIso(serial);
  }

  return null;
}

function validarIso(ano: string, mes: string, dia: string): string | null {
  const y = Number(ano);
  const m = Number(mes);
  const d = Number(dia);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  const data = new Date(y, m - 1, d);
  if (data.getFullYear() !== y || data.getMonth() !== m - 1 || data.getDate() !== d) return null;
  return `${ano}-${mes}-${dia}`;
}

export function excelSerialParaIso(serial: number): string {
  const dias = Math.floor(serial);
  const base = Date.UTC(1899, 11, 30);
  const data = new Date(base + dias * 86400000);
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(data.getUTCDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function formatarValorCsv(valor: number): string {
  return valor.toFixed(2);
}

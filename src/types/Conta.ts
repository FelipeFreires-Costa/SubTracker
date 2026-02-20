import { useState } from "react";

export interface Conta {
  id: number;
  nome: string;
  preco: number;
  data: string;
  pago: boolean;
  categoria: string;
}

const [contas, setContas] = useState<Conta[]>([]);
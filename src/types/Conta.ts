import { useState } from "react";

export interface Conta {
  id: number;
  nome: string;
  preco: number;
  data: string;
  pago: boolean;
}

const [contas, setContas] = useState<Conta[]>([]);
import type { ReactNode } from 'react';
import {
  MdBolt,
  MdDirectionsCar,
  MdFitnessCenter,
  MdHome,
  MdLaptopMac,
  MdLocalMovies,
  MdMusicNote,
  MdRestaurant,
  MdSecurity,
  MdShoppingBag,
  MdSportsEsports,
  MdTag,
  MdTv,
  MdWifi,
} from 'react-icons/md';

/** Ícone por categoria/nome — sem emoji; MD tem viewBox quadrado (centraliza no chip). */
export function iconeDaConta(categoria?: string | null, nome?: string | null, tamanho = 16): ReactNode {
  const texto = `${categoria || ''} ${nome || ''}`.toLowerCase();
  const props = { size: tamanho, 'aria-hidden': true as const };

  if (
    /aluguel|condo|moradia|casa|apto|apart|luz|enel|cemig|light|energia|electric|water|gas|utilities|saneamento/.test(
      texto,
    )
  ) {
    if (/luz|enel|cemig|light|energia|electric|bolt/.test(texto)) {
      return <MdBolt {...props} />;
    }
    return <MdHome {...props} />;
  }

  if (/stream|netflix|disney|hbo|prime|youtube|tv|filme|video/.test(texto)) {
    return <MdTv {...props} />;
  }

  if (/spotify|music|deezer|apple music/.test(texto)) {
    return <MdMusicNote {...props} />;
  }

  if (/comida|food|ifood|rappi|restaurante|alimenta/.test(texto)) {
    return <MdRestaurant {...props} />;
  }

  if (/vivo|claro|tim|fibra|internet|telecom|wifi|telefone/.test(texto)) {
    return <MdWifi {...props} />;
  }

  if (/academia|smart ?fit|gym|body tech|sports/.test(texto)) {
    return <MdFitnessCenter {...props} />;
  }

  if (/seguro|insurance|porto/.test(texto)) {
    return <MdSecurity {...props} />;
  }

  if (/uber|99|transporte|metro|car|auto/.test(texto)) {
    return <MdDirectionsCar {...props} />;
  }

  if (/game|xbox|playstation|steam|roblox/.test(texto)) {
    return <MdSportsEsports {...props} />;
  }

  if (/shop|amazon|magazine|mercado|compra/.test(texto)) {
    return <MdShoppingBag {...props} />;
  }

  if (/openai|chatgpt|cursor|adobe|software|saas|cloud|github|ai /.test(texto)) {
    return <MdLaptopMac {...props} />;
  }

  if (/subscription|assinatura|outros/.test(texto)) {
    return <MdLocalMovies {...props} />;
  }

  return <MdTag {...props} />;
}

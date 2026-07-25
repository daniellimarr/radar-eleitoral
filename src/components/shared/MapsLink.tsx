import { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MapsLinkProps {
  /** Endereço em texto livre (rua, número, bairro, cidade - UF, CEP). */
  address: string | null | undefined;
  className?: string;
  title?: string;
  children: ReactNode;
}

/** Monta a URL de busca universal do Google Maps a partir de um endereço livre. */
export function buildMapsUrl(address: string): string {
  // Remove ruídos comuns que atrapalham a geocodificação (espaços duplos, vírgulas soltas).
  const cleaned = address
    .replace(/\s{2,}/g, " ")
    .replace(/\s*,\s*,+/g, ", ")
    .replace(/^[\s,]+|[\s,]+$/g, "");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleaned)}`;
}

/**
 * Link de localização seguro para uso dentro de iframes (preview do Lovable).
 * Abre o Google Maps em uma nova aba via window.open, pois o Google recusa
 * ser carregado dentro de um iframe (ERR_BLOCKED_BY_RESPONSE / X-Frame-Options).
 */
export function MapsLink({ address, className, title, children }: MapsLinkProps) {
  if (!address || !address.trim()) return null;

  const url = buildMapsUrl(address);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Impede que o iframe tente navegar para o Google (bloqueado pelo servidor).
    event.preventDefault();
    event.stopPropagation();
    try {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      // Se o popup for bloqueado, navega a janela de topo como último recurso.
      if (!opened) {
        window.top?.location.assign(url);
      }
    } catch {
      window.location.assign(url);
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      onClick={handleClick}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </a>
  );
}

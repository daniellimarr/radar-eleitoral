import { MessageCircle } from "lucide-react";

interface WhatsAppLinkProps {
  phone?: string | null;
  className?: string;
}

/**
 * Renders a phone number as a clickable WhatsApp link (green) with icon.
 * Strips non-digits and prepends country code 55 (Brasil) when missing.
 */
export function WhatsAppLink({ phone, className }: WhatsAppLinkProps) {
  if (!phone) return <span className="text-muted-foreground">-</span>;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return <span className="text-muted-foreground">{phone}</span>;

  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const href = `https://wa.me/${withCountry}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 hover:underline font-medium ${className ?? ""}`}
      aria-label={`Enviar mensagem WhatsApp para ${phone}`}
    >
      <MessageCircle className="h-4 w-4" />
      <span>{phone}</span>
    </a>
  );
}

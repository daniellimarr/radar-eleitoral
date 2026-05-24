import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Contact } from "@/types";

interface ContactTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export function ContactTable({ contacts, onEdit, onDelete }: ContactTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome/Apelido</TableHead>
          <TableHead>Celular</TableHead>
          <TableHead>Envolvimento</TableHead>
          <TableHead>Bairro</TableHead>
          <TableHead className="w-24">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              Nenhum contato encontrado
            </TableCell>
          </TableRow>
        ) : (
          contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>
                <div className="font-medium">{contact.name}</div>
                {contact.nickname && <div className="text-xs text-muted-foreground">{contact.nickname}</div>}
              </TableCell>
              <TableCell>{contact.phone}</TableCell>
              <TableCell className="capitalize">{contact.engagement?.replace("_", " ")}</TableCell>
              <TableCell>{contact.neighborhood}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => onEdit(contact)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(contact.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

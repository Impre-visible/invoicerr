import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Eye, Mail, MapPin, MoreHorizontal, Phone, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Client } from "@/types"

interface ClientListProps {
    clients: Client[] | undefined
    onView: (client: Client) => void
    onEdit: (client: Client) => void
    onDelete: (client: Client) => void
}

export function ClientList({ clients, onView, onEdit, onDelete }: ClientListProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {clients?.map((client) => (
                    <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                            {client.contactFirstname} {client.contactLastname}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center">
                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                {client.contactEmail}
                            </div>
                        </TableCell>
                        <TableCell>
                            {client.contactPhone && (
                                <div className="flex items-center">
                                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {client.contactPhone}
                                </div>
                            )}
                        </TableCell>
                        <TableCell>
                            {client.city && (
                                <div className="flex items-center">
                                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {client.city}
                                    {client.country && `, ${client.country}`}
                                </div>
                            )}
                        </TableCell>
                        <TableCell>
                            <Badge variant={client.isActive !== false ? "default" : "secondary"}>
                                {client.isActive !== false ? "Active" : "Inactive"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onView(client)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit(client)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete(client)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

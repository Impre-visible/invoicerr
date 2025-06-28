import { Building2, Edit, Eye, Mail, MapPin, Phone, Plus, Search, Trash2, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import BetterPagination from "@/components/pagination"
import { Button } from "@/components/ui/button"
import type { Client } from "@/types"
import { ClientCreate } from "./_components/client-create"
import { ClientDeleteDialog } from "./_components/client-delete"
import { ClientEdit } from "./_components/client-edit"
import { ClientViewDialog } from "./_components/client-view"
import { Input } from "@/components/ui/input"
import { useGet } from "@/lib/utils"
import { useState } from "react"

export default function Clients() {
    const [page, setPage] = useState(1)

    const { data: clients, mutate, loading } = useGet<{ pageCount: number, clients: Client[] }>(`/api/clients?page=${page}`)

    const [createClientDialog, setCreateClientDialog] = useState<boolean>(false)
    const [editClientDialog, setEditClientDialog] = useState<Client | null>(null)
    const [viewClientDialog, setViewClientDialog] = useState<Client | null>(null)
    const [deleteClientDialog, setDeleteClientDialog] = useState<Client | null>(null)


    const [searchTerm, setSearchTerm] = useState("")

    const filteredClients = clients?.clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactFirstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactLastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    function handleAddClick() {
        setCreateClientDialog(true)
    }

    function handleEdit(client: Client) {
        setEditClientDialog(client)
    }

    function handleView(client: Client) {
        setViewClientDialog(client)
    }

    function handleDelete(client: Client) {
        setDeleteClientDialog(client)
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-0 lg:justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-sm text-primary">Manage your clients</div>
                        <div className="font-medium text-foreground">
                            {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
                            {searchTerm && ` trouvé${filteredClients.length > 1 ? 's' : ''}`}
                        </div>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-4 w-full lg:w-fit lg:gap-6 lg:justify-between">
                    <div className="relative w-full lg:w-fit">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>

                    <Button
                        onClick={handleAddClick}
                    >
                        <Plus className="h-4 w-4 mr-0 md:mr-2" />
                        <span className="hidden md:inline-flex">
                            Add New Client
                        </span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">{clients?.clients.length || 0}</p>
                                <p className="text-sm text-primary">Total Clients</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">
                                    {clients?.clients.filter(c => c.isActive).length || 0}
                                </p>
                                <p className="text-sm text-primary">Active Clients</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">
                                    {clients?.clients.filter(c => !c.isActive).length || 0}
                                </p>
                                <p className="text-sm text-primary">Inactive Clients</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="gap-0">
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 " />
                        <span>Clients</span>
                    </CardTitle>
                    <CardDescription>Manage your clients, view details, edit or delete them.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                    {!loading && filteredClients.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-foreground">
                                {searchTerm ? 'No clients found' : 'No clients added yet'}
                            </h3>
                            <p className="mt-1 text-sm text-primary">
                                {searchTerm
                                    ? 'Try a different search term'
                                    : 'Start adding clients to manage your business effectively.'
                                }
                            </p>
                            {!searchTerm && (
                                <div className="mt-6">
                                    <Button onClick={handleAddClick}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add New Client
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredClients.map((client, index) => (
                                <div key={index} className="p-4 sm:p-6">
                                    <div className="flex flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex flex-row items-center gap-4 w-full">
                                            <div className="p-2 bg-blue-100 rounded-lg mb-4 md:mb-0 w-fit h-fit">
                                                <Building2 className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-medium text-foreground break-words">{client.name}</h3>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${client.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                            } w-fit`}
                                                    >
                                                        {client.isActive ? 'Actif' : 'Inactif'}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex flex-col lg:flex-row flex-wrap gap-2 text-sm text-primary">
                                                    <div className="flex items-center space-x-1">
                                                        <Mail className="h-4 w-4" />
                                                        <span>{client.contactEmail}</span>
                                                    </div>
                                                    {client.contactPhone && (
                                                        <div className="flex items-center space-x-1">
                                                            <Phone className="h-4 w-4" />
                                                            <span>{client.contactPhone}</span>
                                                        </div>
                                                    )}
                                                    {client.city && (
                                                        <div className="flex items-center space-x-1">
                                                            <MapPin className="h-4 w-4" />
                                                            <span>{client.city}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-0 w-fit flex flex-col lg:flex-row space-x-2 justify-center items-center lg:justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleView(client)}
                                                className="text-gray-600 hover:text-blue-600 mr-2"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(client)}
                                                className="text-gray-600 hover:text-green-600 mr-2"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(client)}
                                                className="text-gray-600 hover:text-red-600 mr-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    )}
                </CardContent>
                <CardFooter>
                    {!loading && filteredClients.length > 0 && (
                        <BetterPagination pageCount={clients?.pageCount || 1} page={page} setPage={setPage} />
                    )}
                </CardFooter>
            </Card>

            <ClientCreate
                open={createClientDialog}
                onOpenChange={(open) => { setCreateClientDialog(open); mutate() }}
            />

            <ClientEdit
                client={editClientDialog}
                onOpenChange={(open) => { if (!open) setEditClientDialog(null); mutate() }}
            />

            <ClientViewDialog
                client={viewClientDialog}
                onOpenChange={(open) => { if (!open) setViewClientDialog(null) }}
            />

            <ClientDeleteDialog
                client={deleteClientDialog}
                onOpenChange={(open) => { if (!open) setDeleteClientDialog(null); mutate() }}
            />

        </div>
    )
}
import type { Client } from "@/types"
import { ClientDeleteDialog } from "./_components/client-delete"
import { ClientForm } from "./_components/client-form"
import { ClientList } from "./_components/client-list"
import { ClientViewDialog } from "./_components/client-view"
import { useForm } from "react-hook-form"
import { useState } from "react"

export function Clients() {
    const [clients, setClients] = useState<Client[]>([])
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editClient, setEditClient] = useState<Client | null>(null)
    const [formOpen, setFormOpen] = useState(false)

    const form = useForm<Client>({
        defaultValues: {
            name: "",
            contactFirstname: "",
            contactLastname: "",
            contactEmail: "",
            contactPhone: "",
            address: "",
            postalCode: "",
            city: "",
            country: "",
            isActive: true,
        },
    })

    function handleAddClick() {
        form.reset()
        setEditClient(null)
        setFormOpen(true)
    }

    function handleFormSubmit(data: Client) {
        if (editClient) {
            // update existing client
            setClients((prev) =>
                prev.map((c) => (c.id === editClient.id ? { ...c, ...data } : c))
            )
        } else {
            // add new client
            const newClient = { ...data, id: Date.now().toString() }
            setClients((prev) => [...prev, newClient])
        }
        setFormOpen(false)
    }

    function handleEdit(client: Client) {
        setEditClient(client)
        form.reset(client)
        setFormOpen(true)
    }

    function handleView(client: Client) {
        setSelectedClient(client)
        setViewDialogOpen(true)
    }

    function handleDelete(client: Client) {
        setSelectedClient(client)
        setDeleteDialogOpen(true)
    }

    function confirmDelete() {
        if (selectedClient) {
            setClients((prev) => prev.filter((c) => c.id !== selectedClient.id))
            setSelectedClient(null)
        }
    }

    return (
        <div>
            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Clients</h1>
                <button
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    onClick={handleAddClick}
                >
                    Add Client
                </button>
            </div>

            <ClientList clients={clients} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />

            {formOpen && (
                <ClientForm
                    form={form}
                    onSubmit={handleFormSubmit}
                    submitText={editClient ? "Update" : "Create"}
                    onCancel={() => setFormOpen(false)}
                />
            )}

            <ClientViewDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen} client={selectedClient} />

            <ClientDeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} />
        </div>
    )
}

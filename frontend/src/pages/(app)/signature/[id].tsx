import { useParams } from "react-router"

export default function Settings() {
    const { id } = useParams()


    return (
        <div className="max-w-7xl mx-auto space-y-6 px-6">
            <h1>TEST {id}</h1>
        </div>
    )
}

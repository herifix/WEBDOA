import { useEffect, useState } from "react";
import { buildApiUrl } from "../../config/appConfig";

interface Report {
    id: string | number;
    name: string;
}

export default function ReportsPage() {
    const [items, setItems] = useState<Report[]>([]);

    useEffect(() => {
        fetch(buildApiUrl("/api/Reports"))
            .then(r => r.json())
            .then(setItems);
    }, []);

    return (
        <ul>
            {items.map((x: Report) => <li key={x.id}>{x.name}</li>)}
        </ul>
    );
}

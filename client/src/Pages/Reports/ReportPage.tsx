import { useEffect, useState } from "react";

interface Report {
    id: string | number;
    name: string;
}

export default function ReportsPage() {
    const [items, setItems] = useState<Report[]>([]);

    useEffect(() => {
        fetch("https://localhost:7125/api/Reports")
            .then(r => r.json())
            .then(setItems);
    }, []);

    return (
        <ul>
            {items.map((x: Report) => <li key={x.id}>{x.name}</li>)}
        </ul>
    );
}

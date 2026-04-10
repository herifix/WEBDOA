import { useEffect, useState } from "react";
import { buildApiUrl } from "../../config/appConfig";

interface Item {
    id: number;
    name: string;
}

export default function ReportsPage() {
    const [items, setItems] = useState<Item[]>([]);

    useEffect(() => {
        fetch(buildApiUrl("/api/AP"))
            .then(r => r.json())
            .then(setItems);
    }, []);

    return (
        <ul>
            {items.map((x: Item) => <li key={x.id}>{x.name}</li>)}
        </ul>
    );
}

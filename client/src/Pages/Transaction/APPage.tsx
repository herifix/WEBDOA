import { useEffect, useState } from "react";

interface Item {
    id: number;
    name: string;
}

export default function ReportsPage() {
    const [items, setItems] = useState<Item[]>([]);

    useEffect(() => {
        fetch("https://localhost:7125/api/AP")
            .then(r => r.json())
            .then(setItems);
    }, []);

    return (
        <ul>
            {items.map((x: Item) => <li key={x.id}>{x.name}</li>)}
        </ul>
    );
}

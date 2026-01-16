type BreadcrumbItem = {
    name: string;
    item: string; // Relative path starting with /
};

export default function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `https://testdone.in${item.item}`
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

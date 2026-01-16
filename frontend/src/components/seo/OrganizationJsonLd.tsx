export default function OrganizationJsonLd() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'TestDone',
        url: 'https://testdone.in',
        logo: 'https://testdone.in/images/logo.png',
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+91 9315441351',
            contactType: 'customer support',
            email: 'support@testdone.in'
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

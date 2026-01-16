import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://testdone.in';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin/',
                '/dashboard/',
                '/account/',
                // '/questions/' - Allowed for SEO Hub
                '/login/',
                '/signup/',
                '/reset-password/',
                '/verify-email/',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}

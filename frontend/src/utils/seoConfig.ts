import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "https://event-management-lac-eight.vercel.app";

export const defaultSEO = {
    // ================= BASIC GLOBAL =================
    author: "Krishna Tent & Events",
    siteName: "Krishna Tent & Events",
    appName: "Krishna Tent & Events ERP",

    // ================= DEFAULT FALLBACK SEO =================
    title: "Krishna Tent & Events ERP",
    description:
        "Enterprise Resource Planning for Tent & Events Management, Stock Reservation, Dispatch & Execution",
    keywords: "Krishna Tent, Event ERP, Tent Management, Godown Inventory, Booking, Dispatch",
    url: "/",

    // ================= DOMAIN =================
    metadataBase: new URL(BASE_URL),
    baseUrl: BASE_URL,

    // ================= LANGUAGE =================
    language: "en",
    locale: "en_IN",
    charset: "UTF-8",

    // ================= CONTACT =================
    email: "info@krishnatent.com",

    // ================= IMAGES =================
    image: `${BASE_URL}/logo/og-image1.png`,
    imageAlt: "Krishna Tent & Events ERP",
    imageType: "image/png",

    ogImage: `${BASE_URL}/logo/og-image1.png`,
    ogImageAlt: "Krishna Tent & Events ERP - Event Management System",
    ogImageType: "image/png",

    // ================= SOCIAL =================
    ogType: "website",
    twitterCard: "summary_large_image",
    twitterSite: "@krishnatent",
    twitterCreator: "@krishnatent",

    // ================= THEME =================
    themeColor: "#8a5a32",

    // ================= GEO =================
    geoRegion: "IN-RJ",
    geoPlace: "Rajasthan, India",

    // ================= PWA =================
    manifest: "/manifest.json",
    favicon: "/favicon.ico",
    appleTouchIcon: "/logo/og-image1.png",

    // ================= ROBOTS =================
    noIndex: false,
    noFollow: false,

    // ================= VERIFICATION =================
    googleVerification: "",
    bingVerification: "",

    // ================= PERFORMANCE =================
    preconnect: [
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
    ],
    prefetch: [],
    preload: [
        {
            href: "/logo/og-image1.png",
            as: "image",
        },
    ],

    // ================= SEO ADVANCED =================
    canonical: "",
    alternateLanguages: [
        { hrefLang: "en-IN", href: BASE_URL },
    ],

    // ================= STRUCTURED =================
    organization: {
        name: "Krishna Tent & Events",
        url: BASE_URL,
        logo: `${BASE_URL}/logo/og-image1.png`,

        sameAs: [
            "https://twitter.com/krishnatent",
            "https://facebook.com/krishnatent",
            "https://instagram.com/krishnatent",
            "https://linkedin.com/company/krishnatent",
        ],

        contactPoint: {
            "@type": "ContactPoint",
            telephone: "+91-0000000000",
            contactType: "customer support",
            areaServed: "IN",
            availableLanguage: ["English", "Hindi"],
        },
    },

    // ================= SECURITY =================
    referrer: "origin-when-cross-origin",

    // ================= EXTRA =================
    category: "Event & Tent ERP",
    tags: ["events", "tent", "inventory", "godown", "booking"],

    publishedTime: "",
    updatedTime: "",

    trailingSlash: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// buildMetadata()
// Helper function to generate Next.js App Router metadata
// ─────────────────────────────────────────────────────────────────────────────
export function buildMetadata(overrides: {
    title?: string;
    description?: string;
    keywords?: string;
    url?: string;
    ogImage?: string;
    ogImageAlt?: string;
    noIndex?: boolean;
    ogType?: 'website' | 'article';
    publishedTime?: string;
    updatedTime?: string;
} = {}): Metadata {
    const seo = { ...defaultSEO, ...overrides };

    const pageUrl = seo.url
        ? `${BASE_URL}${seo.url.startsWith('/') ? seo.url : '/' + seo.url}`
        : BASE_URL;

    const ogImage = seo.ogImage || defaultSEO.ogImage;
    const ogImageAlt = seo.ogImageAlt || defaultSEO.ogImageAlt;

    const finalTitle = seo.title.includes('Krishna Tent & Events')
        ? seo.title
        : `${seo.title} | Krishna Tent & Events ERP`;

    return {
        metadataBase: new URL(BASE_URL),
        title: {
            default: finalTitle,
            template: "%s | Krishna Tent & Events ERP"
        },
        description: seo.description,
        keywords: seo.keywords,
        authors: [{ name: defaultSEO.author }],
        applicationName: defaultSEO.appName,
        referrer: 'origin-when-cross-origin',
        robots: seo.noIndex
            ? { index: false, follow: false }
            : { index: true, follow: true, 'max-image-preview': 'large' },
        alternates: {
            canonical: pageUrl,
            languages: { 'en-IN': BASE_URL },
        },
        icons: {
            icon: defaultSEO.favicon,
            shortcut: defaultSEO.favicon,
            apple: defaultSEO.appleTouchIcon,
        },
        manifest: defaultSEO.manifest,
        openGraph: {
            title: finalTitle,
            description: seo.description,
            url: pageUrl,
            siteName: defaultSEO.siteName,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: ogImageAlt,
                    type: 'image/png',
                },
            ],
            locale: defaultSEO.locale,
            type: (seo.ogType || 'website') as 'website' | 'article',
            ...(seo.publishedTime && { publishedTime: seo.publishedTime }),
            ...(seo.updatedTime && { modifiedTime: seo.updatedTime }),
        } as any,
        twitter: {
            card: 'summary_large_image',
            title: finalTitle,
            description: seo.description,
            images: [ogImage],
            creator: defaultSEO.twitterCreator,
            site: defaultSEO.twitterSite,
        },
    };
}

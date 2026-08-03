declare module "next-pwa" {
    import { NextConfig } from "next";

    type PWAOptions = {
        dest: string;
        register?: boolean;
        skipWaiting?: boolean;
        disable?: boolean;
        buildExcludes?: RegExp[];
    };

    export default function withPWA(
        options: PWAOptions
    ): (config: NextConfig) => NextConfig;
}
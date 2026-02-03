import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import plugin from "@vitejs/plugin-vue";
import fs from "fs";
import path from "path";
import child_process from "child_process";
import { env } from "process";
import { VitePWA } from "vite-plugin-pwa";

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ""
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = "examplepwa.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
}

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (
        0 !==
        child_process.spawnSync(
            "dotnet",
            [
                "dev-certs",
                "https",
                "--export-path",
                certFilePath,
                "--format",
                "Pem",
                "--no-password",
            ],
            { stdio: "inherit" },
        ).status
    ) {
        throw new Error("Could not create certificate.");
    }
}

const target = env.ASPNETCORE_HTTPS_PORT
    ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}`
    : env.ASPNETCORE_URLS
      ? env.ASPNETCORE_URLS.split(";")[0]
      : "https://localhost:7160";

const rewritePort = (path: string) => {
    const port = `${parseInt(env.DEV_SERVER_PORT || "65315")}`;
    console.log(port);
    console.log(env.ASPNETCORE_HTTPS_PORT);
    return path.replace(port, `${env.ASPNETCORE_HTTPS_PORT}`);
};

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        plugin(),
        VitePWA({
            registerType: "autoUpdate",
            injectRegister: "auto",
            devOptions: { enabled: true },
            workbox: {
                globPatterns: ["**/*.{js,ts,css,html,ico,png,svg}"],
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) => {
                            return url.pathname.startsWith("/api/");
                        },
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                ],
            },
            includeAssets: ["fonts/*.ttf", "images/*.png", "css/*.css"],
            manifest: {
                short_name: "Пример PWA",
                name: "Пример прогрессивного веб-приложения",
                start_url: "/",
                display: "standalone",
                theme_color: "#333333",
                background_color: "#000000",
                orientation: "portrait",
                icons: [
                    {
                        src: "/icons/192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/icons/512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "/icons/512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
                prefer_related_applications: false,
            },
        }),
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        proxy: {
            "/api": {
                target,
                secure: false,
                // rewrite: rewritePort,
                // rewrite: (path) => path.replace("65315", "5037"),
            },
        },
        port: parseInt(env.DEV_SERVER_PORT || "65315"),
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        },
    },
});

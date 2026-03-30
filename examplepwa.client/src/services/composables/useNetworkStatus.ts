import type { ServiceWorkerMessage } from "@/sw";
import axios, { AxiosError } from "axios";

import { onMounted, onUnmounted, readonly, ref } from "vue";
declare let self: ServiceWorkerGlobalScope;

export function useNetworkStatus() {
    const isOnline = ref(navigator.onLine);
    const hasConnection = ref(true);
    const isChecking = ref(false);

    let checkInterval: ReturnType<typeof setInterval> | null = null;

    const checkServer = async () => {
        if (!navigator.onLine) {
            hasConnection.value = false;
            return;
        }

        if (isChecking.value) return;
        isChecking.value = true;

        try {
            await axios.head("/api/health", {
                timeout: 3000,
                headers: {
                    "Cache-Control": "no-cache",
                },
            });
            hasConnection.value = true;
            //Принудительно обработать очередь
            const swMessage: ServiceWorkerMessage = { type: "PROCESS_QUEUE" };
            navigator.serviceWorker.controller?.postMessage(swMessage);
        } catch (error) {
            const e = error as AxiosError;
            hasConnection.value = e.code !== "ECONNABORTED" && e.code !== "ERR_NETWORK";
        } finally {
            isChecking.value = false;
        }
    };

    const handleOnline = () => {
        isOnline.value = true;
        checkServer();
    };

    const handleOffline = () => {
        isOnline.value = false;
        hasConnection.value = false;
    };

    onMounted(() => {
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        checkServer();
        checkInterval = setInterval(checkServer, 3000);
    });

    onUnmounted(() => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);

        if (checkInterval) clearInterval(checkInterval);
    });

    return {
        isOnline: readonly(isOnline),
        hasConnection: readonly(hasConnection),
        isChecking: readonly(isChecking),
        checkServer,
    };
}

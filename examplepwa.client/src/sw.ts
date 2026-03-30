/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst, StaleWhileRevalidate, NetworkOnly } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { useNetworkStatus } from "./services/composables/useNetworkStatus";

interface IRequest {
    id: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    data?: any;
    timestamp: number;
}

declare let self: ServiceWorkerGlobalScope;

const QUEUE_CACHE = "request-queue-v1";
const { isOnline, hasConnection } = useNetworkStatus();

//Очистка устаревших кэшей
cleanupOutdatedCaches();

// ==================== ПРЕДВАРИТЕЛЬНОЕ КЭШИРОВАНИЕ ====================
// Это автоматически кэширует все статические файлы (JS, CSS, HTML)
precacheAndRoute(self.__WB_MANIFEST);

// ==================== КЭШИРОВАНИЕ GET-ЗАПРОСОВ ====================

// 1. Кэширование данных API (стратегия: сначала сеть, потом кэш)
registerRoute(
    // Регулярка для API GET-запросов
    ({ url, request }) => {
        return url.pathname.startsWith("/api/") && request.method === "GET";
    },
    new NetworkFirst({
        cacheName: "api-cache-v1",
        plugins: [
            // Кэшируем только успешные ответы (статус 200)
            new CacheableResponsePlugin({
                statuses: [200],
            }),
            // Ограничиваем количество записей в кэше (максимум 50)
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 дней
            }),
        ],
    }),
);

// 2. Кэширование изображений (стратегия: сначала кэш, потом сеть)
registerRoute(
    ({ request }) => request.destination === "image",
    new CacheFirst({
        cacheName: "images-cache-v1",
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200],
            }),
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
            }),
        ],
    }),
);

// 3. Кэширование статики (шрифты, стили) - StaleWhileRevalidate для быстрого UI
registerRoute(
    ({ request }) =>
        request.destination === "style" ||
        request.destination === "script" ||
        request.destination === "font",
    new StaleWhileRevalidate({
        cacheName: "static-resources-v1",
    }),
);

// ==================== ОФЛАЙН-СИНХРОНИЗАЦИЯ ДЛЯ POST ====================

// Создаем плагин для очереди офлайн-запросов
// const bgSyncPlugin = new BackgroundSyncPlugin("offlineApiQueue", {
//     maxRetentionTime: 24 * 60, // Хранить запросы 24 часа
//     onSync: async ({ queue }) => {
//         console.log("[SW] Начинаем синхронизацию очереди:", queue.name);

//         // Получаем все запросы из очереди
//         let entry;
//         let numberFails = 0;
//         const MAX_DELAY = 5 * 60 * 1000; //5 минут в мс
//         const INIT_DELAY = 1000; //1 секунда
//         while ((entry = await queue.shiftRequest())) {
//             try {
//                 // Клонируем запрос, так как его можно использовать только один раз
//                 const request = entry.request.clone();

//                 // Можно добавить заголовки перед отправкой
//                 const headers = new Headers(request.headers);
//                 headers.append("X-Sync-Attempt", "background");
//                 headers.append("X-Retry-Count", numberFails.toString());

//                 const newRequest = new Request(request, { headers });

//                 // Отправляем запрос
//                 const response = await fetch(newRequest);

//                 if (!response.ok) {
//                     throw new Error(`HTTP error! status: ${response.status}`);
//                 }

//                 console.log("[SW] Запрос успешно синхронизирован:", response.status);

//                 numberFails = 0; //Сброс счетчика неудачных запросов

//                 // Можно отправить сообщение клиенту об успешной синхронизации
//                 const clients = await self.clients.matchAll();
//                 clients.forEach((client) => {
//                     client.postMessage({
//                         type: "SYNC_SUCCESS",
//                         url: request.url,
//                         timestamp: Date.now(),
//                     });
//                 });
//             } catch (error) {
//                 console.error("[SW] Ошибка синхронизации:", error);

//                 const delay = Math.min(INIT_DELAY * numberFails * numberFails, MAX_DELAY);

//                 console.log(
//                     `[SW] Повторная попытка через ${delay / 1000} секунд (попытка ${numberFails + 1})`,
//                 );

//                 //Ждем перед попыткой
//                 await new Promise((resolve) => setTimeout(resolve, delay));

//                 // Возвращаем запрос обратно в очередь
//                 await queue.unshiftRequest(entry);

//                 numberFails++; //инкремент неудачных попыток

//                 // Прерываем цикл, чтобы не терять остальные запросы
//                 break;
//             }
//         }

//         const queueSize = await queue.size();
//         if (queueSize > 0) {
//             console.log(
//                 `[SW] В очереди осталось ${queueSize} запросов, планируем следующую синхронизацию`,
//             );
//             const delay = Math.min(INIT_DELAY * numberFails * numberFails, MAX_DELAY);
//             setTimeout(() => {
//                 self.registration.sync
//                     .register("offlineApiQueue")
//                     .catch((e) => console.error("[SW] Ошибка регистрации sync:", e));
//             }, delay);
//         } else {
//             console.log("[SW] Очередь полностью синхронизирована");
//         }
//     },
// });

// // Регистрируем маршрут для POST/PUT/DELETE запросов
// registerRoute(
//     ({ url, request }) => {
//         const methods = ["POST", "PUT", "DELETE", "PATCH"];
//         return url.pathname.startsWith("/api/") && methods.includes(request.method);
//     },
//     new NetworkOnly({
//         plugins: [bgSyncPlugin],
//     }),
// );

const getQueue = async (): Promise<IRequest[]> => {
    const cache = await caches.open(QUEUE_CACHE);
    const response = await cache.match("queue");
    return response ? await response.json() : [];
};

const saveQueue = async (queue: IRequest[]): Promise<void> => {
    const cache = await caches.open(QUEUE_CACHE);
    await cache.put("queue", new Response(JSON.stringify(queue)));
};

const addToQueue = async (request: Request): Promise<void> => {
    const queue = await getQueue();

    let data: any = undefined;

    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        try {
            const cloned = request.clone();
            data = await cloned.json().catch(() => {
                // Если не JSON, пробуем получить как текст
                return cloned.text();
            });
        } catch (error) {
            console.error("Ошибка получения тела запроса:", error);
        }
    }

    const queued: IRequest = {
        id: crypto.randomUUID(),
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        data: data,
        timestamp: Date.now(),
    };

    queue.push(queued);
    // await cache.put("queue", new Response(JSON.stringify(queue)));
    await saveQueue(queue);
};

const processQueue = async (): Promise<void> => {
    const queue = await getQueue();
    if (queue.length === 0) return;

    const successfulIds: string[] = [];

    for (const req of queue) {
        try {
            const axiosConfig: AxiosRequestConfig = {
                url: req.url,
                method: req.method as any,
                headers: req.headers,
                timeout: 10000,
            };
            // Добавляем тело запроса для методов, которые его поддерживают
            if (req.data && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
                axiosConfig.data = req.data;
            }

            const response = await axios(axiosConfig);
            if (response.status >= 200 && response.status < 300) {
                successfulIds.push(req.id);
                console.log(`Запрос из очереди успешен: ${req.method} ${req.url}`);
            }
        } catch (error) {
            console.error("Ошибка отправки запроса из очереди:", req.method, req.url, error);

            //Если ошибка не из-за сети, то удаляем из очереди
            if (axios.isAxiosError(error) && error.response) {
                successfulIds.push(req.id);
            }
        }
    }

    //Удаление обработанных запросов
    if (successfulIds.length > 0) {
        const remainingQueue = queue.filter((r) => !successfulIds.includes(r.id));
        await saveQueue(remainingQueue);

        //Уведомление о размере очереди
        const clients = await self.clients.matchAll();
        for (const client of clients) {
            client.postMessage({
                type: "QUEUE_UPDATED",
                size: remainingQueue.length,
            });
        }
    }
};

// ==================== ОБРАБОТКА НАВИГАЦИИ (SPA) ====================
// Для одностраничных приложений - всегда отдаем index.html при навигации
registerRoute(
    ({ request }) => request.mode === "navigate",
    new NetworkFirst({
        cacheName: "pages-cache-v1",
        networkTimeoutSeconds: 3,
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200],
            }),
        ],
    }),
);

// ==================== ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ ====================

// Мгновенная активация нового Service Worker
self.addEventListener("install", (event) => {
    console.log("[SW] Установка");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("[SW] Активация");
    // Захватываем контроль над всеми клиентами
    event.waitUntil(self.clients.claim());

    // При активации проверяем, нужно ли обработать очередь
    // Фактическую проверку сети оставляем на useNetworkStatus
    event.waitUntil(
        (async () => {
            // Уведомляем клиентов о наличии очереди
            const queue = await getQueue();
            if (queue.length > 0) {
                const clients = await self.clients.matchAll();
                for (const client of clients) {
                    client.postMessage({
                        type: "QUEUE_EXISTS",
                        size: queue.length,
                    });
                }
            }
        })(),
    );
    // Очищаем старые кэши
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith("api-cache-") && name !== "api-cache-v1")
                    .map((name) => caches.delete(name)),
            );
        }),
    );
    // self.clients.claim();
});

// Слушаем сообщения от клиента (например, для принудительной синхронизации)
self.addEventListener("message", async (event) => {
    const { type, data } = event.data || {};

    switch (type) {
        case "SKIP_WAITING":
            self.skipWaiting();
            break;
        case "PROCESS_QUEUE":
            // Принудительная обработка очереди
            await processQueue();
            break;
        case "GET_QUEUE_STATUS":
            // Получение статуса очереди
            const queue = await getQueue();
            event.source?.postMessage({
                type: "QUEUE_STATUS",
                size: queue.length,
                requests: queue.map(({ id, url, method, timestamp }) => ({
                    id,
                    url,
                    method,
                    timestamp,
                })),
            });
            break;

        case "CLEAR_QUEUE":
            // Очистка очереди
            const cache = await caches.open(QUEUE_CACHE);
            await cache.delete("queue");
            event.source?.postMessage({
                type: "QUEUE_CLEARED",
            });
            break;

        case "REMOVE_FROM_QUEUE":
            // Удаление конкретного запроса из очереди
            if (data?.id) {
                const currentQueue = await getQueue();
                const updatedQueue = currentQueue.filter((req) => req.id !== data.id);
                await saveQueue(updatedQueue);
                event.source?.postMessage({
                    type: "QUEUE_UPDATED",
                    size: updatedQueue.length,
                });
            }
            break;
    }

    // if (event.data && event.data.type === "FORCE_SYNC") {
    //     console.log("[SW] Принудительная синхронизация");
    //     self.registration.sync.register("offlineApiQueue");
    // }
});

// Обработка мутирующих запросов
const handleMutatingRequest = async (request: Request): Promise<Response> => {
    try {
        const data = await request
            .clone()
            .json()
            .catch(() => undefined);
        const axiosConfig: AxiosRequestConfig = {
            url: request.url,
            method: request.method as any,
            headers: Object.fromEntries(request.headers.entries()),
            data: data,
            timeout: 10000,
        };
        const response = await axios(axiosConfig);

        return new Response(JSON.stringify(response.data), {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers as any),
        });
    } catch (error) {
        //если запрос не удался, то в очередь
        await addToQueue(request.clone());

        return new Response(
            JSON.stringify({
                queued: true,
                message: "Запрос в очереди",
                timestamp: Date.now(),
            }),
            {
                status: 202,
                statusText: "Accepted",
                headers: {
                    "Content-Type": "application/json",
                    "X-Queued": "true",
                },
            },
        );
    }
};

self.addEventListener("fetch", (event: FetchEvent) => {
    const { method } = event.request;
    const shouldQueue = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (shouldQueue) event.respondWith(handleMutatingRequest(event.request));
});

// Экспорт типа для использования в клиенте
export type ServiceWorkerMessage =
    | { type: "PROCESS_QUEUE" }
    | { type: "GET_QUEUE_STATUS" }
    | { type: "CLEAR_QUEUE" }
    | { type: "REMOVE_FROM_QUEUE"; data: { id: string } };

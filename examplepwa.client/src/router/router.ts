import HelloWorld from "@/components/HelloWorld.vue";
import MainPage from "@/pages/MainPage.vue";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

function changeName(title: string | null) {
    document.title = title ?? "Прогрессивное веб-приложение";
}

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        component: MainPage,
        name: "main",
    },
    {
        path: "/welcome",
        component: HelloWorld,
        name: "welcome",
        meta: {
            title: "Welcome page",
        },
    },
    {
        path: "/wheather",
        component: () => import("@/pages/WeatherPage.vue"),
        name: "wheather",
        meta: {
            title: "Страница погоды",
        },
    },
    {
        path: "/messages",
        component: () => import("@/pages/MessagesPage.vue"),
        name: "messages",
        meta: {
            title: "Страница сообщений",
        },
    },
    {
        path: "/:pathMatch(.*)*",
        name: "NotFound",
        component: MainPage,
    },
];

const router = createRouter({
    routes,
    history: createWebHistory(),
});
router.beforeEach((to) => {
    changeName((to.meta?.title as string) ?? null);
});
export default router;

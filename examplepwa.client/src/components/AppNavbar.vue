<template>
    <div class="navbar">
        <div
            @click="() => router.push({ name: 'main' })"
            @click.middle="() => linkByName('main')"
            class="logo"
        >
            <img class="logo-icon" src="/icons/favicon.ico" /> PWA
        </div>
        <div class="navbar__btns">
            <button
                @click="() => router.push({ name: 'welcome' })"
                @click.middle="() => linkByName('welcome')"
                @mousedown.middle.prevent
                style="cursor: pointer"
            >
                Добро пожаловать
            </button>
            <button
                @click="() => router.push({ name: 'wheather' })"
                @click.middle="() => linkByName('wheather')"
                @mousedown.middle.prevent
                style="cursor: pointer"
            >
                Погода
            </button>
            <button
                @click="() => router.push({ name: 'messages' })"
                @click.middle="() => linkByName('messages')"
                @mousedown.middle.prevent
                style="cursor: pointer"
            >
                Сообщения
            </button>
        </div>
        <div class="network-status">
            <span :title="statusText">{{ statusIcon }}</span>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useRouter } from "vue-router";

import useLinkRoute from "@/services/composables/useLinkRoute";
import { useNetworkStatus } from "@/services/composables/useNetworkStatus";
import { computed } from "vue";

const router = useRouter();
const { linkByName } = useLinkRoute();

const { isOnline, hasConnection } = useNetworkStatus();

const statusIcon = computed(() => {
    if (!isOnline.value) return "📴";
    if (!hasConnection.value) return "⚠️";
    return "📶";
});

const statusText = computed(() => {
    if (!isOnline.value) return "Нет сети";
    if (!hasConnection.value) return "Сервер недоступен";
    return "В сети";
});
</script>
<style scoped>
.logo {
    align-items: center;
    margin-left: 10%;
    cursor: pointer;
    display: flex;
    align-items: center;
    max-height: 50px;
}

.logo-icon {
    width: 40px;
    aspect-ratio: 1/1;
}

.navbar {
    position: relative;
    height: var(--navbar-height);
    background-color: #8fb0cbff;
    box-shadow: 2px 2px 4px gray;
    display: flex;
    align-items: center;
    padding: 0 15px;
    overflow-x: auto;
}

.navbar__btns {
    display: flex;
    align-items: center;
    margin: 0 2% 0 auto;
}

.account__button {
    width: 40px;
    height: auto;
    margin-left: 10px;
    cursor: pointer;
    border-radius: 50%;
    aspect-ratio: 1/1;
}

.account__button--border {
    border: 2px #2e3150 solid;
}
</style>

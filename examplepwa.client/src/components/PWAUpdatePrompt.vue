<template>
    <div v-if="showPrompt" class="pwa-update-prompt">
        <div class="prompt-content">
            <p>Доступна новая версия приложения!</p>
            <div class="buttons">
                <button @click="update">Обновить</button>
                <button @click="dismiss">Отмена</button>
            </div>
        </div>
    </div>

    <div v-if="offlineReady" class="pwa-offline-ready">
        <div class="prompt-content">
            <p>Приложение готово к работе офлайн</p>
            <button @click="closeOfflineReady">OK</button>
        </div>
    </div>
</template>

<script setup lang="ts">
/// <reference types="vite-plugin-pwa/vanillajs" />
import { onMounted, ref } from "vue";
import { registerSW } from "virtual:pwa-register";

const showPrompt = ref(false);
const offlineReady = ref(false);
let updateSW: (() => Promise<void>) | null = null;

const registerServiceWorker = () => {
    updateSW = registerSW({
        onNeedRefresh() {
            // Новая версия доступна → показываем кнопку "Обновить"
            showPrompt.value = true;
        },
        onOfflineReady() {
            // Приложение готово к работе офлайн
            offlineReady.value = true;
            // Автоматически скрываем через 3 секунды (опционально)
            setTimeout(() => {
                offlineReady.value = false;
            }, 3000);
        },
    });
};

const update = async () => {
    if (updateSW) {
        await updateSW(); // вызывает перезагрузку страницы
        showPrompt.value = false;
    }
};

const dismiss = () => {
    showPrompt.value = false;
};

const closeOfflineReady = () => {
    offlineReady.value = false;
};

// Запускаем регистрацию при монтировании
onMounted(() => {
    registerServiceWorker();
});
</script>

<style scoped>
.pwa-update-prompt,
.pwa-offline-ready {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 16px 24px;
    font-family: sans-serif;
}

.pwa-offline-ready {
    background: #4caf50;
    color: white;
}

.buttons {
    margin-top: 12px;
    display: flex;
    gap: 12px;
}

button {
    padding: 6px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:first-child {
    background: #2196f3;
    color: white;
}

button:last-child {
    background: #f5f5f5;
}
</style>

<template>
    <div class="page">
        <div class="input">
            <input type="text" v-model="newMessage" />
            <button @click="async () => await send()">Отправить</button>
            <div>{{ newMessage }}</div>
        </div>
        <p v-for="message in messages" :key="message">
            {{ message }}
        </p>
    </div>
</template>
<script setup lang="ts">
import axios from "axios";
import { onMounted, onUnmounted, ref } from "vue";

const messages = ref<string[]>([]);
const newMessage = ref<string>("");

const send = async () => {
    messages.value.push(newMessage.value);
    await axios
        .post("/api/weatherforecast", { message: newMessage.value })
        .then((r) => {
            console.log(r);
            if (r.status === 201) {
                get();
            }
        })
        .finally(() => {
            newMessage.value = "";
        });
};

const get = async () => {
    await axios.get("/api/weatherforecast/messages").then((r) => (messages.value = r.data));
};

const messageReceived = async () => {
    console.log("Сообщение пришло");
    await get();
};

onMounted(async () => {
    await get();
    navigator.serviceWorker.addEventListener("message", messageReceived);
});

onUnmounted(() => {
    navigator.serviceWorker.removeEventListener("message", messageReceived);
});
</script>
<style scoped></style>

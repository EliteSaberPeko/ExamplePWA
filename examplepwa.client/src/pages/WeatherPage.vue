<template>
    <div class="weather-component">
        <h1>Погода</h1>
        <p>Получение данных с сервера</p>

        <div v-if="loading" class="loading">Загрузка...</div>

        <div v-if="post" class="content">
            <table>
                <thead>
                    <tr>
                        <th>Дата</th>
                        <th>Температура (C)</th>
                        <th>Температура (F)</th>
                        <th>Описание</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="forecast in post" :key="forecast.date">
                        <td>{{ forecast.date }}</td>
                        <td>{{ forecast.temperatureC }}</td>
                        <td>{{ forecast.temperatureF }}</td>
                        <td>{{ forecast.summary }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
<script setup lang="ts">
import axios from "axios";
import { onMounted, ref } from "vue";

interface IWeather {
    date: string;
    summary: string;
    temperatureC: number;
    temperatureF: number;
}
const loading = ref(false);
const post = ref<IWeather[]>([]);

const transformDate = (date: string) => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? date : d.toLocaleDateString();
};

const getData = async () => {
    loading.value = true;
    await axios
        .get("/api/weatherforecast")
        .then((r) => {
            post.value = r.data;
            for (const val of post.value) {
                val.date = transformDate(val.date);
            }
        })
        .finally(() => (loading.value = false));
};

onMounted(async () => {
    await getData();
});
</script>
<style scoped>
th {
    font-weight: bold;
}

th,
td {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
}

.weather-component {
    text-align: center;
}

table {
    margin-left: auto;
    margin-right: auto;
}
</style>

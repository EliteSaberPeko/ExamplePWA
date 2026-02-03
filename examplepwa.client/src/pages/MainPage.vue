<template>
    <h1 class="h1">Главная страница</h1>
    <div class="content">
        <span class="span">Тут только статика</span> <img class="img" src="/icons/512.png" />
    </div>
</template>
<script setup lang="ts"></script>
<style scoped>
.h1 {
    display: flex;
    justify-content: center;
}

.content {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
}

.img {
    width: 200px;
    height: 200px;
}
</style>

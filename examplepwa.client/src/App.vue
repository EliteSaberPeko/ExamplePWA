<script setup lang="ts">
import AppNavbar from "./components/AppNavbar.vue";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt.vue";
// import HelloWorld from "./components/HelloWorld.vue";
// import TheWelcome from './components/TheWelcome.vue'
</script>

<template>
    <!-- <header>
        <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

        <div class="wrapper">
            <HelloWorld msg="You did it!" />
        </div>
    </header> -->

    <!-- <main>
    <TheWelcome />
  </main> -->
    <AppNavbar />
    <RouterView :key="$route.fullPath" />
    <PWAUpdatePrompt />
</template>

<style scoped>
header {
    line-height: 1.5;
}
</style>

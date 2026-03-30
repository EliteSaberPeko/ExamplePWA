import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/router";

const app = createApp(App);

app.use(router);

app.mount("#app");

// if ("serviceWorker" in navigator) {
//     window.addEventListener("load", () => {
//         navigator.serviceWorker.register("./sw.js").then(
//             (registration) => {
//                 console.log("SW registered: ", registration);

//                 //подписка на сообщения от service worker, мб можно использовать pinia для отображения в UI
//                 navigator.serviceWorker.addEventListener("message", (event) => {
//                     if (event.data.type === "SYNC_SUCCESS") {
//                         console.log("Данные синхронизированы: ", event.data);
//                     }
//                 });
//             },
//             (error) => {
//                 console.error("SW registration failed: ", error);
//             },
//         );
//     });
// }

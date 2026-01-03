import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "@mdi/font/css/materialdesignicons.css";
import "./style.css";
import App from "./App.vue";
import router from "./router";

const pinia = createPinia();

const vuetify = createVuetify({
  theme: { defaultTheme: "light" },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: { mdi },
  },
});

createApp(App).use(pinia).use(router).use(vuetify).mount("#app");

import { createApp } from "vue";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "@mdi/font/css/materialdesignicons.css";
import "./style.css";
import App from "./App.vue";
import router from "./router";

const vuetify = createVuetify({
  theme: { defaultTheme: "light" },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: { mdi },
  },
});

createApp(App).use(router).use(vuetify).mount("#app");

/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Stores
import { useAuthStore } from '@/stores/auth'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'
import './styles/main.css'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')

// Initialize auth store after app is mounted
const authStore = useAuthStore()
authStore.initialize()

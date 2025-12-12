<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
authStore.initialize()
</script>

<template>
  <div id="app">
    <nav v-if="authStore.isAuthenticated">
      <router-link to="/">Home</router-link>
      <router-link to="/account">Account</router-link>
    </nav>
    <RouterView />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  background-color: #f8f9fa;
}

#app {
  min-height: 100vh;
}

nav {
  background-color: #fff;
  padding: 15px 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  gap: 20px;
}

nav a {
  color: #42b983;
  text-decoration: none;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

nav a:hover {
  background-color: #f0f0f0;
}

nav a.router-link-active {
  background-color: #42b983;
  color: white;
}

h1, h2 {
  color: #2c3e50;
}
</style>

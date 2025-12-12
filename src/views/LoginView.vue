<template>
  <div class="login-container">
    <h1>Login</h1>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="email">Email:</label>
        <input 
          id="email" 
          v-model="email" 
          type="email" 
          required 
          placeholder="you@example.com"
        />
      </div>
      
      <div class="form-group">
        <label for="password">Password:</label>
        <input 
          id="password" 
          v-model="password" 
          type="password" 
          required 
          placeholder="••••••••"
        />
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <div class="button-group">
        <button type="submit" @click="isSignUp = false" :disabled="loading">
          {{ loading && !isSignUp ? 'Loading...' : 'Log in' }}
        </button>
        <button type="button" @click="handleSignUp" :disabled="loading">
          {{ loading && isSignUp ? 'Loading...' : 'Sign up' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const isSignUp = ref(false)

async function handleSubmit() {
  if (isSignUp.value) {
    await handleSignUp()
  } else {
    await handleLogin()
  }
}

async function handleLogin() {
  try {
    error.value = ''
    loading.value = true
    await authStore.signIn(email.value, password.value)
    router.push('/account')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleSignUp() {
  try {
    error.value = ''
    loading.value = true
    isSignUp.value = true
    await authStore.signUp(email.value, password.value)
    router.push('/account')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
    isSignUp.value = false
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

button {
  flex: 1;
  padding: 10px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background-color: #359268;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: red;
  margin: 10px 0;
  padding: 10px;
  background-color: #fee;
  border-radius: 4px;
}
</style>

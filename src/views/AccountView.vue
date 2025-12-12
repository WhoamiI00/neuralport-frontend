<template>
  <div class="account">
    <h1>Account Page</h1>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else class="form-widget">
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          id="email" 
          type="text" 
          :value="authStore.user?.email" 
          disabled 
        />
      </div>

      <div class="form-group">
        <label for="profile-email">Profile Email</label>
        <input 
          id="profile-email" 
          v-model="profileEmail" 
          type="text"
        />
      </div>

      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>

      <div class="button-group">
        <button 
          @click="updateProfile" 
          :disabled="loading"
          class="primary"
        >
          {{ loading ? 'Loading...' : 'Update Profile' }}
        </button>

        <button 
          @click="handleSignOut"
          :disabled="loading"
          class="secondary"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const profileEmail = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

onMounted(async () => {
  await getProfile()
})

async function getProfile() {
  try {
    loading.value = true

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', authStore.user?.id)
      .single()

    if (error) throw error

    if (data) {
      profileEmail.value = data.email
    }
  } catch (e: any) {
    console.error(e)
    showMessage('Error loading profile!', 'error')
  } finally {
    loading.value = false
  }
}

async function updateProfile() {
  try {
    loading.value = true

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: authStore.user?.id,
        email: profileEmail.value
      })

    if (error) throw error

    showMessage('Profile updated!', 'success')
  } catch (e: any) {
    console.error(e)
    showMessage('Error updating profile!', 'error')
  } finally {
    loading.value = false
  }
}

async function handleSignOut() {
  try {
    loading.value = true
    await authStore.signOut()
    router.push('/login')
  } catch (e: any) {
    console.error(e)
    showMessage('Error signing out!', 'error')
  } finally {
    loading.value = false
  }
}

function showMessage(msg: string, type: 'success' | 'error') {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>

<style scoped>
.account {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
}

.form-widget {
  background-color: #f5f5f5;
  padding: 30px;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 16px;
}

input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 25px;
}

button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}

button.primary {
  background-color: #42b983;
  color: white;
}

button.primary:hover:not(:disabled) {
  background-color: #359268;
}

button.secondary {
  background-color: #6c757d;
  color: white;
}

button.secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.message {
  padding: 10px;
  border-radius: 4px;
  margin: 15px 0;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
}
</style>

<template>
  <div class="home">
    <h1>Home Page</h1>
    
    <div v-if="loading" class="loading">Loading profiles...</div>
    
    <div v-else>
      <div class="profile-section">
        <h2>My Profile (via Django API - Call 1):</h2>
        <pre v-if="myProfile">{{ JSON.stringify(myProfile, null, 2) }}</pre>
        <div v-else-if="myProfileError" class="error">{{ myProfileError }}</div>
      </div>

      <div class="profile-section">
        <h2>My Profile (via Django API - Call 2):</h2>
        <pre v-if="testProfile">{{ JSON.stringify(testProfile, null, 2) }}</pre>
        <div v-else-if="testProfileError" class="error">{{ testProfileError }}</div>
      </div>
    </div>

    <div class="actions">
      <router-link to="/account">
        <button>Go to Account</button>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { fetchProfile } from '../lib/api'

const authStore = useAuthStore()

const loading = ref(true)
const myProfile = ref<any>(null)
const myProfileError = ref('')
const testProfile = ref<any>(null)
const testProfileError = ref('')

onMounted(async () => {
  try {
    loading.value = true
    
    console.log('HomeView mounted, user:', authStore.user)
    
    // Fetch current user's profile
    if (authStore.user?.id) {
      try {
        console.log('Fetching user profile:', authStore.user.id)
        myProfile.value = await fetchProfile(authStore.user.id)
        console.log('Got profile:', myProfile.value)
      } catch (e: any) {
        console.error('Error fetching my profile:', e)
        myProfileError.value = e.message
      }

      // Fetch the same profile again as "test" to demonstrate the API call
      try {
        console.log('Fetching profile via API (same user)')
        testProfile.value = await fetchProfile(authStore.user.id)
        console.log('Got test profile:', testProfile.value)
      } catch (e: any) {
        console.error('Error fetching test profile:', e)
        testProfileError.value = e.message
      }
    } else {
      console.log('No user ID available')
      myProfileError.value = 'Not authenticated'
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.profile-section {
  margin: 30px 0;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

pre {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

.error {
  color: #d63031;
  padding: 10px;
  background-color: #fee;
  border-radius: 4px;
}

.actions {
  margin-top: 30px;
}

button {
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #359268;
}

a {
  text-decoration: none;
}
</style>

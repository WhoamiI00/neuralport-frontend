<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div 
        v-if="modelValue" 
        class="modal-overlay" 
        :class="{ 'dark-mode': isDark }"
        @click.self="handleClose"
      >
        <div class="modal-container">
          <div class="modal-card">
            <!-- Header -->
            <div class="modal-header">
              <h2 class="modal-title">
                <i class="mdi mdi-account-edit"></i>
                Edit Member
              </h2>
              <button class="close-btn" @click="handleClose" title="Close">
                <i class="mdi mdi-close"></i>
              </button>
            </div>

            <!-- Body -->
            <form class="modal-body" @submit.prevent="handleSubmit">
              <!-- Avatar Upload Section -->
              <div class="avatar-section">
                <label class="form-label">
                  <i class="mdi mdi-image-outline"></i>
                  Profile Image
                </label>
                
                <div class="upload-section">
                  <!-- Cloudinary Upload Button -->
                  <button
                    type="button"
                    class="upload-btn"
                    :disabled="isUploading"
                    @click="triggerFileInput"
                  >
                    <i v-if="isUploading" class="mdi mdi-loading mdi-spin"></i>
                    <i v-else class="mdi mdi-upload"></i>
                    <span v-if="!isUploading">Upload Image</span>
                    <span v-else>Uploading...</span>
                  </button>
                  <input 
                    ref="fileInputRef"
                    type="file" 
                    accept="image/*" 
                    @change="handleCloudinaryUpload"
                    hidden
                  />
                  
                  <div class="hint">Or</div>
                  
                  <!-- URL Input -->
                  <input
                    v-model="formData.avatarUrl"
                    type="text"
                    class="form-input"
                    :class="{ 'error': errors.avatarUrl }"
                    placeholder="Enter image URL directly (optional)"
                    @input="handleAvatarUrlChange"
                  />
                  <span v-if="errors.avatarUrl" class="error-message">{{ errors.avatarUrl }}</span>
                </div>
                
                <!-- Preview -->
                <div v-if="previewLoading" class="preview-loading">Loading preview…</div>
                <div v-else-if="avatarPreview" class="preview">
                  <img :src="avatarPreview" alt="preview" @error="handleImageError" />
                </div>
                <div v-else-if="previewError" class="preview-error">Unable to load preview</div>
              </div>

              <!-- Form Fields -->
              <div class="form-grid">
                <!-- Username Input -->
                <div class="form-group full-width">
                  <label class="form-label">
                    <i class="mdi mdi-account-outline"></i>
                    Username
                  </label>
                  <input
                    v-model="formData.username"
                    type="text"
                    class="form-input"
                    :class="{ 'error': errors.username }"
                    placeholder="Enter username"
                    @blur="validateUsername"
                  />
                  <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
                </div>
              </div>

              <!-- Footer Actions -->
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="handleClose">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="isSubmitting || !isFormValid"
                >
                  <i v-if="isSubmitting" class="mdi mdi-loading mdi-spin"></i>
                  <i v-else class="mdi mdi-check"></i>
                  {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import { useTheme } from '../../composables/useTheme'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  member: {
    id: string
    name: string
    avatarUrl?: string | null
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update-member', memberData: {
    id: string
    username: string
    avatar: File | null
    avatarUrl: string | null
  }): void
}>()

const { isDark } = useTheme()

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// Form state
const formData = reactive({
  username: '',
  avatarUrl: ''
})

const errors = reactive({
  username: '',
  avatarUrl: ''
})

const fileInputRef = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const isSubmitting = ref(false)
const isUploading = ref(false)
const previewLoading = ref(false)
const previewError = ref(false)

let previewTimer: number | undefined

// Computed
const isFormValid = computed(() => {
  return (
    formData.username.trim().length >= 2 &&
    !errors.username &&
    !errors.avatarUrl
  )
})

// Image loading helper
function loadImage(url: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('load error'))
    img.src = url
  })
}

// Watch avatar URL for preview
watch(() => formData.avatarUrl, (val) => {
  previewError.value = false
  avatarPreview.value = null
  if (previewTimer) { 
    window.clearTimeout(previewTimer)
    previewTimer = undefined 
  }
  if (!val || String(val).trim() === '') {
    previewLoading.value = false
    return
  }
  
  previewLoading.value = false
  previewTimer = window.setTimeout(async () => {
    previewLoading.value = true
    try {
      await loadImage(String(val))
      avatarPreview.value = String(val)
      previewError.value = false
      errors.avatarUrl = ''
    } catch (e) {
      avatarPreview.value = null
      previewError.value = true
    } finally {
      previewLoading.value = false
    }
  }, 600)
})

// Watchers
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    // Initialize form with member data
    formData.username = props.member.name
    formData.avatarUrl = props.member.avatarUrl || ''
    avatarPreview.value = props.member.avatarUrl || null
  } else {
    resetForm()
  }
})

onBeforeUnmount(() => {
  if (previewTimer) window.clearTimeout(previewTimer)
})

// Methods
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const validateUsername = () => {
  const username = formData.username.trim()
  if (!username) {
    errors.username = 'Username is required'
  } else if (username.length < 2) {
    errors.username = 'Username must be at least 2 characters'
  } else if (username.length > 50) {
    errors.username = 'Username must be less than 50 characters'
  } else {
    errors.username = ''
  }
}

const handleCloudinaryUpload = async (event: Event) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    ElMessage.error('Cloudinary configuration not found. Please check your .env file.')
    return
  }

  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  // Validate file
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('Only image files can be uploaded')
    return
  }
  if (!isLt10M) {
    ElMessage.error('Image size must be less than 10MB')
    return
  }
  
  isUploading.value = true

  try {
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    formDataUpload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formDataUpload
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`)
    }

    const data = await response.json()
    formData.avatarUrl = data.secure_url
    ElMessage.success('Image uploaded successfully')
  } catch (error: any) {
    console.error('Cloudinary upload error:', error)
    ElMessage.error(`Upload failed: ${error.message}`)
  } finally {
    isUploading.value = false
    // Reset file input
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

const handleAvatarUrlChange = () => {
  errors.avatarUrl = ''
}

const handleImageError = () => {
  previewError.value = true
  avatarPreview.value = null
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  // Validate all fields
  validateUsername()
  
  if (!isFormValid.value) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    // Emit the update event with form data
    emit('update-member', {
      id: props.member.id,
      username: formData.username.trim(),
      avatar: null, // No longer using file upload directly
      avatarUrl: formData.avatarUrl.trim() || null
    })
    
    // Close modal after successful submission
    handleClose()
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  formData.username = ''
  formData.avatarUrl = ''
  errors.username = ''
  errors.avatarUrl = ''
  avatarPreview.value = null
  isSubmitting.value = false
  isUploading.value = false
  previewLoading.value = false
  previewError.value = false
  if (previewTimer) {
    window.clearTimeout(previewTimer)
    previewTimer = undefined
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

// Modal Overlay
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-modal-backdrop;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
  background: linear-gradient(
    135deg,
    rgba(147, 197, 253, 0.3) 0%,
    rgba(196, 181, 253, 0.3) 50%,
    rgba(252, 211, 77, 0.2) 100%
  );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  &.dark-mode {
    background: linear-gradient(
      135deg,
      rgba(30, 58, 138, 0.4) 0%,
      rgba(88, 28, 135, 0.4) 50%,
      rgba(120, 53, 15, 0.3) 100%
    );
  }
}

// Modal Container
.modal-container {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: auto;
}

// Modal Card
.modal-card {
  background: var(--zen-surface);
  border-radius: $radius-2xl;
  box-shadow: $shadow-2xl;
  border: 1px solid var(--zen-border-glass);
  overflow: hidden;
}

// Modal Header
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-5 $space-6;
  background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
  color: white;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: $space-3;
  font-size: $text-title-md;
  font-weight: $font-weight-bold;
  margin: 0;

  i {
    font-size: 24px;
  }
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: $radius-md;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  i {
    font-size: 20px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
  }
}

// Modal Body
.modal-body {
  padding: $space-6;
}

// Avatar Section
.avatar-section {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-bottom: $space-6;
  padding-bottom: $space-6;
  border-bottom: 1px solid var(--zen-border-light);
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  width: 100%;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-3 $space-5;
  border-radius: $radius-lg;
  background: var(--zen-accent-teal);
  color: white;
  font-size: $text-body-sm;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: var(--zen-accent-teal-dark, #0891B2);
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }

  i {
    font-size: 18px;
  }
}

.hint {
  font-size: $text-body-xs;
  color: var(--zen-text-muted);
  text-align: center;
  margin: 0;
}

.preview,
.preview-loading,
.preview-error {
  margin-top: $space-3;
  text-align: center;
}

.preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
  object-fit: cover;
}

.preview-loading {
  font-size: $text-body-sm;
  color: var(--zen-text-muted);
}

.preview-error {
  font-size: $text-body-sm;
  color: #EF4444;
}

// Form
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;

  .full-width {
    grid-column: 1 / -1;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.form-label {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-body-sm;
  font-weight: $font-weight-semibold;
  color: var(--zen-text-heading);

  i {
    font-size: 16px;
    color: var(--zen-accent-teal);
  }
}

.form-input {
  padding: $space-3 $space-4;
  border: 1px solid var(--zen-border-medium);
  border-radius: $radius-lg;
  background: var(--zen-bg-secondary);
  color: var(--zen-text-heading);
  font-size: $text-body-sm;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--zen-accent-teal);
    box-shadow: 0 0 0 3px var(--zen-accent-teal-alpha, rgba(6, 182, 212, 0.1));
  }

  &.error {
    border-color: #EF4444;
  }

  &::placeholder {
    color: var(--zen-text-muted);
  }
}

.error-message {
  font-size: $text-body-xs;
  color: #EF4444;
  margin-top: -$space-1;
}

// Modal Footer
.modal-footer {
  display: flex;
  gap: $space-3;
  justify-content: flex-end;
  margin-top: $space-6;
  padding-top: $space-6;
  border-top: 1px solid var(--zen-border-light);
}

.btn {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-5;
  border-radius: $radius-lg;
  font-size: $text-body-sm;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  i {
    font-size: 18px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: var(--zen-bg-secondary);
  color: var(--zen-text-heading);
  border: 1px solid var(--zen-border-medium);

  &:hover:not(:disabled) {
    background: var(--zen-border-light);
  }
}

.btn-primary {
  background: linear-gradient(135deg, var(--zen-accent-teal), #0ea5e9);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }
}

// Transitions
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

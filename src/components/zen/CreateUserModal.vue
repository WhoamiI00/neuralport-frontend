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
                <i class="mdi mdi-account-plus"></i>
                {{ t('user.createNew') }}
              </h2>
              <button class="close-btn" @click="handleClose" title="Close">
                <i class="mdi mdi-close"></i>
              </button>
            </div>

            <!-- Body -->
            <form class="modal-body" @submit.prevent="handleSubmit">
              <!-- Device Selector (Pool Admin only) -->
              <div v-if="isPoolAdmin && devices.length > 0" class="form-group full-width device-selector-group">
                <label class="form-label">
                  <i class="mdi mdi-virtual-reality"></i>
                  Select Device
                </label>
                <select
                  v-model="formData.selectedDeviceId"
                  class="form-input"
                  :class="{ 'error': errors.device }"
                >
                  <option :value="null" disabled>-- Select a device --</option>
                  <option v-for="device in devices" :key="device.id" :value="device.id">
                    {{ device.name || device.device_id }}
                  </option>
                </select>
                <span v-if="errors.device" class="error-message">{{ errors.device }}</span>
              </div>

              <!-- Avatar Upload Section -->
              <div class="avatar-section">
                <label class="form-label">
                  <i class="mdi mdi-image-outline"></i>
                  {{ t('user.profileImage') }}
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
                    <span v-if="!isUploading">{{ t('user.uploadImage') }}</span>
                    <span v-else>{{ t('user.uploading') }}</span>
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
                    :placeholder="t('user.enterImageUrl')"
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
                <!-- PIN Input -->
                <div class="form-group">
                  <label class="form-label">
                    <i class="mdi mdi-dialpad"></i>
                    {{ t('user.fourDigitPin') }}
                  </label>
                  <input
                    v-model="formData.pin"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="4"
                    class="form-input"
                    :class="{ 'error': errors.pin }"
                    :placeholder="t('user.enterPin')"
                    @input="validatePin"
                  />
                  <span v-if="errors.pin" class="error-message">{{ errors.pin }}</span>
                </div>

                <!-- Username Input -->
                <div class="form-group full-width">
                  <label class="form-label">
                    <i class="mdi mdi-account-outline"></i>
                    {{ t('user.username') }}
                  </label>
                  <input
                    v-model="formData.username"
                    type="text"
                    class="form-input"
                    :class="{ 'error': errors.username }"
                    :placeholder="t('user.enterUsername')"
                    @input="validateUsername"
                    @blur="validateUsername"
                  />
                  <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
                </div>
              </div>

              <!-- Tag Selection (Pool Admin only) -->
              <div v-if="isPoolAdmin && selectableTags.length > 0" class="form-group full-width tag-selection-group">
                <label class="form-label">
                  <i class="mdi mdi-tag-multiple"></i>
                  Select Tags <span class="required">*</span>
                </label>
                
                <!-- Team tags auto-assigned notice -->
                <div v-if="teamTagsAutoAssigned.length > 0" class="auto-assigned-notice">
                  <i class="mdi mdi-information-outline"></i>
                  <span>Team tags auto-assigned: </span>
                  <span 
                    v-for="tag in teamTagsAutoAssigned" 
                    :key="tag.id" 
                    class="team-tag-badge"
                    :style="{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }"
                  >
                    {{ tag.name }}
                  </span>
                </div>
                
                <!-- Selectable tags -->
                <div class="tag-checkbox-grid">
                  <label 
                    v-for="tag in selectableTags" 
                    :key="tag.id" 
                    class="tag-checkbox-item"
                    :class="{ 'selected': formData.selectedTagIds.includes(tag.id) }"
                  >
                    <input
                      type="checkbox"
                      :value="tag.id"
                      v-model="formData.selectedTagIds"
                      @change="errors.tags = ''"
                    />
                    <span 
                      class="tag-label"
                      :style="{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }"
                    >
                      {{ tag.name }}
                    </span>
                  </label>
                </div>
                <span v-if="errors.tags" class="error-message">{{ errors.tags }}</span>
              </div>

              <!-- Footer Actions -->
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="handleClose">
                  {{ t('action.cancel') }}
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="isSubmitting || !isFormValid"
                >
                  <i v-if="isSubmitting" class="mdi mdi-loading mdi-spin"></i>
                  <i v-else class="mdi mdi-account-plus"></i>
                  {{ isSubmitting ? t('user.creating') : t('user.createUser') }}
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
import { useLanguage } from '../../composables/useLanguage'
import { ElMessage } from 'element-plus'

interface PoolTag {
  id: number
  name: string
  color: string
  is_team_tag: boolean
  is_admin_tag: boolean
}

interface Props {
  modelValue: boolean
  existingPins?: string[]  // List of existing member PINs to check for duplicates
  devices?: Array<{ id: number; name: string; device_id: string }>  // Pool admin devices
  isPoolAdmin?: boolean  // Whether this is pool admin mode
  availableTags?: PoolTag[]  // Tags available for selection (Pool Admin mode)
  adminTagIds?: number[]  // Admin's assigned tag IDs (team tags auto-assigned)
}

const props = withDefaults(defineProps<Props>(), {
  existingPins: () => [],
  devices: () => [],
  isPoolAdmin: false,
  availableTags: () => [],
  adminTagIds: () => []
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'create-user', userData: {
    pin: string
    username: string
    avatar: File | null
    avatarUrl: string | null
    tenantId?: number
    selectedTagIds?: number[]
  }): void
}>()

const { isDark } = useTheme()
const { t } = useLanguage()

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// Form state
const formData = reactive({
  pin: '',
  username: '',
  avatarUrl: '',
  selectedDeviceId: null as number | null,
  selectedTagIds: [] as number[]
})

const errors = reactive({
  pin: '',
  username: '',
  avatarUrl: '',
  device: '',
  tags: ''
})

// Computed: Get selectable tags (non-team-tags that admin has access to)
const selectableTags = computed(() => {
  return props.availableTags.filter(tag => !tag.is_team_tag && tag.is_admin_tag)
})

// Computed: Get team tags that will be auto-assigned
const teamTagsAutoAssigned = computed(() => {
  return props.availableTags.filter(tag => tag.is_team_tag && tag.is_admin_tag)
})

const fileInputRef = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const isSubmitting = ref(false)
const isUploading = ref(false)
const previewLoading = ref(false)
const previewError = ref(false)

let previewTimer: number | undefined

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

// Computed
const isFormValid = computed(() => {
  // Pool admin requires device selection
  if (props.isPoolAdmin && !formData.selectedDeviceId) {
    return false
  }
  // Pool admin requires at least one regular tag to be selected
  if (props.isPoolAdmin && selectableTags.value.length > 0 && formData.selectedTagIds.length === 0) {
    return false
  }
  return (
    formData.pin.length === 4 &&
    formData.username.trim().length >= 2 &&
    !errors.pin &&
    !errors.username &&
    !errors.avatarUrl &&
    !errors.tags
  )
})

// Watchers
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})

onBeforeUnmount(() => {
  if (previewTimer) window.clearTimeout(previewTimer)
})

// Methods
const validatePin = () => {
  // Only allow numeric input
  formData.pin = formData.pin.replace(/[^0-9]/g, '').slice(0, 4)
  
  if (formData.pin.length > 0 && formData.pin.length < 4) {
    errors.pin = 'PIN must be exactly 4 digits'
  } else if (formData.pin.length === 4 && props.existingPins.includes(formData.pin)) {
    // Check for duplicate PIN - don't reveal whose PIN it is
    errors.pin = 'A member with this PIN already exists'
  } else {
    errors.pin = ''
  }
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

const triggerFileInput = () => {
  fileInputRef.value?.click()
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
  validatePin()
  validateUsername()
  
  // Pool admin requires device selection
  if (props.isPoolAdmin && !formData.selectedDeviceId) {
    errors.device = 'Please select a device'
    return
  }
  
  // Pool admin requires at least one regular tag
  if (props.isPoolAdmin && selectableTags.value.length > 0 && formData.selectedTagIds.length === 0) {
    errors.tags = 'Please select at least one tag'
    return
  }
  
  if (!isFormValid.value) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    // Emit the create event with form data
    emit('create-user', {
      pin: formData.pin,
      username: formData.username.trim(),
      avatar: null,
      avatarUrl: formData.avatarUrl.trim() || null,
      tenantId: formData.selectedDeviceId || undefined,
      selectedTagIds: props.isPoolAdmin ? formData.selectedTagIds : undefined
    })
    
    // Close modal after successful submission
    handleClose()
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  formData.pin = ''
  formData.username = ''
  formData.avatarUrl = ''
  formData.selectedDeviceId = null
  formData.selectedTagIds = []
  errors.pin = ''
  errors.username = ''
  errors.avatarUrl = ''
  errors.device = ''
  errors.tags = ''
  avatarPreview.value = null
  isSubmitting.value = false
  isUploading.value = false
  previewLoading.value = false
  previewError.value = false
  if (previewTimer) {
    window.clearTimeout(previewTimer)
    previewTimer = undefined
  }
  avatarPreview.value = null
  isSubmitting.value = false
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
  background: linear-gradient(135deg, var(--zen-accent-teal) 0%, #0ea5e9 100%);
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

// Form Grid
.form-grid {
  display: grid;
  grid-template-columns: 0.6fr 1fr;
  gap: $space-4;
  overflow: hidden;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  min-width: 0;
  overflow: hidden;

  &.full-width {
    grid-column: 1 / -1;
  }
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
    color: var(--zen-text-muted);
  }
}

.form-input {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: $space-3 $space-4;
  border: 1px solid var(--zen-border-medium);
  border-radius: $radius-lg;
  background: var(--zen-bg-secondary);
  color: var(--zen-text-primary);
  font-size: $text-body-md;
  transition: all 0.2s ease;

  &::placeholder {
    color: var(--zen-text-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--zen-accent-teal);
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
  }

  &.error {
    border-color: var(--zen-accent-danger);
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }
  }
}

.password-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: $space-3;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--zen-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  transition: all 0.2s ease;

  i {
    font-size: 18px;
  }

  &:hover {
    color: var(--zen-text-primary);
    background: var(--zen-bg-secondary);
  }
}

.error-message {
  font-size: $text-body-xs;
  color: var(--zen-accent-danger);
  display: flex;
  align-items: center;
  gap: $space-1;
}

// Modal Footer
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  margin-top: $space-6;
  padding-top: $space-5;
  border-top: 1px solid var(--zen-border-light);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  color: var(--zen-text-secondary);
  border: 1px solid var(--zen-border-medium);

  &:hover:not(:disabled) {
    background: var(--zen-surface-hover);
    color: var(--zen-text-primary);
  }
}

.btn-primary {
  background: linear-gradient(135deg, var(--zen-accent-teal) 0%, #0ea5e9 100%);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
  }
}

// Transitions
.modal-fade-enter-active {
  animation: modalFadeIn 0.3s ease-out;
  
  .modal-card {
    animation: modalSlideUp 0.3s ease-out;
  }
}

.modal-fade-leave-active {
  animation: modalFadeIn 0.2s ease-in reverse;
  
  .modal-card {
    animation: modalSlideUp 0.2s ease-in reverse;
  }
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// Tag Selection Styles
.tag-selection-group {
  margin-top: $space-4;
  
  .required {
    color: #EF4444;
  }
  
  .auto-assigned-notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-2;
    padding: $space-3;
    background: var(--zen-surface-secondary);
    border-radius: $radius-lg;
    font-size: $text-body-sm;
    color: var(--zen-text-muted);
    margin-bottom: $space-3;
    
    i {
      color: var(--zen-accent-teal);
    }
    
    .team-tag-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid;
    }
  }
  
  .tag-checkbox-grid {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
  }
  
  .tag-checkbox-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    
    input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .tag-label {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      border: 2px solid;
      transition: all 0.2s ease;
      opacity: 0.6;
    }
    
    &.selected .tag-label {
      opacity: 1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    
    &:hover .tag-label {
      opacity: 0.85;
    }
  }
}
</style>

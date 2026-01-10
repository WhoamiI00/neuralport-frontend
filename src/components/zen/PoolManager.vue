<template>
  <div class="pool-manager" :class="{ 'dark-mode': isDark }">
    <!-- Header -->
    <div class="manager-header">
      <div class="header-title">
        <i class="mdi mdi-domain"></i>
        <h3>VR Pools / Team Units</h3>
      </div>
      <button class="create-btn" @click="showCreateModal = true">
        <i class="mdi mdi-plus"></i>
        Create Pool
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="mdi mdi-loading mdi-spin"></i>
      <span>Loading pools...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="pools.length === 0" class="empty-state">
      <i class="mdi mdi-folder-network-outline"></i>
      <p>No pools created yet</p>
      <span>Create a pool to share users and data across multiple VR devices</span>
    </div>

    <!-- Pool List -->
    <div v-else class="pool-list">
      <div
        v-for="pool in pools"
        :key="pool.id"
        class="pool-card"
        :class="{ active: selectedPoolId === pool.id }"
        @click="selectPool(pool)"
      >
        <div class="pool-info">
          <div class="pool-name">{{ pool.name }}</div>
          <div class="pool-description" v-if="pool.description">{{ pool.description }}</div>
          <div class="pool-stats">
            <span class="stat">
              <i class="mdi mdi-monitor"></i>
              {{ pool.device_count }} device{{ pool.device_count !== 1 ? 's' : '' }}
            </span>
            <span class="stat">
              <i class="mdi mdi-account-group"></i>
              {{ pool.user_count }} user{{ pool.user_count !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>
        <div class="pool-actions">
          <button class="action-btn" @click.stop="editPool(pool)" title="Edit pool">
            <i class="mdi mdi-pencil"></i>
          </button>
          <button class="action-btn danger" @click.stop="confirmDeletePool(pool)" title="Delete pool">
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Pool Detail Panel (when pool selected) -->
    <div v-if="selectedPool" class="pool-detail">
      <div class="detail-header">
        <h4>{{ selectedPool.name }}</h4>
        <button class="close-btn" @click="selectedPoolId = null">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <!-- Tabs -->
      <div class="detail-tabs">
        <button
          :class="['tab', { active: activeTab === 'devices' }]"
          @click="activeTab = 'devices'"
        >
          <i class="mdi mdi-monitor"></i>
          Devices ({{ poolDevices.length }})
        </button>
        <button
          :class="['tab', { active: activeTab === 'users' }]"
          @click="activeTab = 'users'"
        >
          <i class="mdi mdi-account-group"></i>
          Users ({{ poolUsers.length }})
        </button>
        <button
          :class="['tab', { active: activeTab === 'admins' }]"
          @click="activeTab = 'admins'; loadPoolAdmins()"
        >
          <i class="mdi mdi-shield-account"></i>
          Admins ({{ poolAdmins.length }})
        </button>
        <button
          :class="['tab', { active: activeTab === 'conflicts' }]"
          @click="activeTab = 'conflicts'"
        >
          <i class="mdi mdi-alert-circle"></i>
          Conflicts ({{ poolConflicts.length }})
          <span v-if="poolConflicts.length > 0" class="conflict-badge">!</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Devices Tab -->
        <div v-if="activeTab === 'devices'" class="devices-tab">
          <div class="add-device-section">
            <el-select
              v-model="selectedDeviceToAdd"
              placeholder="Select device to add..."
              filterable
              :disabled="availableDevices.length === 0"
              class="device-select"
            >
              <el-option
                v-for="device in availableDevices"
                :key="device.id"
                :label="`${device.name} (${device.device_id})`"
                :value="device.id"
              />
            </el-select>
            <button
              class="add-btn"
              :disabled="!selectedDeviceToAdd"
              @click="addDevice"
            >
              <i class="mdi mdi-plus"></i>
              Add Device
            </button>
          </div>

          <div v-if="poolDevices.length === 0" class="empty-tab">
            <i class="mdi mdi-monitor-off"></i>
            <span>No devices in this pool</span>
          </div>
          <div v-else class="device-list">
            <div v-for="device in poolDevices" :key="device.id" class="device-item">
              <div class="device-info">
                <i class="mdi mdi-monitor"></i>
                <div>
                  <div class="device-name">{{ device.name }}</div>
                  <div class="device-id">{{ device.device_id }}</div>
                </div>
              </div>
              <div class="device-stats">
                <span>{{ device.user_count || 0 }} users</span>
              </div>
              <button class="remove-btn" @click="removeDevice(device)" title="Remove from pool">
                <i class="mdi mdi-close"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Users Tab -->
        <div v-if="activeTab === 'users'" class="users-tab">
          <div v-if="poolUsers.length === 0" class="empty-tab">
            <i class="mdi mdi-account-off"></i>
            <span>No users in this pool</span>
          </div>
          <div v-else class="user-list">
            <div v-for="user in poolUsers" :key="user.id" class="user-item">
              <div class="user-avatar">
                <img
                  v-if="user.portrait_image"
                  :src="user.portrait_image"
                  :alt="formatName(user.name)"
                />
                <i v-else class="mdi mdi-account"></i>
              </div>
              <div class="user-info">
                <div class="user-name">{{ formatName(user.name) }}</div>
                <div class="user-details">
                  <span class="pin">PIN: {{ user.pin }}</span>
                  <span class="home-device">Root VR: {{ user.home_device }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Conflicts Tab -->
        <div v-if="activeTab === 'conflicts'" class="conflicts-tab">
          <div v-if="poolConflicts.length === 0" class="empty-tab success">
            <i class="mdi mdi-check-circle"></i>
            <span>No PIN conflicts</span>
            <p>All users have unique PINs across devices</p>
          </div>
          <div v-else class="conflict-list">
            <div class="conflict-warning">
              <i class="mdi mdi-alert"></i>
              <span>{{ poolConflicts.length }} PIN conflict{{ poolConflicts.length !== 1 ? 's' : '' }} detected</span>
              <p>Users with the same PIN will see combined data from all devices</p>
            </div>
            <div v-for="conflict in poolConflicts" :key="conflict.pin" class="conflict-item">
              <div class="conflict-pin">
                <span class="pin-badge">PIN {{ conflict.pin }}</span>
                <span class="user-count">{{ conflict.users.length }} users</span>
              </div>
              <div class="conflict-users">
                <div v-for="user in conflict.users" :key="user.user_id" class="conflict-user">
                  <span class="user-name">{{ user.user_name }}</span>
                  <span class="device-name">{{ user.device_name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Admins Tab -->
        <div v-if="activeTab === 'admins'" class="admins-tab">
          <div class="add-admin-section">
            <button class="add-btn" @click="showAdminModal = true">
              <i class="mdi mdi-plus"></i>
              Add Team Admin
            </button>
          </div>

          <div v-if="loadingAdmins" class="loading-state small">
            <i class="mdi mdi-loading mdi-spin"></i>
            <span>Loading admins...</span>
          </div>
          <div v-else-if="poolAdmins.length === 0" class="empty-tab">
            <i class="mdi mdi-shield-account-outline"></i>
            <span>No team admins for this pool</span>
            <p>Team admins can manage users with specific tags</p>
          </div>
          <div v-else class="admin-list">
            <div v-for="admin in poolAdmins" :key="admin.id" class="admin-item">
              <div class="admin-info">
                <i class="mdi mdi-shield-account"></i>
                <div>
                  <div class="admin-name">{{ admin.name || admin.email }}</div>
                  <div class="admin-email" v-if="admin.name">{{ admin.email }}</div>
                  <div class="admin-tags">
                    <span v-for="tag in (admin.tag_names || admin.assigned_tags || [])" :key="tag" class="tag-badge">
                      {{ tag }}
                    </span>
                    <span v-if="(admin.tag_names || admin.assigned_tags || []).length === 0" class="no-tags">
                      No tags assigned
                    </span>
                  </div>
                </div>
              </div>
              <div class="admin-status">
                <span :class="['status-badge', admin.is_active ? 'active' : 'inactive']">
                  {{ admin.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="admin-actions">
                <button class="action-btn" @click="editPoolAdmin(admin)" title="Edit admin">
                  <i class="mdi mdi-pencil"></i>
                </button>
                <button class="action-btn danger" @click="confirmDeleteAdmin(admin)" title="Delete admin">
                  <i class="mdi mdi-delete"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Pool Modal -->
    <el-dialog
      v-model="showCreateModal"
      :title="editingPool ? 'Edit Pool' : 'Create Pool'"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="form-group">
        <label>Pool Name *</label>
        <el-input
          v-model="poolForm.name"
          placeholder="e.g., Tokyo Office Pool"
          :maxlength="100"
        />
      </div>
      <div class="form-group">
        <label>Description</label>
        <el-input
          v-model="poolForm.description"
          type="textarea"
          placeholder="Optional description..."
          :rows="3"
        />
      </div>
      <template #footer>
        <button class="cancel-btn" @click="closeModal">Cancel</button>
        <button
          class="submit-btn"
          :disabled="!poolForm.name.trim() || submitting"
          @click="submitPool"
        >
          {{ submitting ? 'Saving...' : (editingPool ? 'Update' : 'Create') }}
        </button>
      </template>
    </el-dialog>

    <!-- Delete Confirmation Modal -->
    <el-dialog
      v-model="showDeleteConfirm"
      title="Delete Pool"
      width="400px"
    >
      <div class="delete-warning">
        <i class="mdi mdi-alert-circle"></i>
        <p>Are you sure you want to delete <strong>{{ deletingPool?.name }}</strong>?</p>
        <p>This will remove all devices from the pool. Devices and their users will not be deleted.</p>
      </div>
      <template #footer>
        <button class="cancel-btn" @click="showDeleteConfirm = false">Cancel</button>
        <button class="danger-btn" @click="deletePoolConfirmed">Delete Pool</button>
      </template>
    </el-dialog>

    <!-- Create/Edit Pool Admin Modal -->
    <el-dialog
      v-model="showAdminModal"
      :title="editingAdmin ? 'Edit Team Admin' : 'Add Team Admin'"
      width="450px"
      :close-on-click-modal="false"
    >
      <div class="form-group">
        <label>Email *</label>
        <el-input
          v-model="adminForm.email"
          placeholder="admin@example.com"
          type="email"
          :disabled="!!editingAdmin"
        />
      </div>
      <div class="form-group">
        <label>{{ editingAdmin ? 'New Password (leave blank to keep current)' : 'Password *' }}</label>
        <el-input
          v-model="adminForm.password"
          placeholder="Enter password"
          type="password"
          show-password
        />
      </div>
      <div class="form-group">
        <label>Display Name</label>
        <el-input
          v-model="adminForm.name"
          placeholder="Optional display name"
        />
      </div>
      <div class="form-group">
        <label>Assigned Tags</label>
        <p class="form-hint">Admin will only see users with these tags (OR logic)</p>
        <el-select
          v-model="adminForm.assigned_tags"
          multiple
          filterable
          placeholder="Select tags..."
          style="width: 100%"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.id"
          />
        </el-select>
      </div>
      <div class="form-group" v-if="editingAdmin">
        <label>Status</label>
        <el-switch
          v-model="adminForm.is_active"
          active-text="Active"
          inactive-text="Inactive"
        />
      </div>
      <template #footer>
        <button class="cancel-btn" @click="closeAdminModal">Cancel</button>
        <button
          class="submit-btn"
          :disabled="!adminForm.email.trim() || (!editingAdmin && !adminForm.password.trim()) || submittingAdmin"
          @click="submitPoolAdmin"
        >
          {{ submittingAdmin ? 'Saving...' : (editingAdmin ? 'Update' : 'Create') }}
        </button>
      </template>
    </el-dialog>

    <!-- Delete Admin Confirmation Modal -->
    <el-dialog
      v-model="showDeleteAdminConfirm"
      title="Delete Team Admin"
      width="400px"
    >
      <div class="delete-warning">
        <i class="mdi mdi-alert-circle"></i>
        <p>Are you sure you want to delete <strong>{{ deletingAdmin?.name || deletingAdmin?.email }}</strong>?</p>
        <p>This admin will no longer be able to log in.</p>
      </div>
      <template #footer>
        <button class="cancel-btn" @click="showDeleteAdminConfirm = false">Cancel</button>
        <button class="danger-btn" @click="deleteAdminConfirmed">Delete Admin</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useNameFormat } from '../../composables/useNameFormat'
import {
  listPools,
  createPool,
  getPoolDetail,
  updatePool,
  deletePool,
  addDeviceToPool,
  removeDeviceFromPool,
  listPoolAdmins,
  createPoolAdmin,
  updatePoolAdmin,
  deletePoolAdmin,
  getPoolTags,
  type VRPool,
  type PoolDevice,
  type PoolUser,
  type PinConflict,
  type PoolAdmin
} from '../../lib/api'

// Props
interface Props {
  devices: { id: number; device_id: string; name: string; pool_id?: number }[]
  isDark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDark: false
})

// Emits
const emit = defineEmits<{
  (e: 'pool-updated'): void
}>()

// Name formatting
const { formatName } = useNameFormat()

// State
const loading = ref(true)
const submitting = ref(false)
const pools = ref<VRPool[]>([])
const selectedPoolId = ref<number | null>(null)
const activeTab = ref<'devices' | 'users' | 'admins' | 'conflicts'>('devices')

// Pool detail data
const poolDevices = ref<PoolDevice[]>([])
const poolUsers = ref<PoolUser[]>([])
const poolConflicts = ref<PinConflict[]>([])

// Pool Admin data
const poolAdmins = ref<PoolAdmin[]>([])
const loadingAdmins = ref(false)
const availableTags = ref<{ id: string; name: string }[]>([])

// Modal state
const showCreateModal = ref(false)
const showDeleteConfirm = ref(false)
const editingPool = ref<VRPool | null>(null)
const deletingPool = ref<VRPool | null>(null)
const poolForm = ref({ name: '', description: '' })

// Pool Admin modal state
const showAdminModal = ref(false)
const showDeleteAdminConfirm = ref(false)
const editingAdmin = ref<PoolAdmin | null>(null)
const deletingAdmin = ref<PoolAdmin | null>(null)
const submittingAdmin = ref(false)
const adminForm = ref({
  email: '',
  password: '',
  name: '',
  assigned_tags: [] as string[],
  is_active: true
})

// Device selection
const selectedDeviceToAdd = ref<number | null>(null)

// Computed
const selectedPool = computed(() => {
  return pools.value.find(p => p.id === selectedPoolId.value) || null
})

const availableDevices = computed(() => {
  // Devices not in any pool
  return props.devices.filter(d => !d.pool_id)
})

// Methods
async function loadPools() {
  loading.value = true
  try {
    pools.value = await listPools()
  } catch (error) {
    console.error('Failed to load pools:', error)
    ElMessage.error('Failed to load pools')
  } finally {
    loading.value = false
  }
}

async function selectPool(pool: VRPool) {
  if (selectedPoolId.value === pool.id) {
    selectedPoolId.value = null
    return
  }
  
  selectedPoolId.value = pool.id
  activeTab.value = 'devices'
  
  try {
    const [detail, admins, tags] = await Promise.all([
      getPoolDetail(pool.id),
      listPoolAdmins(pool.id),
      getPoolTags(pool.id)
    ])
    poolDevices.value = detail.devices
    poolUsers.value = detail.users
    poolConflicts.value = detail.conflicts
    poolAdmins.value = admins
    availableTags.value = tags
  } catch (error) {
    console.error('Failed to load pool detail:', error)
    ElMessage.error('Failed to load pool details')
  }
}

function editPool(pool: VRPool) {
  editingPool.value = pool
  poolForm.value = {
    name: pool.name,
    description: pool.description || ''
  }
  showCreateModal.value = true
}

function closeModal() {
  showCreateModal.value = false
  editingPool.value = null
  poolForm.value = { name: '', description: '' }
}

async function submitPool() {
  if (!poolForm.value.name.trim()) return
  
  submitting.value = true
  try {
    if (editingPool.value) {
      await updatePool(editingPool.value.id, {
        name: poolForm.value.name.trim(),
        description: poolForm.value.description.trim() || undefined
      })
      ElMessage.success('Pool updated')
    } else {
      await createPool(
        poolForm.value.name.trim(),
        poolForm.value.description.trim() || undefined
      )
      ElMessage.success('Pool created')
    }
    
    closeModal()
    await loadPools()
    emit('pool-updated')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to save pool')
  } finally {
    submitting.value = false
  }
}

function confirmDeletePool(pool: VRPool) {
  deletingPool.value = pool
  showDeleteConfirm.value = true
}

async function deletePoolConfirmed() {
  if (!deletingPool.value) return
  
  try {
    await deletePool(deletingPool.value.id)
    ElMessage.success('Pool deleted')
    
    if (selectedPoolId.value === deletingPool.value.id) {
      selectedPoolId.value = null
    }
    
    showDeleteConfirm.value = false
    deletingPool.value = null
    await loadPools()
    emit('pool-updated')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to delete pool')
  }
}

async function addDevice() {
  if (!selectedDeviceToAdd.value || !selectedPoolId.value) return
  
  try {
    const result = await addDeviceToPool(selectedPoolId.value, selectedDeviceToAdd.value)
    
    if (result.has_conflicts) {
      ElMessage.warning(result.warning || 'Device added with PIN conflicts')
    } else {
      ElMessage.success('Device added to pool')
    }
    
    selectedDeviceToAdd.value = null
    
    // Refresh pool detail
    await selectPool(selectedPool.value!)
    await loadPools()
    emit('pool-updated')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to add device')
  }
}

async function removeDevice(device: PoolDevice) {
  if (!selectedPoolId.value) return
  
  try {
    await removeDeviceFromPool(selectedPoolId.value, device.id)
    ElMessage.success('Device removed from pool')
    
    // Refresh pool detail
    await selectPool(selectedPool.value!)
    await loadPools()
    emit('pool-updated')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to remove device')
  }
}

// Pool Admin Methods
async function loadPoolAdmins() {
  if (!selectedPoolId.value) return
  
  loadingAdmins.value = true
  try {
    const [admins, tags] = await Promise.all([
      listPoolAdmins(selectedPoolId.value),
      getPoolTags(selectedPoolId.value)
    ])
    poolAdmins.value = admins
    availableTags.value = tags
  } catch (error) {
    console.error('Failed to load pool admins:', error)
    ElMessage.error('Failed to load team admins')
  } finally {
    loadingAdmins.value = false
  }
}

function editPoolAdmin(admin: PoolAdmin) {
  editingAdmin.value = admin
  adminForm.value = {
    email: admin.email,
    password: '',
    name: admin.name || '',
    assigned_tags: admin.assigned_tags || [],
    is_active: admin.is_active
  }
  showAdminModal.value = true
}

function closeAdminModal() {
  showAdminModal.value = false
  editingAdmin.value = null
  adminForm.value = {
    email: '',
    password: '',
    name: '',
    assigned_tags: [],
    is_active: true
  }
}

async function submitPoolAdmin() {
  if (!adminForm.value.email.trim()) return
  if (!editingAdmin.value && !adminForm.value.password.trim()) return
  if (!selectedPoolId.value) return
  
  submittingAdmin.value = true
  try {
    if (editingAdmin.value) {
      const updateData: any = {
        name: adminForm.value.name.trim() || null,
        assigned_tags: adminForm.value.assigned_tags,
        is_active: adminForm.value.is_active
      }
      if (adminForm.value.password.trim()) {
        updateData.password = adminForm.value.password
      }
      await updatePoolAdmin(selectedPoolId.value, editingAdmin.value.id, updateData)
      ElMessage.success('Team admin updated')
    } else {
      await createPoolAdmin(selectedPoolId.value, {
        email: adminForm.value.email.trim(),
        password: adminForm.value.password,
        name: adminForm.value.name.trim() || undefined,
        assigned_tags: adminForm.value.assigned_tags
      })
      ElMessage.success('Team admin created')
    }
    
    closeAdminModal()
    await loadPoolAdmins()
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to save team admin')
  } finally {
    submittingAdmin.value = false
  }
}

function confirmDeleteAdmin(admin: PoolAdmin) {
  deletingAdmin.value = admin
  showDeleteAdminConfirm.value = true
}

async function deleteAdminConfirmed() {
  if (!deletingAdmin.value || !selectedPoolId.value) return
  
  try {
    await deletePoolAdmin(selectedPoolId.value, deletingAdmin.value.id)
    ElMessage.success('Team admin deleted')
    
    showDeleteAdminConfirm.value = false
    deletingAdmin.value = null
    await loadPoolAdmins()
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to delete team admin')
  }
}

// Lifecycle
onMounted(() => {
  loadPools()
})

// Watch for device changes
watch(() => props.devices, () => {
  // Refresh when devices change
}, { deep: true })
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.pool-manager {
  padding: 20px;
  background: var(--zen-surface-elevated);
  border-radius: 0;
  color: var(--zen-text-primary);
  max-height: 70vh;
  overflow-y: auto;
  
  &.dark-mode {
    background: rgba(30, 41, 59, 0.95);
    color: #F1F5F9;
  }
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    
    i {
      font-size: 24px;
      color: var(--zen-accent-teal-dark);
    }
    
    h3 {
      margin: 0;
      font-size: 18px;
      color: var(--zen-text-heading);
    }
  }
  
  .create-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: var(--zen-accent-teal-dark);
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: var(--zen-accent-teal);
      transform: translateY(-1px);
    }
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--zen-text-muted);
  
  i {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }
  
  p {
    margin: 0 0 8px;
    font-size: 16px;
    color: var(--zen-text-secondary);
  }
  
  span {
    font-size: 13px;
    opacity: 0.7;
  }
}

.pool-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pool-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--zen-bg-secondary);
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  
  &:hover {
    background: var(--zen-surface-hover);
    box-shadow: var(--zen-shadow-sm);
  }
  
  &.active {
    border-color: var(--zen-accent-teal-dark);
    background: var(--zen-surface-elevated);
  }
  
  .pool-info {
    .pool-name {
      font-weight: 600;
      font-size: 15px;
      margin-bottom: 4px;
      color: var(--zen-text-heading);
    }
    
    .pool-description {
      font-size: 13px;
      color: var(--zen-text-secondary);
      margin-bottom: 8px;
    }
    
    .pool-stats {
      display: flex;
      gap: 16px;
      
      .stat {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--zen-text-muted);
        
        i {
          font-size: 14px;
        }
      }
    }
  }
  
  .pool-actions {
    display: flex;
    gap: 8px;
    
    .action-btn {
      padding: 8px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--zen-text-muted);
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: var(--zen-bg-secondary);
        color: var(--zen-text-primary);
      }
      
      &.danger:hover {
        background: rgba(239, 68, 68, 0.15);
        color: var(--zen-accent-danger);
      }
    }
  }
}

.pool-detail {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--zen-border-light);
  
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h4 {
      margin: 0;
      font-size: 16px;
      color: var(--zen-text-heading);
    }
    
    .close-btn {
      padding: 6px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--zen-text-muted);
      cursor: pointer;
      
      &:hover {
        background: var(--zen-bg-secondary);
      }
    }
  }
  
  .detail-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    
    .tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      background: var(--zen-bg-secondary);
      color: var(--zen-text-secondary);
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      
      &:hover {
        background: var(--zen-surface-hover);
      }
      
      &.active {
        background: var(--zen-accent-teal-dark);
        color: white;
      }
      
      .conflict-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--zen-accent-danger);
        color: white;
        font-size: 10px;
        font-weight: bold;
        border-radius: 50%;
      }
    }
  }
  
  .tab-content {
    min-height: 200px;
  }
}

.add-device-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  
  .device-select {
    flex: 1;
  }
  
  .add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: var(--zen-accent-teal-dark);
    color: white;
    cursor: pointer;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &:hover:not(:disabled) {
      background: var(--zen-accent-teal);
    }
  }
}

.empty-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--zen-text-muted);
  
  i {
    font-size: 36px;
    margin-bottom: 8px;
    opacity: 0.5;
  }
  
  &.success {
    i {
      color: var(--zen-accent-success);
      opacity: 1;
    }
  }
  
  p {
    margin: 8px 0 0;
    font-size: 12px;
    opacity: 0.7;
  }
}

.device-list,
.user-list,
.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.device-item,
.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--zen-bg-secondary);
  border-radius: 8px;
  
  .device-info,
  .user-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    
    i {
      font-size: 20px;
      color: var(--zen-accent-teal-dark);
    }
    
    .device-name,
    .user-name {
      font-weight: 500;
      color: var(--zen-text-heading);
    }
    
    .device-id,
    .user-details {
      font-size: 12px;
      color: var(--zen-text-muted);
      
      .pin,
      .home-device {
        margin-right: 12px;
      }
    }
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--zen-surface);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    i {
      font-size: 18px;
      color: var(--zen-text-muted);
    }
  }
  
  .device-stats,
  .user-stats {
    font-size: 12px;
    color: var(--zen-text-muted);
  }
  
  .remove-btn {
    padding: 6px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--zen-text-muted);
    cursor: pointer;
    
    &:hover {
      background: rgba(239, 68, 68, 0.15);
      color: var(--zen-accent-danger);
    }
  }
}

.conflict-warning {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  margin-bottom: 16px;
  
  i {
    font-size: 20px;
    color: var(--zen-accent-warning);
  }
  
  span {
    font-weight: 500;
    color: var(--zen-accent-warning);
  }
  
  p {
    width: 100%;
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--zen-text-muted);
  }
}

.conflict-item {
  padding: 12px;
  background: var(--zen-bg-secondary);
  border-radius: 8px;
  border-left: 3px solid var(--zen-accent-warning);
  
  .conflict-pin {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    
    .pin-badge {
      padding: 4px 10px;
      background: rgba(245, 158, 11, 0.2);
      border-radius: 4px;
      font-weight: 600;
      font-size: 13px;
      color: var(--zen-accent-warning);
    }
    
    .user-count {
      font-size: 12px;
      color: var(--zen-text-muted);
    }
  }
  
  .conflict-users {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .conflict-user {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: var(--zen-surface);
      border-radius: 6px;
      font-size: 12px;
      
      .user-name {
        font-weight: 500;
        color: var(--zen-text-heading);
      }
      
      .device-name {
        color: var(--zen-text-muted);
        
        &::before {
          content: '•';
          margin: 0 6px;
        }
      }
    }
  }
}

// Modal styles
.form-group {
  margin-bottom: 16px;
  
  label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--zen-text-secondary);
  }
}

.delete-warning {
  text-align: center;
  
  i {
    font-size: 48px;
    color: var(--zen-accent-danger);
    margin-bottom: 16px;
  }
  
  p {
    margin: 8px 0;
    color: var(--zen-text-primary);
    
    &:first-of-type {
      font-size: 15px;
    }
    
    &:last-child {
      font-size: 13px;
      color: var(--zen-text-muted);
    }
  }
}

.cancel-btn,
.submit-btn,
.danger-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-btn {
  background: var(--zen-bg-secondary);
  color: var(--zen-text-primary);
  
  &:hover {
    background: var(--zen-surface-hover);
  }
}

.submit-btn {
  background: var(--zen-accent-teal-dark);
  color: white;
  margin-left: 8px;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    background: var(--zen-accent-teal);
  }
}

.danger-btn {
  background: var(--zen-accent-danger);
  color: white;
  margin-left: 8px;
  
  &:hover {
    opacity: 0.9;
  }
}

// Admin Tab Styles
.admins-tab {
  .add-admin-section {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    
    .add-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      background: var(--zen-accent-teal-dark);
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: var(--zen-accent-teal);
      }
    }
  }
}

.admin-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--zen-surface-elevated);
  border-radius: 8px;
  
  .admin-info {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex: 1;
    
    > i {
      font-size: 24px;
      color: var(--zen-accent-teal-dark);
      margin-top: 2px;
    }
    
    .admin-name {
      font-weight: 600;
      color: var(--zen-text-heading);
    }
    
    .admin-email {
      font-size: 12px;
      color: var(--zen-text-muted);
    }
    
    .admin-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
      
      .tag-badge {
        padding: 2px 8px;
        font-size: 11px;
        border-radius: 12px;
        background: var(--zen-accent-teal-dark);
        color: white;
      }
      
      .no-tags {
        font-size: 11px;
        color: var(--zen-text-muted);
        font-style: italic;
      }
    }
  }
  
  .admin-status {
    .status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      
      &.active {
        background: rgba(34, 197, 94, 0.15);
        color: var(--zen-accent-success);
      }
      
      &.inactive {
        background: rgba(239, 68, 68, 0.15);
        color: var(--zen-accent-danger);
      }
    }
  }
  
  .admin-actions {
    display: flex;
    gap: 6px;
    
    .action-btn {
      padding: 6px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--zen-text-muted);
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: var(--zen-bg-secondary);
        color: var(--zen-text-primary);
      }
      
      &.danger:hover {
        background: rgba(239, 68, 68, 0.15);
        color: var(--zen-accent-danger);
      }
    }
  }
}

.loading-state.small {
  padding: 20px;
  
  i {
    font-size: 24px;
  }
}

.form-hint {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--zen-text-muted);
}
</style>

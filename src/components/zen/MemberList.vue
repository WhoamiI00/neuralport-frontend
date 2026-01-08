<template>
  <div class="member-list">
    <!-- Header -->
    <div class="list-header">
      <span class="list-title">{{ t('dashboard.members') }}</span>
      <span class="member-count">
        {{ filteredMembers.length !== members.length ? `${filteredMembers.length} / ${members.length}` : members.length }}
      </span>
    </div>

    <!-- Search/Filter Section -->
    <div v-if="isAdmin || isSuperadmin" class="search-filter">
      <!-- Search Mode Toggle -->
      <div class="search-mode-toggle">
        <button 
          :class="['mode-btn', { active: searchMode === 'tags' }]"
          @click="searchMode = 'tags'"
          title="Filter by Tags"
        >
          <i class="mdi mdi-tag-multiple"></i>
          <span>Tags</span>
        </button>
        <button 
          :class="['mode-btn', { active: searchMode === 'name' }]"
          @click="searchMode = 'name'"
          title="Search by Name"
        >
          <i class="mdi mdi-account-search"></i>
          <span>Name</span>
        </button>
      </div>

      <!-- Tag Filter (when mode is tags) -->
      <div v-if="searchMode === 'tags'" class="filter-input">
        <el-select
          v-model="selectedTagIds"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          :placeholder="allTags.length > 0 ? 'Search tags to filter...' : 'No tags available'"
          :disabled="allTags.length === 0"
          size="default"
          clearable
          class="tag-filter-select"
        >
          <template #prefix>
            <i class="mdi mdi-tag-multiple-outline"></i>
          </template>
          <el-option
            v-for="tag in allTags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.id"
          >
            <div class="tag-option">
              <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
              <span class="tag-name">{{ tag.name }}</span>
              <span v-if="tag.category" class="tag-category">{{ tag.category }}</span>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- Name Search (when mode is name) -->
      <div v-else-if="searchMode === 'name'" class="filter-input">
        <div class="search-input-wrapper">
          <i class="mdi mdi-magnify search-icon"></i>
          <input
            v-model="nameSearch"
            type="text"
            placeholder="Search by member name..."
            class="search-input"
          />
          <button 
            v-if="nameSearch" 
            class="clear-btn"
            @click="nameSearch = ''"
          >
            <i class="mdi mdi-close"></i>
          </button>
        </div>
      </div>


    </div>

    <!-- Add New User Button -->
    <button 
      v-if="isAdmin || isSuperadmin"
      class="add-user-btn" 
      @click="openCreateUserModal"
    >
      <i class="mdi mdi-plus"></i>
      <span>{{ t('dashboard.addUser') }}</span>
    </button>

    <!-- Scrollable Members -->
    <div class="members-scroll">
      <MemberListItem
        v-for="member in filteredMembers"
        :key="member.id"
        :member="member"
        :is-selected="selectedMemberId === member.id"
        @select="handleSelect"
        @view-details="handleViewDetails"
      />
    </div>

    <!-- Create User Modal -->
    <CreateUserModal
      v-model="showCreateUserModal"
      :existing-pins="existingPins"
      :is-pool-admin="isPoolAdmin"
      :devices="poolDevices"
      :available-tags="availableTags"
      :admin-tag-ids="adminTagIds"
      @create-user="handleCreateUser"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import type { Member } from '../../data/members'
import type { Tag } from '../../lib/api'
import MemberListItem from './MemberListItem.vue'
import CreateUserModal from './CreateUserModal.vue'

const { t } = useLanguage()

interface PoolTag {
  id: number
  name: string
  color: string
  is_team_tag: boolean
  is_admin_tag: boolean
}

interface Props {
  members: Member[]
  selectedMemberId?: string | null
  isAdmin?: boolean
  isSuperadmin?: boolean
  isPoolAdmin?: boolean
  poolDevices?: Array<{ id: number; name: string; device_id: string }>
  availableTags?: PoolTag[]
  adminTagIds?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedMemberId: null,
  isAdmin: false,
  isSuperadmin: false,
  isPoolAdmin: false,
  poolDevices: () => [],
  availableTags: () => [],
  adminTagIds: () => []
})

// Computed: Extract all existing PINs from members
const existingPins = computed(() => {
  return props.members
    .filter(m => m.pin) // Only include members that have a PIN
    .map(m => m.pin as string)
})

const emit = defineEmits<{
  (e: 'select-member', member: Member): void
  (e: 'view-details', memberId: string): void
  (e: 'create-user', userData: { pin: string; username: string; avatar: File | null; avatarUrl: string | null; tenantId?: number; selectedTagIds?: number[] }): void
}>()

// Modal state
const showCreateUserModal = ref(false)

// Search mode: 'tags' or 'name'
const searchMode = ref<'tags' | 'name'>('tags')
const nameSearch = ref('')

// Restore selectedTagIds from localStorage
const savedTagIds = localStorage.getItem('memberList_selectedTagIds')
const selectedTagIds = ref<number[]>(savedTagIds ? JSON.parse(savedTagIds) : [])

// Watch for changes and persist to localStorage
watch(selectedTagIds, (newIds) => {
  if (newIds.length > 0) {
    localStorage.setItem('memberList_selectedTagIds', JSON.stringify(newIds))
  } else {
    localStorage.removeItem('memberList_selectedTagIds')
  }
}, { deep: true })

// Get all unique tags from members
const allTags = computed(() => {
  const tagMap = new Map<number, Tag>()
  
  props.members.forEach(member => {
    if (!member.tags || !Array.isArray(member.tags)) {
      return
    }
    
    member.tags.forEach((tag) => {
      // Skip null/undefined/invalid tags
      if (tag && tag.id && typeof tag.id === 'number' && !tagMap.has(tag.id)) {
        tagMap.set(tag.id, tag)
      }
    })
  })
  
  return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name))
})

// Filter members by selected tags
const filteredMembers = computed(() => {
  // Filter based on search mode
  if (searchMode.value === 'tags') {
    if (selectedTagIds.value.length === 0) {
      return props.members
    }
    
    return props.members.filter(member => {
      if (!member.tags || member.tags.length === 0) return false
      
      // Member must have at least one of the selected tags
      return member.tags.some(tag => tag && tag.id && selectedTagIds.value.includes(tag.id))
    })
  } else if (searchMode.value === 'name') {
    if (!nameSearch.value.trim()) {
      return props.members
    }
    
    const searchTerm = nameSearch.value.toLowerCase().trim()
    return props.members.filter(member => {
      return member.name?.toLowerCase().includes(searchTerm)
    })
  }
  
  return props.members
})

const handleSelect = (member: Member) => {
  emit('select-member', member)
}

const handleViewDetails = (memberId: string) => {
  emit('view-details', memberId)
}

const openCreateUserModal = () => {
  showCreateUserModal.value = true
}

const handleCreateUser = (userData: { pin: string; username: string; avatar: File | null; avatarUrl: string | null }) => {
  // Emit to parent component for handling (adding to list, API call, etc.)
  emit('create-user', userData)
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.member-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: $space-3;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-2 $space-3;
  margin-bottom: $space-2;
}

.search-filter {
  padding: 0 $space-3;
  margin-bottom: $space-3;
}

.search-mode-toggle {
  display: flex;
  gap: 6px;
  margin-bottom: $space-3;
  background: var(--zen-surface-secondary);
  border-radius: $radius-lg;
  padding: 4px;
  border: 1px solid var(--zen-border-light);

  .mode-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: var(--zen-text-secondary);
    font-size: $text-body-xs;
    font-weight: $font-weight-medium;
    border-radius: $radius-md;
    cursor: pointer;
    transition: all 0.2s ease;

    i {
      font-size: 16px;
    }

    span {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    &:hover {
      background: var(--zen-bg-hover);
      color: var(--zen-text-primary);
    }

    &.active {
      background: var(--zen-accent-primary);
      color: white;
      box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25);
    }
  }
}

.filter-input {
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 12px;
    font-size: 18px;
    color: var(--zen-text-muted);
    pointer-events: none;
    z-index: 1;
  }

  .search-input {
    width: 100%;
    padding: 10px 40px 10px 40px;
    background: var(--zen-surface-secondary);
    border: 1.5px solid var(--zen-border-medium);
    border-radius: $radius-lg;
    color: var(--zen-text-primary);
    font-size: $text-body-sm;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &::placeholder {
      color: var(--zen-text-muted);
    }

    &:hover {
      border-color: var(--zen-accent-primary);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
    }

    &:focus {
      outline: none;
      border-color: var(--zen-accent-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }

  .clear-btn {
    position: absolute;
    right: 8px;
    padding: 4px;
    background: transparent;
    border: none;
    color: var(--zen-text-muted);
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    i {
      font-size: 18px;
    }

    &:hover {
      background: var(--zen-bg-hover);
      color: var(--zen-text-primary);
    }
  }
}

:deep(.tag-filter-select) {
  width: 100%;
  
  .el-select__wrapper {
    background: var(--zen-surface-secondary);
    border: 1.5px solid var(--zen-border-medium);
    border-radius: $radius-lg;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    
    &:hover {
      border-color: var(--zen-accent-primary);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
    }

    &.is-focused {
      border-color: var(--zen-accent-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }

  .el-select__prefix {
    color: var(--zen-text-muted);
    font-size: 18px;
  }

  .el-select__tags {
    .el-tag {
      background: var(--zen-accent-primary-alpha);
      border-color: transparent;
      color: var(--zen-accent-primary);
      border-radius: $radius-md;
      font-weight: $font-weight-medium;
    }
  }
}

.tag-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  transition: all 0.2s ease;
}

.tag-color {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.tag-name {
  flex: 1;
  font-weight: $font-weight-medium;
  color: var(--zen-text-primary);
}

.tag-category {
  font-size: $text-body-xs;
  color: var(--zen-text-muted);
  text-transform: capitalize;
  padding: 2px 8px;
  background: var(--zen-surface-tertiary);
  border-radius: $radius-sm;
}

.list-title {
  font-size: $text-body-sm;
  font-weight: $font-weight-semibold;
  color: var(--zen-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.member-count {
  background: var(--zen-accent-teal-alpha, rgba(6, 182, 212, 0.15));
  color: var(--zen-accent-teal);
  font-size: $text-body-xs;
  font-weight: $font-weight-semibold;
  padding: 2px 8px;
  border-radius: $radius-full;
}

// Add User Button
.add-user-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  width: 100%;
  padding: $space-3;
  margin-bottom: $space-3;
  border: 2px dashed var(--zen-border-medium);
  border-radius: $radius-lg;
  background: transparent;
  color: var(--zen-text-secondary);
  font-size: $text-body-sm;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition: all 0.2s ease;

  i {
    font-size: 20px;
    transition: transform 0.2s ease;
  }

  &:hover {
    border-color: var(--zen-accent-teal);
    background: var(--zen-accent-teal-alpha, rgba(6, 182, 212, 0.1));
    color: var(--zen-accent-teal);

    i {
      transform: rotate(90deg);
    }
  }
}

.members-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: $space-1;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--zen-border-medium);
    border-radius: 2px;
  }
}
</style>

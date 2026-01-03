<template>
  <div class="member-list">
    <!-- Header -->
    <div class="list-header">
      <span class="list-title">{{ t('dashboard.members') }}</span>
      <span class="member-count">
        {{ selectedTagIds.length > 0 ? `${filteredMembers.length} / ${members.length}` : members.length }}
      </span>
    </div>

    <!-- Tag Filter -->
    <div v-if="isAdmin && allTags.length > 0" class="tag-filter">
      <div class="filter-label">
        <i class="mdi mdi-filter-variant"></i>
        <span>Filter by Tags</span>
      </div>
      <el-select
        v-model="selectedTagIds"
        multiple
        filterable
        collapse-tags
        collapse-tags-tooltip
        placeholder="Search tags to filter..."
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

    <!-- Add New User Button -->
    <button 
      v-if="isAdmin"
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
      @create-user="handleCreateUser"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import type { Member } from '../../data/members'
import type { Tag } from '../../lib/api'
import MemberListItem from './MemberListItem.vue'
import CreateUserModal from './CreateUserModal.vue'

const { t } = useLanguage()

interface Props {
  members: Member[]
  selectedMemberId?: string | null
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedMemberId: null,
  isAdmin: false
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
  (e: 'create-user', userData: { pin: string; username: string; avatar: File | null; avatarUrl: string | null }): void
}>()

// Modal state
const showCreateUserModal = ref(false)
const selectedTagIds = ref<number[]>([])

// Get all unique tags from members
const allTags = computed(() => {
  const tagMap = new Map<number, Tag>()
  props.members.forEach(member => {
    member.tags?.forEach(tag => {
      if (!tagMap.has(tag.id)) {
        tagMap.set(tag.id, tag)
      }
    })
  })
  return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name))
})

// Filter members by selected tags
const filteredMembers = computed(() => {
  if (selectedTagIds.value.length === 0) {
    return props.members
  }
  
  return props.members.filter(member => {
    if (!member.tags || member.tags.length === 0) return false
    
    // Member must have at least one of the selected tags
    return member.tags.some(tag => selectedTagIds.value.includes(tag.id))
  })
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

.tag-filter {
  padding: 0 $space-3;
  margin-bottom: $space-3;

  .filter-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: $text-body-xs;
    font-weight: $font-weight-semibold;
    color: var(--zen-text-secondary);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    i {
      font-size: 14px;
      opacity: 0.7;
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

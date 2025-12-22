<template>
  <div class="member-list">
    <!-- Header -->
    <div class="list-header">
      <span class="list-title">Members</span>
      <span class="member-count">{{ members.length }}</span>
    </div>

    <!-- Add New User Button -->
    <button 
      v-if="isAdmin"
      class="add-user-btn" 
      @click="openCreateUserModal"
    >
      <i class="mdi mdi-plus"></i>
      <span>Add User</span>
    </button>

    <!-- Scrollable Members -->
    <div class="members-scroll">
      <MemberListItem
        v-for="member in members"
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
import type { Member } from '../../data/members'
import MemberListItem from './MemberListItem.vue'
import CreateUserModal from './CreateUserModal.vue'

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

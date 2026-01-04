<template>
  <div class="tag-selector">
    <div class="tags-display">
      <TagBadge
        v-for="tag in selectedTags"
        :key="tag.id"
        :tag="tag"
        :removable="!readonly"
        @remove="handleRemoveTag"
      />
      <el-button
        v-if="!showInput && !readonly"
        type="primary"
        size="small"
        text
        :icon="Plus"
        @click="showInput = true"
      >
        Add Tag
      </el-button>
    </div>

    <el-autocomplete
      v-if="showInput"
      v-model="searchQuery"
      :fetch-suggestions="querySearch"
      placeholder="Type to search or create tags..."
      :trigger-on-focus="true"
      clearable
      size="default"
      class="tag-input"
      @select="handleSelectTag"
      @blur="handleBlur"
      @keyup.enter="handleEnterKey"
    >
      <template #prefix>
        <i class="mdi mdi-magnify search-icon"></i>
      </template>
      <template #default="{ item }">
        <div class="suggestion-item" :class="{ 'is-new': item._isNew }">
          <i v-if="item._isNew" class="mdi mdi-plus-circle new-tag-icon"></i>
          <TagBadge v-else :tag="item" />
          <span v-if="item._isNew" class="new-tag-text">Create "{{ item.name }}"</span>
        </div>
      </template>
    </el-autocomplete>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getTagSuggestions, createTag, assignTagsToUser, removeTagFromUser, type Tag } from '@/lib/api'
import TagBadge from './TagBadge.vue'

interface Props {
  userId: number
  modelValue?: Tag[]
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  readonly: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', tags: Tag[]): void
  (e: 'tags-updated'): void
}>()

const showInput = ref(false)
const searchQuery = ref('')
const allTags = ref<Tag[]>([])
const localTags = ref<Tag[]>([])

// Themed color palette (bluish/greenish)
const tagColorPalette = [
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky Blue
  '#14b8a6', // Teal
  '#10b981', // Emerald
  '#22c55e', // Green
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#0891b2', // Dark Cyan
  '#059669', // Dark Green
  '#2563eb', // Dark Blue
  '#7c3aed', // Purple
]

const getRandomColor = () => {
  return tagColorPalette[Math.floor(Math.random() * tagColorPalette.length)]
}

// Watch for prop changes to update local tags
watch(() => props.modelValue, (newTags) => {
  localTags.value = newTags || []
}, { immediate: true })

const selectedTags = computed({
  get: () => localTags.value,
  set: (val) => {
    localTags.value = val
    emit('update:modelValue', val)
  }
})

// Load all tags on mount (only if not readonly)
onMounted(() => {
  if (!props.readonly) {
    loadAllTags()
  }
})

async function loadAllTags() {
  // Don't load if readonly
  if (props.readonly) return
  
  try {
    allTags.value = await getTagSuggestions('', props.userId)
  } catch (error: any) {
    console.error('Error loading tags:', error)
  }
}

async function querySearch(queryString: string, cb: (results: any[]) => void) {
  // Don't fetch suggestions in readonly mode
  if (props.readonly) {
    cb([])
    return
  }
  
  try {
    const suggestions = await getTagSuggestions(queryString.trim(), props.userId)
    
    // Filter out already selected tags
    const available = suggestions.filter(
      tag => !selectedTags.value.some(t => t.id === tag.id)
    )
    
    // If no matches and query is not empty, suggest creating new tag
    if (available.length === 0 && queryString.trim()) {
      cb([{
        id: -1,
        name: queryString.trim(),
        color: getRandomColor(),
        _isNew: true
      }])
    } else {
      cb(available)
    }
  } catch (error: any) {
    console.error('Error fetching suggestions:', error)
    cb([])
  }
}

async function handleSelectTag(item: any) {
  try {
    let tag: Tag

    // If it's a new tag (not in system), create it first
    if (item._isNew) {
      console.log('[TagSelector] Creating new tag:', item.name)
      tag = await createTag({
        name: item.name,
        color: item.color
      })
      allTags.value.push(tag)
      ElMessage.success(`Created new tag "${tag.name}"`)
    } else {
      tag = item
      console.log('[TagSelector] Using existing tag:', tag)
    }

    // Assign tag to user
    console.log('[TagSelector] Assigning tag to user:', props.userId, tag.id)
    const result = await assignTagsToUser(props.userId, [tag.id])
    console.log('[TagSelector] Assignment result:', result)
    
    // Add to selected tags
    selectedTags.value = [...selectedTags.value, tag]
    
    // Reset input
    searchQuery.value = ''
    showInput.value = false
    
    // Emit update event
    console.log('[TagSelector] Emitting tags-updated')
    emit('tags-updated')
  } catch (error: any) {
    console.error('[TagSelector] Error assigning tag:', error)
    ElMessage.error(error.message || 'Failed to assign tag')
  }
}

async function handleRemoveTag(tagId: number) {
  try {
    await removeTagFromUser(props.userId, tagId)
    
    // Remove from selected tags
    selectedTags.value = selectedTags.value.filter(t => t.id !== tagId)
    
    ElMessage.success('Tag removed')
    
    // Emit update event
    emit('tags-updated')
  } catch (error: any) {
    console.error('Error removing tag:', error)
    ElMessage.error(error.message || 'Failed to remove tag')
  }
}

function handleBlur() {
  // Delay hiding to allow click event to register
  setTimeout(() => {
    if (!searchQuery.value) {
      showInput.value = false
    }
  }, 200)
}

function handleEnterKey() {
  // If there's a search query and no exact match, create new tag
  if (searchQuery.value.trim() && allTags.value.every(t => t.name.toLowerCase() !== searchQuery.value.toLowerCase())) {
    handleSelectTag({
      id: -1,
      name: searchQuery.value.trim(),
      color: getRandomColor(),
      _isNew: true
    })
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.tag-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .tags-display {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    min-height: 32px;
  }

  .tag-input {
    width: 100%;
    max-width: 300px;

    :deep(.el-input__wrapper) {
      background: var(--zen-surface-secondary);
      border: 1.5px solid var(--zen-border-medium);
      border-radius: $radius-lg;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      &:hover {
        border-color: var(--zen-accent-primary);
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
      }

      &.is-focus {
        border-color: var(--zen-accent-primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
    }

    :deep(.el-input__prefix) {
      .search-icon {
        color: var(--zen-text-muted);
        font-size: 18px;
      }
    }
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    transition: all 0.2s ease;

    &.is-new {
      .new-tag-icon {
        color: var(--zen-accent-primary);
        font-size: 20px;
      }

      .new-tag-text {
        color: var(--zen-accent-primary);
        font-weight: $font-weight-semibold;
      }
    }
  }
}
</style>

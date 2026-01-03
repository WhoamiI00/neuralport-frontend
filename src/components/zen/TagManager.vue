<template>
  <el-dialog
    v-model="dialogVisible"
    title="Manage Tags"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="tag-manager">
      <!-- Create New Tag -->
      <div class="create-section">
        <h4>Create New Tag</h4>
        <el-form :model="newTag" label-position="top" size="default">
          <el-form-item label="Tag Name" required>
            <el-input
              v-model="newTag.name"
              placeholder="e.g., Team A, Tokyo, Beginner"
              clearable
              @keyup.enter="handleCreateTag"
            />
          </el-form-item>
          
          <div class="form-row">
            <el-form-item label="Category" class="flex-1">
              <el-select v-model="newTag.category" placeholder="Optional" clearable>
                <el-option label="Team" value="team" />
                <el-option label="Location" value="location" />
                <el-option label="Age Group" value="age_group" />
                <el-option label="Department" value="department" />
                <el-option label="Skill Level" value="skill_level" />
                <el-option label="Shift" value="shift" />
                <el-option label="Custom" value="custom" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="Color" class="flex-1">
              <el-color-picker v-model="newTag.color" show-alpha :predefine="predefineColors" />
            </el-form-item>
          </div>
          
          <el-form-item label="Description (Optional)">
            <el-input
              v-model="newTag.description"
              type="textarea"
              :rows="2"
              placeholder="Brief description of this tag"
            />
          </el-form-item>
          
          <el-button
            type="primary"
            :loading="creating"
            @click="handleCreateTag"
            :disabled="!newTag.name.trim()"
          >
            Create Tag
          </el-button>
        </el-form>
      </div>

      <el-divider />

      <!-- Existing Tags -->
      <div class="tags-list">
        <h4>Existing Tags ({{ tags.length }})</h4>
        
        <el-empty v-if="tags.length === 0" description="No tags yet" :image-size="80" />
        
        <div v-else class="tags-grid">
          <div
            v-for="tag in tags"
            :key="tag.id"
            class="tag-item"
            :style="{ borderColor: tag.color }"
          >
            <div class="tag-info">
              <TagBadge :tag="tag" />
              <span v-if="tag.description" class="tag-description">{{ tag.description }}</span>
            </div>
            <el-button
              type="danger"
              size="small"
              text
              :icon="Delete"
              @click="handleDeleteTag(tag.id)"
              :loading="deletingIds.includes(tag.id)"
            >
              Delete
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">Close</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { listTags, createTag, deleteTag, type Tag, type CreateTagRequest } from '@/lib/api'
import TagBadge from './TagBadge.vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'refresh'): void
}>()

const dialogVisible = ref(props.modelValue)
const tags = ref<Tag[]>([])
const creating = ref(false)
const deletingIds = ref<number[]>([])

// Themed color palette (bluish/greenish)
const predefineColors = [
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
  return predefineColors[Math.floor(Math.random() * predefineColors.length)]
}

const newTag = reactive<CreateTagRequest>({
  name: '',
  category: '',
  color: getRandomColor(),
  description: ''
})

// Load tags on mount
loadTags()

async function loadTags() {
  try {
    tags.value = await listTags()
  } catch (error: any) {
    console.error('Error loading tags:', error)
    ElMessage.error(error.message || 'Failed to load tags')
  }
}

async function handleCreateTag() {
  if (!newTag.name.trim()) {
    ElMessage.warning('Please enter a tag name')
    return
  }

  creating.value = true
  try {
    const createdTag = await createTag({
      name: newTag.name.trim(),
      category: newTag.category || undefined,
      color: newTag.color,
      description: newTag.description || undefined
    })

    tags.value.push(createdTag)
    ElMessage.success(`Tag "${createdTag.name}" created successfully`)

    // Reset form with random color
    newTag.name = ''
    newTag.category = ''
    newTag.color = getRandomColor()
    newTag.description = ''

    emit('refresh')
  } catch (error: any) {
    console.error('Error creating tag:', error)
    ElMessage.error(error.message || 'Failed to create tag')
  } finally {
    creating.value = false
  }
}

async function handleDeleteTag(tagId: number) {
  const tag = tags.value.find(t => t.id === tagId)
  if (!tag) return

  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete the tag "${tag.name}"? This will remove it from all users.`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    deletingIds.value.push(tagId)
    await deleteTag(tagId)
    
    tags.value = tags.value.filter(t => t.id !== tagId)
    ElMessage.success(`Tag "${tag.name}" deleted successfully`)
    
    emit('refresh')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Error deleting tag:', error)
      ElMessage.error(error.message || 'Failed to delete tag')
    }
  } finally {
    deletingIds.value = deletingIds.value.filter(id => id !== tagId)
  }
}

// Watch for prop changes
import { watch } from 'vue'
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    loadTags()
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})
</script>

<style lang="scss" scoped>
@import '../../assets/scss/zen-variables';

.tag-manager {
  .create-section {
    h4 {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      color: var(--zen-text-heading);
    }

    .form-row {
      display: flex;
      gap: 16px;

      .flex-1 {
        flex: 1;
      }
    }
  }

  .tags-list {
    h4 {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      color: var(--zen-text-heading);
    }

    .tags-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .tag-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: var(--zen-bg-secondary);
      border-radius: 8px;
      border-left: 3px solid;
      transition: all 0.2s ease;

      &:hover {
        background: var(--zen-bg-tertiary);
      }

      .tag-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;

        .tag-description {
          font-size: 12px;
          color: var(--zen-text-muted);
          margin-top: 4px;
        }
      }
    }
  }
}
</style>

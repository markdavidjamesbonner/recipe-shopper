<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase'

const recipes = ref([])
const loading = ref(true)
const showForm = ref(false)
const editingId = ref(null)
const searchQuery = ref('')

// Unlock modal (password required to unlock a card)
const showUnlockModal = ref(false)
const unlockRecipe = ref(null)
const unlockPassword = ref('')
const unlockError = ref('')

const unlockPasswordEnv = import.meta.env.VITE_UNLOCK_PASSWORD ?? ''

// Computed property to filter recipes by title
const filteredRecipes = computed(() => {
  if (!searchQuery.value.trim()) {
    return recipes.value
  }
  const query = searchQuery.value.toLowerCase().trim()
  return recipes.value.filter((recipe) =>
    recipe.name?.toLowerCase().includes(query)
  )
})

// Form fields
const newRecipe = ref({
  name: '',
  ingredients: '',
  instructions: '',
  prep_time: null,
  servings: null,
  notes: '',
})

// Edit form (same shape, used when editingId is set)
const editForm = ref({
  name: '',
  ingredients: '',
  instructions: '',
  prep_time: null,
  servings: null,
  notes: '',
})

async function fetchRecipes() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recipes:', error)
      recipes.value = []
    } else {
      recipes.value = (data ?? []).map((r) => ({ ...r, locked: r.locked === true }))
    }
  } catch (err) {
    console.error('Error fetching recipes:', err)
    recipes.value = []
  } finally {
    loading.value = false
  }
}

async function addRecipe() {
  const payload = { ...newRecipe.value, locked: false }
  const { data, error } = await supabase.from('recipes').insert([payload]).select()

  if (error) {
    console.error('Error adding recipe:', error)
    alert('Error adding recipe')
  } else {
    // Add new recipe to the list
    recipes.value.unshift(data[0])
    // Reset form
    newRecipe.value = {
      name: '',
      ingredients: '',
      instructions: '',
      prep_time: null,
      servings: null,
      notes: '',
    }
    showForm.value = false
  }
}

function startEditing(recipe) {
  editingId.value = recipe.id
  editForm.value = {
    name: recipe.name ?? '',
    ingredients: recipe.ingredients ?? '',
    instructions: recipe.instructions ?? '',
    prep_time: recipe.prep_time ?? null,
    servings: recipe.servings ?? null,
    notes: recipe.notes ?? '',
  }
}

function cancelEditing() {
  editingId.value = null
}

async function saveRecipe() {
  const id = editingId.value
  if (!id) return
  const { data, error } = await supabase
    .from('recipes')
    .update({
      name: editForm.value.name,
      ingredients: editForm.value.ingredients,
      instructions: editForm.value.instructions,
      prep_time: editForm.value.prep_time || null,
      servings: editForm.value.servings || null,
      notes: editForm.value.notes || '',
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating recipe:', error)
    alert('Error updating recipe')
  } else {
    const index = recipes.value.findIndex((r) => r.id === id)
    if (index !== -1) recipes.value[index] = data[0]
    editingId.value = null
  }
}

async function deleteRecipe(id) {
  if (!confirm('Delete this recipe? This cannot be undone.')) return
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) {
    console.error('Error deleting recipe:', error)
    alert('Error deleting recipe')
  } else {
    if (editingId.value === id) editingId.value = null
    recipes.value = recipes.value.filter((r) => r.id !== id)
  }
}

function isLocked(recipe) {
  return recipe.locked === true
}

async function setLock(recipe, locked) {
  const { data, error } = await supabase
    .from('recipes')
    .update({ locked })
    .eq('id', recipe.id)
    .select()
  if (error) {
    console.error('Error updating lock:', error)
    alert('Failed to update lock')
    return
  }
  const index = recipes.value.findIndex((r) => r.id === recipe.id)
  if (index !== -1 && data?.[0]) recipes.value[index] = data[0]
}

function toggleLock(recipe) {
  if (recipe.locked) {
    unlockRecipe.value = recipe
    unlockPassword.value = ''
    unlockError.value = ''
    showUnlockModal.value = true
  } else {
    setLock(recipe, true)
  }
}

function closeUnlockModal() {
  showUnlockModal.value = false
  unlockRecipe.value = null
  unlockPassword.value = ''
  unlockError.value = ''
}

function submitUnlock() {
  if (!unlockRecipe.value) return
  if (!unlockPasswordEnv) {
    unlockError.value = 'Unlock password is not configured. Set VITE_UNLOCK_PASSWORD in .env'
    return
  }
  if (unlockPassword.value !== unlockPasswordEnv) {
    unlockError.value = 'Incorrect password'
    return
  }
  setLock(unlockRecipe.value, false)
  closeUnlockModal()
}

onMounted(() => {
  fetchRecipes()
})
</script>

<template>
  <div class="recipes-view">
    <div class="header">
      <h1>recipes will be here</h1>
      <button @click="showForm = !showForm" class="btn-primary">
        {{ showForm ? 'cancel' : '+ add recipe' }}
      </button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search recipes by title..."
        class="search-input"
      />
    </div>

    <!-- Add Recipe Form -->
    <div v-if="showForm" class="recipe-form">
      <h2>add new recipe</h2>
      <form @submit.prevent="addRecipe">
        <div class="form-group">
          <label>recipe name *</label>
          <input v-model="newRecipe.name" type="text" required placeholder="e.g., Chocolate Chip Cookies" />
        </div>

        <div class="form-group">
          <label>Ingredients *</label>
          <textarea v-model="newRecipe.ingredients" required rows="4" placeholder="List ingredients, one per line or separated by commas"></textarea>
        </div>

        <div class="form-group">
          <label>Instructions</label>
          <textarea v-model="newRecipe.instructions" rows="6" placeholder="Step-by-step instructions"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Prep Time (minutes)</label>
            <input v-model.number="newRecipe.prep_time" type="number" min="0" placeholder="30" />
          </div>

          <div class="form-group">
            <label>Servings</label>
            <input v-model.number="newRecipe.servings" type="number" min="1" placeholder="4" />
          </div>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea v-model="newRecipe.notes" rows="3" placeholder="Any additional notes or tips"></textarea>
        </div>

        <button type="submit" class="btn-primary btn-large">save recipe</button>
      </form>
    </div>

    <!-- Recipes List -->
    <div v-if="loading" class="loading">Loading recipes...</div>

    <div v-else-if="recipes.length === 0 && !showForm">
      <p>No recipes yet. Add your first one!</p>
    </div>

    <div v-else-if="filteredRecipes.length === 0 && searchQuery.trim()">
      <p class="no-results">No recipes found matching "{{ searchQuery }}"</p>
    </div>

    <div v-else class="recipes-list">
      <div v-for="recipe in filteredRecipes" :key="recipe.id" class="recipe-card">
        <!-- Edit mode -->
        <template v-if="editingId === recipe.id">
          <h2>Edit Recipe</h2>
          <form @submit.prevent="saveRecipe" class="recipe-edit-form">
            <div class="form-group">
              <label>Recipe Name *</label>
              <input v-model="editForm.name" type="text" required placeholder="e.g., Chocolate Chip Cookies" />
            </div>
            <div class="form-group">
              <label>Ingredients *</label>
              <textarea v-model="editForm.ingredients" required rows="4" placeholder="List ingredients..."></textarea>
            </div>
            <div class="form-group">
              <label>Instructions</label>
              <textarea v-model="editForm.instructions" rows="6" placeholder="Step-by-step instructions"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Prep Time (minutes)</label>
                <input v-model.number="editForm.prep_time" type="number" min="0" placeholder="30" />
              </div>
              <div class="form-group">
                <label>Servings</label>
                <input v-model.number="editForm.servings" type="number" min="1" placeholder="4" />
              </div>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="editForm.notes" rows="3" placeholder="Any additional notes or tips"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="cancelEditing">Cancel</button>
              <button type="submit" class="btn-primary">Save changes</button>
            </div>
          </form>
        </template>
        <!-- View mode -->
        <template v-else>
          <div class="recipe-card-header">
            <h2>{{ recipe.name }}</h2>
            <div class="recipe-card-actions">
              <button
                type="button"
                :class="['btn-lock', { 'is-locked': isLocked(recipe) }]"
                :aria-label="isLocked(recipe) ? 'Unlock recipe' : 'Lock recipe'"
                :title="isLocked(recipe) ? 'Unlock (enable edit/delete)' : 'Lock (disable edit/delete)'"
                @click="toggleLock(recipe)"
              >
                {{ isLocked(recipe) ? 'unlock' : 'lock' }}
              </button>
              <template v-if="!isLocked(recipe)">
                <button type="button" class="btn-edit" aria-label="Edit recipe" @click="startEditing(recipe)">edit</button>
                <button type="button" class="btn-delete" aria-label="Delete recipe" @click="deleteRecipe(recipe.id)">delete</button>
              </template>
            </div>
          </div>
          <div class="recipe-meta">
            <span v-if="recipe.prep_time">⏱️ {{ recipe.prep_time }} min</span>
            <span v-if="recipe.servings">👥 {{ recipe.servings }} servings</span>
          </div>
          <div class="recipe-section">
            <h3>Ingredients</h3>
            <p>{{ recipe.ingredients }}</p>
          </div>
          <div v-if="recipe.instructions" class="recipe-section">
            <h3>Instructions</h3>
            <p>{{ recipe.instructions }}</p>
          </div>
          <div v-if="recipe.notes" class="recipe-section">
            <h3>Notes</h3>
            <p>{{ recipe.notes }}</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Unlock modal (password required) -->
    <Teleport to="body">
      <div v-if="showUnlockModal" class="unlock-modal-overlay" @click.self="closeUnlockModal">
        <div class="unlock-modal">
          <h3>Unlock recipe</h3>
          <p class="unlock-modal-hint">Enter your password to unlock this card and enable edit/delete.</p>
          <form @submit.prevent="submitUnlock" class="unlock-form">
            <div class="form-group">
              <label for="unlock-password">Password</label>
              <input
                id="unlock-password"
                v-model="unlockPassword"
                type="password"
                autocomplete="current-password"
                placeholder="Enter unlock password"
                class="unlock-input"
              />
            </div>
            <p v-if="unlockError" class="unlock-error">{{ unlockError }}</p>
            <div class="unlock-modal-actions">
              <button type="button" class="btn-secondary" @click="closeUnlockModal">Cancel</button>
              <button type="submit" class="btn-primary">Unlock</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.recipes-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
}

.btn-primary {
  background: #42b983;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.btn-primary:hover {
  background: #359268;
}

.btn-large {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
}

.recipe-form {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.recipe-form h2 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.recipes-list {
  display: grid;
  gap: 1.5rem;
}

.recipe-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
}

.recipe-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.recipe-card-header h2 {
  margin: 0;
  flex: 1;
  color: #2c3e50;
}

.recipe-card-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-lock {
  padding: 0.4rem 0.9rem;
  border: 1px solid #888;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.btn-lock:hover {
  background: #f0f0f0;
  color: #333;
}

.btn-lock.is-locked {
  border-color: #42b983;
  color: #42b983;
  background: #f0faf5;
}

.btn-lock.is-locked:hover {
  background: #e0f5ec;
}

.btn-edit {
  padding: 0.4rem 0.9rem;
  border: 1px solid #42b983;
  border-radius: 6px;
  background: white;
  color: #42b983;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-edit:hover {
  background: #42b983;
  color: white;
}

.btn-delete {
  padding: 0.4rem 0.9rem;
  border: 1px solid #c33;
  border-radius: 6px;
  background: white;
  color: #c33;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-delete:hover {
  background: #c33;
  color: white;
}

.recipe-edit-form .form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #555;
  font-size: 1rem;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.recipe-card h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.recipe-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
  color: #666;
  font-size: 0.9rem;
}

.recipe-section {
  margin-top: 1rem;
}

.recipe-section h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  color: #42b983;
}

.recipe-section p {
  margin: 0;
  color: #555;
  line-height: 1.1;
  white-space: pre-line;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.search-bar {
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.15);
}

.search-input::placeholder {
  color: #999;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}
</style>

<style>
/* Unlock modal: global so Teleport body works with overlay */
.unlock-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.unlock-modal {
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.unlock-modal h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.unlock-modal-hint {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #666;
}

.unlock-form .form-group {
  margin-bottom: 1rem;
}

.unlock-form .form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: #2c3e50;
}

.unlock-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.unlock-error {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #c33;
}

.unlock-modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>

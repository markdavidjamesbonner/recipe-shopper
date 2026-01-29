<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const recipes = ref([])
const loading = ref(true)
const showForm = ref(false)
const editingId = ref(null)

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
      recipes.value = data ?? []
    }
  } catch (err) {
    console.error('Error fetching recipes:', err)
    recipes.value = []
  } finally {
    loading.value = false
  }
}

async function addRecipe() {
  const { data, error } = await supabase.from('recipes').insert([newRecipe.value]).select()

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

    <div v-else class="recipes-list">
      <div v-for="recipe in recipes" :key="recipe.id" class="recipe-card">
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
              <button type="button" class="btn-edit" aria-label="Edit recipe" @click="startEditing(recipe)">edit</button>
              <button type="button" class="btn-delete" aria-label="Delete recipe" @click="deleteRecipe(recipe.id)">delete</button>
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
  line-height: 1.6;
  white-space: pre-line;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>

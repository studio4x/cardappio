import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.trim().match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_PROJECT_URL;
const supabaseServiceRole = envVars.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/--+/g, '-') // Replace multiple -
    .trim();
}

async function run() {
  console.log("Fetching admin profile...");
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, role')
    .limit(10);

  if (profileErr) {
    console.error("Error fetching profiles:", profileErr);
    process.exit(1);
  }

  // Find an admin profile or just use the first available profile
  const adminProfile = profiles.find(p => p.role === 'admin' || p.role === 'super_admin') || profiles[0];
  const creatorId = adminProfile ? adminProfile.id : null;
  console.log(`Using creator ID: ${creatorId} (role: ${adminProfile?.role || 'none'})`);

  // 1. Get or Create "Sopas" category
  console.log("Checking for 'Sopas' category...");
  const categorySlug = 'sopas';
  let { data: category, error: catErr } = await supabase
    .from('recipe_categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle();

  if (catErr) {
    console.error("Error checking category:", catErr);
    process.exit(1);
  }

  let categoryId;
  if (!category) {
    console.log("Category 'Sopas' not found. Creating it...");
    const { data: newCat, error: insertCatErr } = await supabase
      .from('recipe_categories')
      .insert({
        name: 'Sopas',
        slug: categorySlug,
        description: 'Receitas deliciosas de sopas e cremes',
        sort_order: 10,
        is_active: true
      })
      .select('id')
      .single();

    if (insertCatErr) {
      console.error("Error creating category:", insertCatErr);
      process.exit(1);
    }
    categoryId = newCat.id;
    console.log(`Created category 'Sopas' with ID: ${categoryId}`);
  } else {
    categoryId = category.id;
    console.log(`Using existing category 'Sopas' with ID: ${categoryId}`);
  }

  // 2. Read and parse Sopas.txt
  console.log("Parsing Sopas.txt...");
  const content = fs.readFileSync('docs/Sopas.txt', 'utf8');
  const parts = content.split(/\(\(|\(\s*[\uF000-\uFFFF]|\(\s*\uF020/);

  const recipesToInsert = [];

  parts.forEach((p, idx) => {
    const trimmed = p.trim();
    if (!trimmed) return;

    const ingredIndex = trimmed.indexOf("Ingredientes");
    if (ingredIndex === -1) return;

    const title = trimmed.substring(0, ingredIndex).trim();

    let prepIndex = trimmed.toLowerCase().indexOf("modo de preparar");
    if (prepIndex === -1) {
      prepIndex = trimmed.toLowerCase().indexOf("modo de preparar");
    }
    let prepLength = "modo de preparar".length;

    const ingredientsText = trimmed.substring(ingredIndex + "Ingredientes".length, prepIndex).trim();

    let stepsAndNotes = trimmed.substring(prepIndex + prepLength).trim();

    let notesIndex = -1;
    const lowercaseSteps = stepsAndNotes.toLowerCase();
    const obsIndex = lowercaseSteps.indexOf("obs.");
    const fonteIndex = lowercaseSteps.indexOf("fonte:");
    
    if (obsIndex !== -1 && fonteIndex !== -1) {
      notesIndex = Math.min(obsIndex, fonteIndex);
    } else if (obsIndex !== -1) {
      notesIndex = obsIndex;
    } else if (fonteIndex !== -1) {
      notesIndex = fonteIndex;
    }

    let stepsText = stepsAndNotes;
    let notesText = "";
    if (notesIndex !== -1) {
      stepsText = stepsAndNotes.substring(0, notesIndex).trim();
      notesText = stepsAndNotes.substring(notesIndex).trim();
    }

    // Split ingredients by vertical tabs/carriage returns/newlines, and also semicolons
    let rawIngredients = ingredientsText
      .split(/[\u000b\r\n\t]+/)
      .map(x => x.replace(/\u0001/g, '').trim())
      .filter(x => x.length > 0);

    const ingredients = [];
    rawIngredients.forEach(item => {
      // If it contains semicolons, split it
      if (item.includes(';') && item.replace(/;/g, '').trim().length > 1) {
        const splitItems = item.split(';').map(x => x.trim()).filter(x => x.length > 0);
        ingredients.push(...splitItems);
      } else {
        ingredients.push(item);
      }
    });

    // Split steps by vertical tabs/carriage returns/newlines
    const steps = stepsText
      .split(/[\u000b\r\n\t]+/)
      .map(x => x.replace(/\u0001/g, '').trim())
      .filter(x => x.length > 0);

    recipesToInsert.push({
      title,
      slug: slugify(title),
      categoryId,
      ingredients,
      steps,
      notes: notesText || null
    });
  });

  console.log(`Parsed ${recipesToInsert.length} recipes. Inserting into database...`);

  for (const recipe of recipesToInsert) {
    console.log(`Inserting recipe: ${recipe.title}...`);

    // Ensure unique slug if exists
    let finalSlug = recipe.slug;
    let suffix = 1;
    while (true) {
      const { data: existingRecipe } = await supabase
        .from('recipes')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();
      if (!existingRecipe) break;
      finalSlug = `${recipe.slug}-${suffix}`;
      suffix++;
    }

    // Insert Recipe
    const { data: insertedRecipe, error: recInsertErr } = await supabase
      .from('recipes')
      .insert({
        title: recipe.title,
        slug: finalSlug,
        category_id: recipe.categoryId,
        notes: recipe.notes,
        status: 'published', // Publish them so they are visible
        difficulty_level: 'medium',
        cost_level: 'medium',
        prep_time_minutes: 30,
        servings: 4,
        created_by: creatorId,
        updated_by: creatorId
      })
      .select('id')
      .single();

    if (recInsertErr) {
      console.error(`Error inserting recipe ${recipe.title}:`, recInsertErr);
      continue;
    }

    const recipeId = insertedRecipe.id;

    // Insert Ingredients
    if (recipe.ingredients.length > 0) {
      const ingredientRows = recipe.ingredients.map((ing, idx) => ({
        recipe_id: recipeId,
        name: ing,
        sort_order: idx
      }));

      const { error: ingErr } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientRows);

      if (ingErr) {
        console.error(`Error inserting ingredients for ${recipe.title}:`, ingErr);
      }
    }

    // Insert Steps
    if (recipe.steps.length > 0) {
      const stepRows = recipe.steps.map((step, idx) => ({
        recipe_id: recipeId,
        step_number: idx + 1,
        content: step
      }));

      const { error: stepErr } = await supabase
        .from('recipe_steps')
        .insert(stepRows);

      if (stepErr) {
        console.error(`Error inserting steps for ${recipe.title}:`, stepErr);
      }
    }

    console.log(`Successfully imported: ${recipe.title}`);
  }

  console.log("Import process completed!");
}

run().catch(console.error);

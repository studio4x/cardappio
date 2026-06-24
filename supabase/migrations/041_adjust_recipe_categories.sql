-- ============================================================
-- CARDAPPIO — Migration 041: Adjust Recipe Categories
-- ============================================================

DO $$
DECLARE
    -- IDs das categorias existentes que serão REUTILIZADAS e ATUALIZADAS
    id_carnes           UUID := 'c1000000-0000-0000-0000-000000000001'; -- Antes 'Pratos Principais'
    id_massas_cereais    UUID := 'c1000000-0000-0000-0000-000000000002'; -- Antes 'Massas'
    id_aves             UUID := 'c1000000-0000-0000-0000-000000000003'; -- Antes 'Carnes e Aves'
    id_legumes_verduras  UUID := 'c1000000-0000-0000-0000-000000000004'; -- Antes 'Saladas e Saudáveis'
    id_doces             UUID := 'c1000000-0000-0000-0000-000000000005'; -- Antes 'Sobremesas'
    
    -- IDs para novas categorias adicionais (UUIDs determinísticos novos)
    id_acompanhamentos UUID := 'c1000000-0000-0000-0000-000000000011';
    id_desjejum          UUID := 'c1000000-0000-0000-0000-000000000012';
    id_entradas          UUID := 'c1000000-0000-0000-0000-000000000013';
    id_peixes_frutos     UUID := 'c1000000-0000-0000-0000-000000000014';
    id_tira_gosto        UUID := 'c1000000-0000-0000-0000-000000000015';
    
    -- ID da categoria Sopas existente (obtida dinamicamente ou mantendo o ID atual)
    id_sopas             UUID := 'd45d2dd9-35c5-43bf-858c-686d6597158d';
BEGIN
    -- 1. Atualizar as categorias existentes (In-place update)
    UPDATE recipe_categories 
    SET name = 'Carnes', slug = 'carnes', description = 'Cortes de carne bovina, suína, cordeiro, etc.', sort_order = 3
    WHERE id = id_carnes;

    UPDATE recipe_categories 
    SET name = 'Massas e cereais', slug = 'massas-e-cereais', description = 'Macarrão, risotos, arroz, quinoa e grãos', sort_order = 8
    WHERE id = id_massas_cereais;

    UPDATE recipe_categories 
    SET name = 'Aves', slug = 'aves', description = 'Pratos com frango, peru e outras aves', sort_order = 2
    WHERE id = id_aves;

    UPDATE recipe_categories 
    SET name = 'Legumes e verduras', slug = 'legumes-e-verduras', description = 'Receitas focadas em vegetais frescos e cozidos', sort_order = 7
    WHERE id = id_legumes_verduras;

    UPDATE recipe_categories 
    SET name = 'Doces', slug = 'doces', description = 'Sobremesas, bolos e guloseimas doces', sort_order = 5
    WHERE id = id_doces;

    -- 2. Inserir novas categorias adicionais se não existirem
    INSERT INTO recipe_categories (id, name, slug, description, sort_order, is_active)
    VALUES 
      (id_acompanhamentos, 'Acompanhamentos', 'acompanhamentos', 'Guarnições e complementos para pratos', 1, true),
      (id_desjejum, 'Desjejum', 'desjejum', 'Café da manhã, brunch e lanches matinais', 4, true),
      (id_entradas, 'Entradas', 'entradas', 'Petiscos e pratos leves servidos antes do prato principal', 6, true),
      (id_peixes_frutos, 'Peixes e frutos do mar', 'peixes-e-frutos-do-mar', 'Peixes, camarão, lula e frutos do mar em geral', 9, true),
      (id_tira_gosto, 'Tira-gosto', 'tira-gosto', 'Porções, petiscos rápidos e comidas de boteco', 11, true)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description;

    -- 3. Migrar pontualmente receitas cujas categorias mudaram de significado

    -- A. Na categoria antiga "Pratos Principais" (agora id_carnes):
    -- Se tiver peixe/moqueca/camarao/salmao/atum -> Peixes e frutos do mar (id_peixes_frutos)
    UPDATE recipes 
    SET category_id = id_peixes_frutos
    WHERE category_id = id_carnes 
      AND (slug LIKE '%peixe%' OR slug LIKE '%moqueca%' OR slug LIKE '%camarao%' OR slug LIKE '%salmao%' OR title ILIKE '%peixe%' OR title ILIKE '%moqueca%' OR title ILIKE '%camarão%' OR title ILIKE '%salmão%');

    -- Se tiver arroz, risoto, lasanha, espaguete, macarrao, massa -> Massas e cereais (id_massas_cereais)
    UPDATE recipes 
    SET category_id = id_massas_cereais
    WHERE category_id = id_carnes 
      AND (slug LIKE '%arroz%' OR slug LIKE '%risoto%' OR slug LIKE '%lasanha%' OR slug LIKE '%espaguete%' OR slug LIKE '%macarrao%' OR title ILIKE '%arroz%' OR title ILIKE '%risoto%' OR title ILIKE '%lasanha%' OR title ILIKE '%espaguete%' OR title ILIKE '%macarrão%');

    -- Se tiver frango/ave -> Aves (id_aves)
    UPDATE recipes 
    SET category_id = id_aves
    WHERE category_id = id_carnes 
      AND (slug LIKE '%frango%' OR slug LIKE '%ave%' OR title ILIKE '%frango%' OR title ILIKE '%ave%');

    -- B. Na categoria antiga "Carnes e Aves" (agora id_aves):
    -- Se for carne vermelha/bovina/suina/hamburguer/bife/picadinho/almondega -> Carnes (id_carnes)
    UPDATE recipes 
    SET category_id = id_carnes
    WHERE category_id = id_aves 
      AND (slug LIKE '%carne%' OR slug LIKE '%bife%' OR slug LIKE '%hamburguer%' OR slug LIKE '%picadinho%' OR slug LIKE '%almondega%' OR slug LIKE '%patinho%' OR title ILIKE '%carne%' OR title ILIKE '%bife%' OR title ILIKE '%hambúrguer%' OR title ILIKE '%picadinho%' OR title ILIKE '%almôndega%');

    -- Se for peixe/salmao/atum/camarao -> Peixes e frutos do mar (id_peixes_frutos)
    UPDATE recipes 
    SET category_id = id_peixes_frutos
    WHERE category_id = id_aves 
      AND (slug LIKE '%peixe%' OR slug LIKE '%salmao%' OR slug LIKE '%atum%' OR slug LIKE '%camarao%' OR title ILIKE '%peixe%' OR title ILIKE '%salmão%' OR title ILIKE '%atum%' OR title ILIKE '%camarão%');

    -- C. Na categoria antiga "Saladas e Saudáveis" (agora id_legumes_verduras):
    -- Se for desjejum (smoothie, panqueca, omelete, crepioca, iogurte, bowl-quinoa) -> Desjejum (id_desjejum)
    UPDATE recipes 
    SET category_id = id_desjejum
    WHERE category_id = id_legumes_verduras 
      AND (slug LIKE '%omelete%' OR slug LIKE '%crepioca%' OR slug LIKE '%panqueca%' OR slug LIKE '%smoothie%' OR slug LIKE '%bowl-iogurte%' OR slug LIKE '%bowl-quinoa%' OR slug LIKE '%cafe%' OR title ILIKE '%omelete%' OR title ILIKE '%crepioca%' OR title ILIKE '%panqueca%' OR title ILIKE '%smoothie%' OR title ILIKE '%iogurte%' OR title ILIKE '%café%');

    -- Se for sopa/creme/caldo -> Sopas (id_sopas)
    UPDATE recipes 
    SET category_id = id_sopas
    WHERE category_id = id_legumes_verduras 
      AND (slug LIKE '%sopa%' OR slug LIKE '%caldo%' OR slug LIKE '%creme%' OR title ILIKE '%sopa%' OR title ILIKE '%caldo%' OR title ILIKE '%creme%');

    -- Se for bruschetta -> Entradas (id_entradas)
    UPDATE recipes 
    SET category_id = id_entradas
    WHERE category_id = id_legumes_verduras 
      AND (slug LIKE '%bruschetta%' OR title ILIKE '%bruschetta%');

END $$;

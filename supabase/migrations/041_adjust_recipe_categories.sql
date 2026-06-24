-- ============================================================
-- CARDAPPIO — Migration 041: Adjust Recipe Categories
-- ============================================================

DO $$
DECLARE
    -- IDs para novas categorias (UUIDs determinísticos ou gerados)
    id_acompanhamentos UUID := 'c1000000-0000-0000-0000-000000000011';
    id_aves             UUID := 'c1000000-0000-0000-0000-000000000012';
    id_carnes           UUID := 'c1000000-0000-0000-0000-000000000013';
    id_desjejum          UUID := 'c1000000-0000-0000-0000-000000000014';
    id_doces             UUID := 'c1000000-0000-0000-0000-000000000015';
    id_entradas          UUID := 'c1000000-0000-0000-0000-000000000016';
    id_legumes_verduras  UUID := 'c1000000-0000-0000-0000-000000000017';
    id_massas_cereais    UUID := 'c1000000-0000-0000-0000-000000000018';
    id_peixes_frutos     UUID := 'c1000000-0000-0000-0000-000000000019';
    id_sopas             UUID := 'c1000000-0000-0000-0000-000000000020';
    id_tira_gosto        UUID := 'c1000000-0000-0000-0000-000000000021';
    
    -- IDs das categorias antigas para mapeamento
    id_old_principais    UUID := 'c1000000-0000-0000-0000-000000000001';
    id_old_massas        UUID := 'c1000000-0000-0000-0000-000000000002';
    id_old_carnes_aves   UUID := 'c1000000-0000-0000-0000-000000000003';
    id_old_saladas       UUID := 'c1000000-0000-0000-0000-000000000004';
    id_old_sobremesas    UUID := 'c1000000-0000-0000-0000-000000000005';
BEGIN
    -- 1. Inserir novas categorias se não existirem
    INSERT INTO recipe_categories (id, name, slug, description, sort_order, is_active)
    VALUES 
      (id_acompanhamentos, 'Acompanhamentos', 'acompanhamentos', 'Guarnições e complementos para pratos', 1, true),
      (id_aves, 'Aves', 'aves', 'Pratos com frango, peru e outras aves', 2, true),
      (id_carnes, 'Carnes', 'carnes', 'Cortes de carne bovina, suína, cordeiro, etc.', 3, true),
      (id_desjejum, 'Desjejum', 'desjejum', 'Café da manhã, brunch e lanches matinais', 4, true),
      (id_doces, 'Doces', 'doces', 'Sobremesas, bolos e guloseimas doces', 5, true),
      (id_entradas, 'Entradas', 'entradas', 'Petiscos e pratos leves servidos antes do prato principal', 6, true),
      (id_legumes_verduras, 'Legumes e verduras', 'legumes-e-verduras', 'Receitas focadas em vegetais frescos e cozidos', 7, true),
      (id_massas_cereais, 'Massas e cereais', 'massas-e-cereais', 'Macarrão, risotos, arroz, quinoa e grãos', 8, true),
      (id_peixes_frutos, 'Peixes e frutos do mar', 'peixes-e-frutos-do-mar', 'Peixes, camarão, lula e frutos do mar em geral', 9, true),
      (id_sopas, 'Sopas', 'sopas', 'Caldos, cremes e sopas quentes ou frias', 10, true),
      (id_tira_gosto, 'Tira-gosto', 'tira-gosto', 'Porções, petiscos rápidos e comidas de boteco', 11, true)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description;

    -- 2. Migrar receitas das categorias antigas para as novas antes de remover as antigas

    -- A. Massas (c1000000-0000-0000-0000-000000000002) -> Massas e cereais
    UPDATE recipes 
    SET category_id = id_massas_cereais
    WHERE category_id = id_old_massas;

    -- B. Sobremesas (c1000000-0000-0000-0000-000000000005) -> Doces
    UPDATE recipes 
    SET category_id = id_doces
    WHERE category_id = id_old_sobremesas;

    -- C. Carnes e Aves (c1000000-0000-0000-0000-000000000003)
    -- Se tiver frango/ave no título ou slug -> Aves
    UPDATE recipes 
    SET category_id = id_aves
    WHERE category_id = id_old_carnes_aves 
      AND (slug LIKE '%frango%' OR slug LIKE '%ave%' OR slug LIKE '%peru%' OR title ILIKE '%frango%' OR title ILIKE '%ave%' OR title ILIKE '%peru%');

    -- Se tiver peixe/salmao/atum/moqueca/camarao -> Peixes e frutos do mar
    UPDATE recipes 
    SET category_id = id_peixes_frutos
    WHERE category_id = id_old_carnes_aves 
      AND (slug LIKE '%peixe%' OR slug LIKE '%salmao%' OR slug LIKE '%atum%' OR slug LIKE '%camarao%' OR title ILIKE '%peixe%' OR title ILIKE '%salmão%' OR title ILIKE '%atum%' OR title ILIKE '%camarão%');

    -- O restante das Carnes e Aves -> Carnes
    UPDATE recipes 
    SET category_id = id_carnes
    WHERE category_id = id_old_carnes_aves;

    -- D. Saladas e Saudáveis (c1000000-0000-0000-0000-000000000004)
    -- Se tiver desjejum, café, ovo, omelete, crepioca, panqueca, shake, bowl-quinoa
    UPDATE recipes 
    SET category_id = id_desjejum
    WHERE category_id = id_old_saladas 
      AND (slug LIKE '%omelete%' OR slug LIKE '%crepioca%' OR slug LIKE '%panqueca%' OR slug LIKE '%smoothie%' OR slug LIKE '%bowl-quinoa%' OR slug LIKE '%cafe%' OR title ILIKE '%omelete%' OR title ILIKE '%crepioca%' OR title ILIKE '%panqueca%' OR title ILIKE '%smoothie%' OR title ILIKE '%café%');

    -- Se tiver sopa, caldo, creme
    UPDATE recipes 
    SET category_id = id_sopas
    WHERE category_id = id_old_saladas 
      AND (slug LIKE '%sopa%' OR slug LIKE '%caldo%' OR slug LIKE '%creme%' OR title ILIKE '%sopa%' OR title ILIKE '%caldo%' OR title ILIKE '%creme%');

    -- Se tiver salada, legumes, abobora, berinjela, brocolis, repolho
    UPDATE recipes 
    SET category_id = id_legumes_verduras
    WHERE category_id = id_old_saladas 
      AND (slug LIKE '%salada%' OR slug LIKE '%legume%' OR slug LIKE '%abobora%' OR slug LIKE '%berinjela%' OR slug LIKE '%brocolis%' OR title ILIKE '%salada%' OR title ILIKE '%legume%' OR title ILIKE '%abóbora%' OR title ILIKE '%berinjela%' OR title ILIKE '%brócolis%');

    -- Qualquer outra receita que tenha sobrado em Saladas e Saudáveis -> Legumes e verduras (ou Acompanhamentos como fallback)
    UPDATE recipes 
    SET category_id = id_legumes_verduras
    WHERE category_id = id_old_saladas;

    -- E. Pratos Principais (c1000000-0000-0000-0000-000000000001)
    -- Se tiver peixe/moqueca/camarao/salmao/atum -> Peixes e frutos do mar
    UPDATE recipes 
    SET category_id = id_peixes_frutos
    WHERE category_id = id_old_principais 
      AND (slug LIKE '%peixe%' OR slug LIKE '%moqueca%' OR slug LIKE '%camarao%' OR slug LIKE '%salmao%' OR title ILIKE '%peixe%' OR title ILIKE '%moqueca%' OR title ILIKE '%camarão%' OR title ILIKE '%salmão%');

    -- Se tiver arroz, risoto, lasanha, espaguete, macarrao, massa -> Massas e cereais
    UPDATE recipes 
    SET category_id = id_massas_cereais
    WHERE category_id = id_old_principais 
      AND (slug LIKE '%arroz%' OR slug LIKE '%risoto%' OR slug LIKE '%lasanha%' OR slug LIKE '%espaguete%' OR slug LIKE '%macarrao%' OR title ILIKE '%arroz%' OR title ILIKE '%risoto%' OR title ILIKE '%lasanha%' OR title ILIKE '%espaguete%' OR title ILIKE '%macarrão%');

    -- Se tiver frango/ave -> Aves
    UPDATE recipes 
    SET category_id = id_aves
    WHERE category_id = id_old_principais 
      AND (slug LIKE '%frango%' OR slug LIKE '%ave%' OR title ILIKE '%frango%' OR title ILIKE '%ave%');

    -- Se tiver carne, strogonoff, picadinho, bife, hamburguer -> Carnes
    UPDATE recipes 
    SET category_id = id_carnes
    WHERE category_id = id_old_principais 
      AND (slug LIKE '%carne%' OR slug LIKE '%strogonoff%' OR slug LIKE '%picadinho%' OR slug LIKE '%bife%' OR slug LIKE '%hamburguer%' OR title ILIKE '%carne%' OR title ILIKE '%strogonoff%' OR title ILIKE '%picadinho%' OR title ILIKE '%bife%' OR title ILIKE '%hambúrguer%');

    -- Fallback para Pratos Principais -> Carnes (como padrão de prato principal)
    UPDATE recipes 
    SET category_id = id_carnes
    WHERE category_id = id_old_principais;

    -- 3. Remover categorias antigas
    DELETE FROM recipe_categories 
    WHERE id IN (id_old_principais, id_old_massas, id_old_carnes_aves, id_old_saladas, id_old_sobremesas);

END $$;

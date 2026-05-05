-- ============================================================
-- CARDAPPIO — Seed: 30 Fitness Recipes
-- ============================================================

DO $$
DECLARE
    admin_id UUID;
    cat_fitness_id UUID := 'c1000000-0000-0000-0000-000000000004'; -- Saladas e Saudáveis
    coll_fitness_id UUID := 'c0000000-0000-0000-0000-000000000003'; -- Saúde e Fitness
BEGIN
    -- Obter o ID de um administrador existente
    SELECT id INTO admin_id FROM profiles WHERE role IN ('admin', 'super_admin') LIMIT 1;
    
    -- Se não houver admin, usar o ID padrão do seed anterior
    IF admin_id IS NULL THEN
        admin_id := 'b5059897-cab2-4464-a13a-4618492fecd0';
    END IF;

    -- 1. Bowl de Quinoa e Grão-de-bico
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000001', 'bowl-quinoa-grao-bico', 'Bowl de Quinoa e Grão-de-bico', 'Proteína vegetal e fibras', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 25, 2, cat_fitness_id, 'Almoço nutritivo', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000001', 'Quinoa cozida', '1 xícara', 0),
    ('f1000000-0000-0000-0000-000000000001', 'Grão-de-bico cozido', '1/2 xícara', 1),
    ('f1000000-0000-0000-0000-000000000001', 'Pepino picado', '1/2 unidade', 2),
    ('f1000000-0000-0000-0000-000000000001', 'Tomate cereja', '10 unidades', 3),
    ('f1000000-0000-0000-0000-000000000001', 'Azeite de oliva', '1 colher de sopa', 4)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000001', 1, 'Misture a quinoa e o grão-de-bico em uma tigela.'),
    ('f1000000-0000-0000-0000-000000000001', 2, 'Adicione os vegetais picados.'),
    ('f1000000-0000-0000-0000-000000000001', 3, 'Tempere com azeite, sal e limão a gosto.')
    ON CONFLICT DO NOTHING;

    -- 2. Frango Grelhado com Purê de Batata Doce
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000002', 'frango-pure-batata-doce', 'Frango Grelhado com Purê de Batata Doce', 'Clássico maromba', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 30, 1, cat_fitness_id, 'Pós-treino', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000002', 'Peito de frango', '150g', 0),
    ('f1000000-0000-0000-0000-000000000002', 'Batata doce cozida', '150g', 1),
    ('f1000000-0000-0000-0000-000000000002', 'Brócolis no vapor', '1/2 xícara', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000002', 1, 'Grelhe o frango temperado com sal e ervas.'),
    ('f1000000-0000-0000-0000-000000000002', 2, 'Amasse a batata doce até formar um purê (pode usar um pouco de água do cozimento).'),
    ('f1000000-0000-0000-0000-000000000002', 3, 'Sirva com o brócolis ao lado.')
    ON CONFLICT DO NOTHING;

    -- 3. Omelete de Claras com Espinafre
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000003', 'omelete-claras-espinafre', 'Omelete de Claras com Espinafre', 'Baixíssima caloria', 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 10, 1, cat_fitness_id, 'Café da manhã leve', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000003', 'Claras de ovo', '4 unidades', 0),
    ('f1000000-0000-0000-0000-000000000003', 'Espinafre fresco', '1 xícara', 1),
    ('f1000000-0000-0000-0000-000000000003', 'Queijo branco light', '20g', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000003', 1, 'Refogue o espinafre rapidamente.'),
    ('f1000000-0000-0000-0000-000000000003', 2, 'Bata as claras e despeje na frigideira.'),
    ('f1000000-0000-0000-0000-000000000003', 3, 'Adicione o recheio e dobre ao meio.')
    ON CONFLICT DO NOTHING;

    -- 4. Salada de Pote Mediterrânea
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000004', 'salada-pote-mediterranea', 'Salada de Pote Mediterrânea', 'Ideal para levar ao trabalho', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 15, 1, cat_fitness_id, 'Marmita saudável', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000004', 'Folhas verdes', '1 xícara', 0),
    ('f1000000-0000-0000-0000-000000000004', 'Grão-de-bico', '50g', 1),
    ('f1000000-0000-0000-0000-000000000004', 'Queijo feta', '20g', 2),
    ('f1000000-0000-0000-0000-000000000004', 'Azeitonas pretas', '5 unidades', 3)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000004', 1, 'Coloque o molho no fundo do pote.'),
    ('f1000000-0000-0000-0000-000000000004', 2, 'Adicione os ingredientes mais densos (grão-de-bico, tomate).'),
    ('f1000000-0000-0000-0000-000000000004', 3, 'Finalize com as folhas no topo.')
    ON CONFLICT DO NOTHING;

    -- 5. Wrap de Couve com Frango Desfiado
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000005', 'wrap-couve-frango', 'Wrap de Couve com Frango Desfiado', 'Zero carbo e prático', 'https://images.unsplash.com/photo-1540914124281-342587941389?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 15, 1, cat_fitness_id, 'Lanche da tarde', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000005', 'Couve manteiga (folhas grandes)', '2 folhas', 0),
    ('f1000000-0000-0000-0000-000000000005', 'Frango desfiado temperado', '100g', 1),
    ('f1000000-0000-0000-0000-000000000005', 'Cenoura ralada', '2 colheres de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000005', 1, 'Retire o talo central da couve sem rasgar a folha.'),
    ('f1000000-0000-0000-0000-000000000005', 2, 'Coloque o frango e a cenoura no centro.'),
    ('f1000000-0000-0000-0000-000000000005', 3, 'Enrole firmemente como um burrito.')
    ON CONFLICT DO NOTHING;

    -- 6. Macarrão de Abobrinha à Bolonhesa
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000006', 'macarrao-abobrinha-bolonhesa', 'Macarrão de Abobrinha à Bolonhesa', 'Baixo carbo e nutritivo', 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&q=80&w=800', 'medium', 'low', 20, 2, cat_fitness_id, 'Jantar leve', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000006', 'Abobrinha italiana', '2 unidades', 0),
    ('f1000000-0000-0000-0000-000000000006', 'Carne moída (patinho)', '200g', 1),
    ('f1000000-0000-0000-0000-000000000006', 'Molho de tomate caseiro', '1 xícara', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000006', 1, 'Passe a abobrinha em um espiralizador ou corte em fatias finas.'),
    ('f1000000-0000-0000-0000-000000000006', 2, 'Cozinhe o molho à bolonhesa normalmente.'),
    ('f1000000-0000-0000-0000-000000000006', 3, 'Refogue a abobrinha por apenas 2 minutos para não soltar muita água.')
    ON CONFLICT DO NOTHING;

    -- 7. Salmão ao Forno com Crosta de Castanhas
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000007', 'salmao-crosta-castanhas', 'Salmão ao Forno com Crosta de Castanhas', 'Gorduras boas e ômega 3', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800', 'medium', 'high', 25, 2, cat_fitness_id, 'Jantar especial fitness', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000007', 'Filé de salmão', '300g', 0),
    ('f1000000-0000-0000-0000-000000000007', 'Castanhas do Pará trituradas', '50g', 1),
    ('f1000000-0000-0000-0000-000000000007', 'Mostarda dijon', '1 colher de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000007', 1, 'Pincele a mostarda sobre o salmão.'),
    ('f1000000-0000-0000-0000-000000000007', 2, 'Pressione as castanhas sobre a mostarda para formar a crosta.'),
    ('f1000000-0000-0000-0000-000000000007', 3, 'Leve ao forno por 15-20 minutos.')
    ON CONFLICT DO NOTHING;

    -- 8. Bowl de Poke Caseiro (Arroz Integral)
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000008', 'poke-caseiro-integral', 'Bowl de Poke Caseiro (Arroz Integral)', 'Refrescante e completo', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800', 'easy', 'high', 20, 1, cat_fitness_id, 'Almoço leve', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000008', 'Arroz integral cozido', '1/2 xícara', 0),
    ('f1000000-0000-0000-0000-000000000008', 'Atum ou salmão em cubos', '100g', 1),
    ('f1000000-0000-0000-0000-000000000008', 'Abacate fatiado', '1/4 unidade', 2),
    ('f1000000-0000-0000-0000-000000000008', 'Manga em cubos', '2 colheres de sopa', 3)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000008', 1, 'Coloque o arroz integral no fundo da tigela.'),
    ('f1000000-0000-0000-0000-000000000008', 2, 'Disponha o peixe e as frutas por cima.'),
    ('f1000000-0000-0000-0000-000000000008', 3, 'Finalize com gergelim e molho shoyu light.')
    ON CONFLICT DO NOTHING;

    -- 9. Espetinhos de Frango e Vegetais
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000009', 'espetinhos-frango-vegetais', 'Espetinhos de Frango e Vegetais', 'Divertido e saudável', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 25, 4, cat_fitness_id, 'Churrasco fit', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000009', 'Peito de frango em cubos', '400g', 0),
    ('f1000000-0000-0000-0000-000000000009', 'Pimentão colorido', '1 unidade', 1),
    ('f1000000-0000-0000-0000-000000000009', 'Cebola roxa', '1 unidade', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000009', 1, 'Intercale o frango e os vegetais nos espetos.'),
    ('f1000000-0000-0000-0000-000000000009', 2, 'Tempere com sal, pimenta e páprica.'),
    ('f1000000-0000-0000-0000-000000000009', 3, 'Grelhe ou leve ao forno até dourar.')
    ON CONFLICT DO NOTHING;

    -- 10. Torta de Frango com Massa de Grão-de-bico
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000010', 'torta-frango-grao-bico', 'Torta de Frango com Massa de Grão-de-bico', 'Sem glúten e proteica', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800', 'hard', 'medium', 50, 6, cat_fitness_id, 'Lanche completo', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000010', 'Grão-de-bico cozido (para a massa)', '2 xícaras', 0),
    ('f1000000-0000-0000-0000-000000000010', 'Frango desfiado (recheio)', '300g', 1),
    ('f1000000-0000-0000-0000-000000000010', 'Creme de ricota light', '2 colheres de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000010', 1, 'Processe o grão-de-bico com um pouco de azeite até virar uma massa.'),
    ('f1000000-0000-0000-0000-000000000010', 2, 'Forre uma forma, recheie com o frango cremoso.'),
    ('f1000000-0000-0000-0000-000000000010', 3, 'Asse até a massa ficar firme.')
    ON CONFLICT DO NOTHING;

    -- 11. Salada de Atum com Maionese de Abacate
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000011', 'salada-atum-abacate', 'Salada de Atum com Maionese de Abacate', 'Substituição saudável', 'https://images.unsplash.com/photo-1546793665-c74683c3ef86?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 10, 2, cat_fitness_id, 'Almoço expresso', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000011', 'Atum em conserva (em água)', '1 lata', 0),
    ('f1000000-0000-0000-0000-000000000011', 'Abacate maduro', '1/2 unidade', 1),
    ('f1000000-0000-0000-0000-000000000011', 'Cebola roxa picada', '2 colheres de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000011', 1, 'Amassa o abacate até virar um creme.'),
    ('f1000000-0000-0000-0000-000000000011', 2, 'Misture o atum e a cebola.'),
    ('f1000000-0000-0000-0000-000000000011', 3, 'Tempere com limão e sal.')
    ON CONFLICT DO NOTHING;

    -- 12. Panqueca de Banana e Aveia
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000012', 'panqueca-banana-aveia', 'Panqueca de Banana e Aveia', 'Pré-treino energético', 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 15, 1, cat_fitness_id, 'Café da manhã', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000012', 'Banana madura', '1 unidade', 0),
    ('f1000000-0000-0000-0000-000000000012', 'Ovo', '2 unidades', 1),
    ('f1000000-0000-0000-0000-000000000012', 'Farelo de aveia', '2 colheres de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000012', 1, 'Amasse a banana e misture com os ovos e aveia.'),
    ('f1000000-0000-0000-0000-000000000012', 2, 'Cozinhe em frigideira antiaderente em porções pequenas.'),
    ('f1000000-0000-0000-0000-000000000012', 3, 'Sirva com canela ou mel se desejar.')
    ON CONFLICT DO NOTHING;

    -- 13. Tilápia no Papelote com Legumes
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000013', 'tilapia-papelote-legumes', 'Tilápia no Papelote com Legumes', 'Cozimento saudável no vapor', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 25, 2, cat_fitness_id, 'Jantar leve', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000013', 'Filé de tilápia', '2 unidades', 0),
    ('f1000000-0000-0000-0000-000000000013', 'Cenoura em rodelas', '1 unidade', 1),
    ('f1000000-0000-0000-0000-000000000013', 'Abobrinha em rodelas', '1/2 unidade', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000013', 1, 'Coloque o peixe e legumes sobre papel manteiga ou alumínio.'),
    ('f1000000-0000-0000-0000-000000000013', 2, 'Feche o papelote bem firme.'),
    ('f1000000-0000-0000-0000-000000000013', 3, 'Asse por 15 minutos em fogo médio.')
    ON CONFLICT DO NOTHING;

    -- 14. Arroz de Couve-Flor com Camarão
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000014', 'arroz-couve-flor-camarao', 'Arroz de Couve-Flor com Camarão', 'Low carb gourmet', 'https://images.unsplash.com/photo-1551248429-4223d7ff7aad?auto=format&fit=crop&q=80&w=800', 'medium', 'high', 20, 2, cat_fitness_id, 'Jantar sofisticado', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000014', 'Couve-flor triturada', '2 xícaras', 0),
    ('f1000000-0000-0000-0000-000000000014', 'Camarão limpo', '250g', 1),
    ('f1000000-0000-0000-0000-000000000014', 'Alho e cebola', 'a gosto', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000014', 1, 'Refogue os camarões rapidamente e reserve.'),
    ('f1000000-0000-0000-0000-000000000014', 2, 'Na mesma panela, refogue a couve-flor até ficar al dente.'),
    ('f1000000-0000-0000-0000-000000000014', 3, 'Misture tudo e finalize com salsinha.')
    ON CONFLICT DO NOTHING;

    -- 15. Almôndegas de Patinho com Molho Natural
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000015', 'almondegas-patinho-fit', 'Almôndegas de Patinho com Molho Natural', 'Proteína magra', 'https://images.unsplash.com/photo-1529006557870-17483443a787?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 40, 4, cat_fitness_id, 'Marmita semanal', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000015', 'Carne moída (patinho)', '500g', 0),
    ('f1000000-0000-0000-0000-000000000015', 'Farelo de aveia (liga)', '3 colheres de sopa', 1),
    ('f1000000-0000-0000-0000-000000000015', 'Molho de tomate pelado', '1 lata', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000015', 1, 'Molde as almôndegas misturando a carne e aveia.'),
    ('f1000000-0000-0000-0000-000000000015', 2, 'Sele em frigideira com pouco azeite.'),
    ('f1000000-0000-0000-0000-000000000015', 3, 'Cozinhe no molho de tomate por 20 minutos.')
    ON CONFLICT DO NOTHING;

    -- 16. Escondidinho de Frango com Mandioca
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000016', 'escondidinho-frango-mandioca', 'Escondidinho de Frango com Mandioca', 'Energia de longa duração', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800', 'medium', 'low', 45, 4, cat_fitness_id, 'Almoço reforçado', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000016', 'Mandioca cozida e amassada', '500g', 0),
    ('f1000000-0000-0000-0000-000000000016', 'Frango desfiado temperado', '300g', 1),
    ('f1000000-0000-0000-0000-000000000016', 'Iogurte natural (pro purê)', '2 colheres de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000016', 1, 'Faça o purê com mandioca e iogurte.'),
    ('f1000000-0000-0000-0000-000000000016', 2, 'Monte em um refratário: frango em baixo, purê em cima.'),
    ('f1000000-0000-0000-0000-000000000016', 3, 'Leve ao forno para gratinar.')
    ON CONFLICT DO NOTHING;

    -- 17. Salada de Lentilha com Cenoura e Ervas
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000017', 'salada-lentilha-fit', 'Salada de Lentilha com Cenoura e Ervas', 'Ferro e fibras', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 30, 4, cat_fitness_id, 'Acompanhamento saudável', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000017', 'Lentilha cozida', '2 xícaras', 0),
    ('f1000000-0000-0000-0000-000000000017', 'Cenoura ralada', '1 unidade', 1),
    ('f1000000-0000-0000-0000-000000000017', 'Salsinha e cebolinha', 'a gosto', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000017', 1, 'Cozinhe a lentilha al dente.'),
    ('f1000000-0000-0000-0000-000000000017', 2, 'Misture com a cenoura e temperos verdes.'),
    ('f1000000-0000-0000-0000-000000000017', 3, 'Sirva fria ou morna.')
    ON CONFLICT DO NOTHING;

    -- 18. Hambúrguer de Lentilha e Cogumelos
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000018', 'hamburguer-lentilha-vegetariano', 'Hambúrguer de Lentilha e Cogumelos', 'Opção vegetariana e fit', 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800', 'medium', 'medium', 40, 4, cat_fitness_id, 'Noite de lanche fit', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000018', 'Lentilha cozida e seca', '2 xícaras', 0),
    ('f1000000-0000-0000-0000-000000000018', 'Cogumelos picados', '100g', 1),
    ('f1000000-0000-0000-0000-000000000018', 'Farinha de aveia', '4 colheres de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000018', 1, 'Processe a lentilha e cogumelos.'),
    ('f1000000-0000-0000-0000-000000000018', 2, 'Adicione a farinha até dar liga.'),
    ('f1000000-0000-0000-0000-000000000018', 3, 'Grelhe os discos em frigideira antiaderente.')
    ON CONFLICT DO NOTHING;

    -- 19. Crepioca de Ricota e Espinafre
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000019', 'crepioca-ricota-espinafre', 'Crepioca de Ricota e Espinafre', 'Clássica e leve', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 10, 1, cat_fitness_id, 'Jantar rápido', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000019', 'Ovo', '1 unidade', 0),
    ('f1000000-0000-0000-0000-000000000019', 'Goma de tapioca', '2 colheres de sopa', 1),
    ('f1000000-0000-0000-0000-000000000019', 'Ricota amassada', '2 colheres de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000019', 1, 'Bata o ovo com a tapioca.'),
    ('f1000000-0000-0000-0000-000000000019', 2, 'Prepare a massa na frigideira.'),
    ('f1000000-0000-0000-0000-000000000019', 3, 'Recheie com ricota e espinafre refogado.')
    ON CONFLICT DO NOTHING;

    -- 20. Frango Xadrez Light
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000020', 'frango-xadrez-light', 'Frango Xadrez Light', 'Sabor oriental sem excessos', 'https://images.unsplash.com/photo-1512485600893-b08ec1d59f1c?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 25, 4, cat_fitness_id, 'Almoço prático', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000020', 'Peito de frango em cubos', '400g', 0),
    ('f1000000-0000-0000-0000-000000000020', 'Pimentão verde e vermelho', '1 unidade cada', 1),
    ('f1000000-0000-0000-0000-000000000020', 'Shoyu light', '3 colheres de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000020', 1, 'Grelhe o frango.'),
    ('f1000000-0000-0000-0000-000000000020', 2, 'Adicione os pimentões e amendoim (opcional).'),
    ('f1000000-0000-0000-0000-000000000020', 3, 'Finalize com o molho shoyu e cozinhe por 5 minutos.')
    ON CONFLICT DO NOTHING;

    -- 21. Berinjela Recheada com Carne Moída
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000021', 'berinjela-recheada-carne', 'Berinjela Recheada com Carne Moída', 'Low carb saboroso', 'https://images.unsplash.com/photo-1598511726623-d30909590659?auto=format&fit=crop&q=80&w=800', 'medium', 'low', 40, 2, cat_fitness_id, 'Jantar nutritivo', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000021', 'Berinjela grande', '1 unidade', 0),
    ('f1000000-0000-0000-0000-000000000021', 'Carne moída de patinho', '200g', 1),
    ('f1000000-0000-0000-0000-000000000021', 'Queijo branco', '30g', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000021', 1, 'Corte a berinjela ao meio e retire parte da polpa.'),
    ('f1000000-0000-0000-0000-000000000021', 2, 'Refogue a carne com a polpa retirada.'),
    ('f1000000-0000-0000-0000-000000000021', 3, 'Recheie e asse por 30 minutos.')
    ON CONFLICT DO NOTHING;

    -- 22. Bowl de Iogurte Grego com Frutas
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000022', 'bowl-iogurte-grego', 'Bowl de Iogurte Grego com Frutas', 'Lanche proteico e doce', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 5, 1, cat_fitness_id, 'Lanche da manhã', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000022', 'Iogurte grego zero', '1 pote', 0),
    ('f1000000-0000-0000-0000-000000000022', 'Morangos picados', '5 unidades', 1),
    ('f1000000-0000-0000-0000-000000000022', 'Granola sem açúcar', '1 colher de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000022', 1, 'Coloque o iogurte no bowl.'),
    ('f1000000-0000-0000-0000-000000000022', 2, 'Adicione as frutas organizadamente.'),
    ('f1000000-0000-0000-0000-000000000022', 3, 'Salpique a granola por cima.')
    ON CONFLICT DO NOTHING;

    -- 23. Salada Caesar de Frango Light
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000023', 'salada-caesar-light', 'Salada Caesar de Frango Light', 'Molho de iogurte', 'https://images.unsplash.com/photo-1546793665-c74683c3ef86?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 20, 2, cat_fitness_id, 'Almoço fitness', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000023', 'Alface romana', '1 maço', 0),
    ('f1000000-0000-0000-0000-000000000023', 'Tiras de frango grelhado', '150g', 1),
    ('f1000000-0000-0000-0000-000000000023', 'Iogurte natural (pro molho)', '1/2 pote', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000023', 1, 'Prepare o molho misturando iogurte, limão e um pouco de parmesão.'),
    ('f1000000-0000-0000-0000-000000000023', 2, 'Misture a alface e o frango.'),
    ('f1000000-0000-0000-0000-000000000023', 3, 'Regue com o molho e sirva.')
    ON CONFLICT DO NOTHING;

    -- 24. Quiche Fit de Alho Poró
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000024', 'quiche-fit-alho-poro', 'Quiche Fit de Alho Poró', 'Massa de aveia e iogurte', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800', 'medium', 'medium', 45, 6, cat_fitness_id, 'Café da tarde saudável', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000024', 'Farinha de aveia', '1.5 xícaras', 0),
    ('f1000000-0000-0000-0000-000000000024', 'Alho poró fatiado', '1 unidade', 1),
    ('f1000000-0000-0000-0000-000000000024', 'Creme de leite light', '1 caixinha', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000024', 1, 'Faça a massa com aveia e um pouco de água/azeite.'),
    ('f1000000-0000-0000-0000-000000000024', 2, 'Prepare o recheio batendo ovos com creme de leite e alho poró.'),
    ('f1000000-0000-0000-0000-000000000024', 3, 'Asse por 30 minutos em fogo médio.')
    ON CONFLICT DO NOTHING;

    -- 25. Sopa de Abóbora com Gengibre
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000025', 'sopa-abobora-gengibre', 'Sopa de Abóbora com Gengibre', 'Termogênica e reconfortante', 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 35, 4, cat_fitness_id, 'Jantar de inverno fit', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000025', 'Abóbora cabotiá picada', '500g', 0),
    ('f1000000-0000-0000-0000-000000000025', 'Gengibre ralado', '1 colher de chá', 1),
    ('f1000000-0000-0000-0000-000000000025', 'Água ou caldo de legumes', '1 litro', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000025', 1, 'Cozinhe a abóbora até desmanchar.'),
    ('f1000000-0000-0000-0000-000000000025', 2, 'Bata no liquidificador com o gengibre.'),
    ('f1000000-0000-0000-0000-000000000025', 3, 'Aqueça e sirva com sementes de abóbora.')
    ON CONFLICT DO NOTHING;

    -- 26. Filé de Frango Empanado na Farinha de Amêndoas
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000026', 'frango-empanado-amendoas', 'Filé de Frango Empanado na Farinha de Amêndoas', 'Keto friendly', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&q=80&w=800', 'medium', 'high', 25, 2, cat_fitness_id, 'Jantar crocante fit', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000026', 'Filé de frango', '2 unidades', 0),
    ('f1000000-0000-0000-0000-000000000026', 'Farinha de amêndoas', '1/2 xícara', 1),
    ('f1000000-0000-0000-0000-000000000026', 'Ovo batido', '1 unidade', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000026', 1, 'Passe o frango no ovo e depois na farinha de amêndoas.'),
    ('f1000000-0000-0000-0000-000000000026', 2, 'Tempere bem com ervas secas.'),
    ('f1000000-0000-0000-0000-000000000026', 3, 'Asse na airfryer por 15 minutos.')
    ON CONFLICT DO NOTHING;

    -- 27. Espaguete de Cenoura ao Pesto
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000027', 'espaguete-cenoura-pesto', 'Espaguete de Cenoura ao Pesto', 'Vegetariano e antioxidante', 'https://images.unsplash.com/photo-1473093226795-af9932fe5855?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 15, 2, cat_fitness_id, 'Almoço rápido fit', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000027', 'Cenoura em tiras finas', '2 unidades', 0),
    ('f1000000-0000-0000-0000-000000000027', 'Molho pesto caseiro', '2 colheres de sopa', 1),
    ('f1000000-0000-0000-0000-000000000027', 'Castanhas picadas', '1 colher de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000027', 1, 'Cozinhe as tiras de cenoura no vapor por 3 minutos.'),
    ('f1000000-0000-0000-0000-000000000027', 2, 'Misture o molho pesto delicadamente.'),
    ('f1000000-0000-0000-0000-000000000027', 3, 'Sirva imediatamente.')
    ON CONFLICT DO NOTHING;

    -- 28. Tabule de Quinoa
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000028', 'tabule-quinoa-fit', 'Tabule de Quinoa', 'Substituindo o trigo', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 20, 4, cat_fitness_id, 'Acompanhamento mediterrâneo', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000028', 'Quinoa cozida', '1 xícara', 0),
    ('f1000000-0000-0000-0000-000000000028', 'Tomate picado', '1 unidade', 1),
    ('f1000000-0000-0000-0000-000000000028', 'Hortelã fresca', 'a gosto', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000028', 1, 'Misture a quinoa fria com vegetais picados.'),
    ('f1000000-0000-0000-0000-000000000028', 2, 'Adicione bastante limão e azeite.'),
    ('f1000000-0000-0000-0000-000000000028', 3, 'Deixe na geladeira por 30 minutos antes de servir.')
    ON CONFLICT DO NOTHING;

    -- 29. Moqueca de Banana da Terra
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000029', 'moqueca-banana-terra-fit', 'Moqueca de Banana da Terra', 'Vegan e nutritiva', 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=800', 'medium', 'medium', 40, 4, cat_fitness_id, 'Almoço especial saudável', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000029', 'Banana da terra madura', '3 unidades', 0),
    ('f1000000-0000-0000-0000-000000000029', 'Leite de coco light', '200ml', 1),
    ('f1000000-0000-0000-0000-000000000029', 'Azeite de dendê', '1 colher de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000029', 1, 'Refogue cebola, tomate e pimentão.'),
    ('f1000000-0000-0000-0000-000000000029', 2, 'Adicione as bananas em rodelas e o leite de coco.'),
    ('f1000000-0000-0000-0000-000000000029', 3, 'Cozinhe em fogo baixo por 15 minutos.')
    ON CONFLICT DO NOTHING;

    -- 30. Coxinha Fit de Batata Doce
    INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, published_at, created_by)
    VALUES ('f1000000-0000-0000-0000-000000000030', 'coxinha-fit-batata-doce', 'Coxinha Fit de Batata Doce', 'Salgadinho sem culpa', 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=800', 'hard', 'low', 60, 10, cat_fitness_id, 'Lanche pré-treino', 'published', now(), admin_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO recipe_ingredients (recipe_id, name, quantity_label, sort_order) VALUES
    ('f1000000-0000-0000-0000-000000000030', 'Batata doce cozida e amassada', '500g', 0),
    ('f1000000-0000-0000-0000-000000000030', 'Frango desfiado (recheio)', '200g', 1),
    ('f1000000-0000-0000-0000-000000000030', 'Farinha de linhaça (empanar)', '3 colheres de sopa', 2)
    ON CONFLICT DO NOTHING;

    INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
    ('f1000000-0000-0000-0000-000000000030', 1, 'Modele as coxinhas com a massa de batata doce e recheie.'),
    ('f1000000-0000-0000-0000-000000000030', 2, 'Passe na farinha de linhaça.'),
    ('f1000000-0000-0000-0000-000000000030', 3, 'Asse no forno ou airfryer por 20 minutos.')
    ON CONFLICT DO NOTHING;


    -- Vínculo com a Coleção Saúde e Fitness (ID c0000000-0000-0000-0000-000000000003)
    INSERT INTO recipe_collection_items (collection_id, recipe_id, sort_order)
    SELECT coll_fitness_id, id, (row_number() OVER ()) + 10
    FROM recipes
    WHERE id::text LIKE 'f1000000-%'
    ON CONFLICT DO NOTHING;

END $$;

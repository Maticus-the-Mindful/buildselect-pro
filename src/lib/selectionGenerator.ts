// @ts-nocheck
import { supabase } from './supabase';

export async function generateSelections(projectId: string, catalogId: string) {
  const { data: questionnaire } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('project_id', projectId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!questionnaire) {
    throw new Error('Questionnaire not found');
  }

  const categories = questionnaire.categories_selected as string[];
  const roomList = questionnaire.room_list as Array<{ name: string; type: string }>;

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('catalog_id', catalogId)
    .in('category', categories)
    .eq('is_available', true);

  if (!products || products.length === 0) {
    throw new Error('No products found for selected categories');
  }

  const categoryGroups: Record<string, typeof products> = {};
  products.forEach(product => {
    if (!categoryGroups[product.category]) {
      categoryGroups[product.category] = [];
    }
    categoryGroups[product.category].push(product);
  });

  const selections = [];
  let sortOrder = 0;

  for (const room of roomList) {
    for (const category of categories) {
      const categoryProducts = categoryGroups[category] || [];
      if (categoryProducts.length === 0) continue;

      const subcategoryGroups: Record<string, typeof products> = {};
      categoryProducts.forEach(product => {
        const subcat = product.subcategory || 'general';
        if (!subcategoryGroups[subcat]) {
          subcategoryGroups[subcat] = [];
        }
        subcategoryGroups[subcat].push(product);
      });

      for (const [subcategory, products] of Object.entries(subcategoryGroups)) {
        const product = products[Math.floor(Math.random() * products.length)];

        const finishOptions = product.finish_options as string[] | null;
        const preferredFinishes = questionnaire.finish_colors as string[];
        let selectedFinish = null;

        if (finishOptions && finishOptions.length > 0) {
          const matchingFinish = finishOptions.find(f =>
            preferredFinishes.some(pf => f.toLowerCase().includes(pf.toLowerCase()))
          );
          selectedFinish = matchingFinish || finishOptions[0];
        }

        const quantity = getQuantityForRoomAndSubcategory(room.type, subcategory);
        const unitPrice = product.price ? parseFloat(product.price.toString()) : 0;
        const extendedPrice = unitPrice * quantity;

        selections.push({
          project_id: projectId,
          product_id: product.id,
          room_name: room.name,
          quantity,
          finish: selectedFinish,
          unit_price: unitPrice,
          extended_price: extendedPrice,
          sort_order: sortOrder++,
          is_locked: false
        });
      }
    }
  }

  if (selections.length > 0) {
    await supabase.from('selections').delete().eq('project_id', projectId);

    await supabase.from('selections').insert(selections);

    await supabase
      .from('projects')
      .update({ status: 'review', updated_at: new Date().toISOString() })
      .eq('id', projectId);
  }

  return selections;
}

function getQuantityForRoomAndSubcategory(roomType: string, subcategory: string): number {
  const quantityMap: Record<string, Record<string, number>> = {
    kitchen: {
      kitchen_faucet: 1,
      kitchen_sink: 1,
      dishwasher: 1,
      refrigerator: 1,
      pendant: 3,
      ceiling: 2,
      outlet: 6,
      cabinet_hardware: 24
    },
    bathroom: {
      bathroom_sink: 1,
      bathroom_faucet: 1,
      shower: 1,
      toilet: 1,
      pendant: 1,
      ceiling: 1,
      outlet: 4,
      cabinet_hardware: 6
    },
    general: {
      ceiling: 1,
      outlet: 4,
      thermostat: 1
    }
  };

  return quantityMap[roomType]?.[subcategory] || quantityMap['general']?.[subcategory] || 1;
}

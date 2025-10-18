// @ts-nocheck
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateSelections } from '../../lib/selectionGenerator';

interface QuestionnaireFormProps {
  projectId: string;
  onComplete: () => void;
}

interface QuestionnaireData {
  categories_selected: string[];
  energy_type: 'electric' | 'gas' | 'hybrid' | 'solar' | null;
  style: string;
  finish_colors: string[];
  preferred_brands: string[];
  room_list: Array<{ name: string; type: string }>;
  category_budgets: Record<string, number>;
}

const CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing Fixtures', icon: '🚰' },
  { id: 'lighting', label: 'Lighting', icon: '💡' },
  { id: 'appliances', label: 'Appliances', icon: '🔌' },
  { id: 'hvac', label: 'HVAC', icon: '❄️' },
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'hardware', label: 'Hardware', icon: '🔧' }
];

const STYLES = ['Modern', 'Traditional', 'Transitional', 'Contemporary', 'Farmhouse', 'Industrial'];
const FINISHES = ['Chrome', 'Brushed Nickel', 'Matte Black', 'Bronze', 'Brass', 'Stainless Steel'];
const BRANDS = ['Kohler', 'Moen', 'Delta', 'GE', 'Whirlpool', 'Samsung', 'LG'];

export function QuestionnaireForm({ projectId, onComplete }: QuestionnaireFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QuestionnaireData>({
    categories_selected: [],
    energy_type: null,
    style: '',
    finish_colors: [],
    preferred_brands: [],
    room_list: [],
    category_budgets: {}
  });

  const totalSteps = 5;

  const handleCategoryToggle = (category: string) => {
    setData(prev => ({
      ...prev,
      categories_selected: prev.categories_selected.includes(category)
        ? prev.categories_selected.filter(c => c !== category)
        : [...prev.categories_selected, category]
    }));
  };

  const handleFinishToggle = (finish: string) => {
    setData(prev => ({
      ...prev,
      finish_colors: prev.finish_colors.includes(finish)
        ? prev.finish_colors.filter(f => f !== finish)
        : [...prev.finish_colors, finish]
    }));
  };

  const handleBrandToggle = (brand: string) => {
    setData(prev => ({
      ...prev,
      preferred_brands: prev.preferred_brands.includes(brand)
        ? prev.preferred_brands.filter(b => b !== brand)
        : [...prev.preferred_brands, brand]
    }));
  };

  const addRoom = () => {
    setData(prev => ({
      ...prev,
      room_list: [...prev.room_list, { name: '', type: 'general' }]
    }));
  };

  const updateRoom = (index: number, field: 'name' | 'type', value: string) => {
    setData(prev => ({
      ...prev,
      room_list: prev.room_list.map((room, i) =>
        i === index ? { ...room, [field]: value } : room
      )
    }));
  };

  const removeRoom = (index: number) => {
    setData(prev => ({
      ...prev,
      room_list: prev.room_list.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await supabase.from('questionnaires').upsert({
        project_id: projectId,
        categories_selected: data.categories_selected,
        energy_type: data.energy_type,
        style: data.style,
        finish_colors: data.finish_colors,
        preferred_brands: data.preferred_brands,
        room_list: data.room_list,
        category_budgets: data.category_budgets,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'project_id'
      });

      await supabase
        .from('projects')
        .update({ status: 'generating', updated_at: new Date().toISOString() })
        .eq('id', projectId);

      const { data: project } = await supabase
        .from('projects')
        .select('catalog_id')
        .eq('id', projectId)
        .single();

      let catalogId = project?.catalog_id;

      if (!catalogId) {
        const { data: catalog } = await supabase
          .from('catalogs')
          .select('id')
          .eq('is_public', true)
          .limit(1)
          .maybeSingle();

        if (catalog) {
          catalogId = catalog.id;
          await supabase
            .from('projects')
            .update({ catalog_id: catalog.id })
            .eq('id', projectId);
        }
      }

      if (catalogId) {
        await generateSelections(projectId, catalogId);
      } else {
        await supabase
          .from('projects')
          .update({ status: 'questionnaire', updated_at: new Date().toISOString() })
          .eq('id', projectId);
      }
    } catch (error) {
      console.error('Error completing questionnaire:', error);
      await supabase
        .from('projects')
        .update({ status: 'questionnaire', updated_at: new Date().toISOString() })
        .eq('id', projectId);
    }

    setLoading(false);
    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.categories_selected.length > 0;
      case 2:
        return data.energy_type !== null;
      case 3:
        return data.style !== '' && data.finish_colors.length > 0;
      case 4:
        return data.room_list.length > 0 && data.room_list.every(r => r.name.trim());
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Questionnaire</h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">Step {step} of {totalSteps}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            What categories do you need selections for?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryToggle(cat.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  data.categories_selected.includes(cat.id)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 dark:border-slate-600 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <div className="font-medium text-gray-900 dark:text-white">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            What type of energy system?
          </h3>
          <div className="space-y-3">
            {(['electric', 'gas', 'hybrid', 'solar'] as const).map(type => (
              <button
                key={type}
                onClick={() => setData(prev => ({ ...prev, energy_type: type }))}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  data.energy_type === type
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white capitalize">{type}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Design Style</h3>
            <select
              value={data.style}
              onChange={(e) => setData(prev => ({ ...prev, style: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a style</option>
              {STYLES.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferred Finishes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FINISHES.map(finish => (
                <button
                  key={finish}
                  onClick={() => handleFinishToggle(finish)}
                  className={`p-3 border-2 rounded-lg text-sm transition-all ${
                    data.finish_colors.includes(finish)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 dark:border-slate-600 hover:border-gray-400'
                  }`}
                >
                  {finish}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferred Brands (Optional)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {BRANDS.map(brand => (
                <button
                  key={brand}
                  onClick={() => handleBrandToggle(brand)}
                  className={`p-3 border-2 rounded-lg text-sm transition-all ${
                    data.preferred_brands.includes(brand)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 dark:border-slate-600 hover:border-gray-400'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Room List</h3>
            <button
              onClick={addRoom}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Room
            </button>
          </div>

          {data.room_list.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-300">
              Add rooms to specify where products will be used
            </div>
          ) : (
            <div className="space-y-3">
              {data.room_list.map((room, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={room.name}
                    onChange={(e) => updateRoom(index, 'name', e.target.value)}
                    placeholder="Room name (e.g., Master Bath, Kitchen)"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={room.type}
                    onChange={(e) => updateRoom(index, 'type', e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="bathroom">Bathroom</option>
                    <option value="bedroom">Bedroom</option>
                    <option value="living">Living</option>
                  </select>
                  <button
                    onClick={() => removeRoom(index)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Your Selections</h3>
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
              <p className="text-gray-900 dark:text-white">{data.categories_selected.join(', ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Energy Type</p>
              <p className="text-gray-900 dark:text-white capitalize">{data.energy_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Style</p>
              <p className="text-gray-900 dark:text-white">{data.style}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Finishes</p>
              <p className="text-gray-900 dark:text-white">{data.finish_colors.join(', ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rooms</p>
              <p className="text-gray-900 dark:text-white">{data.room_list.map(r => r.name).join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        {step < totalSteps ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            {loading ? 'Submitting...' : 'Complete Questionnaire'}
          </button>
        )}
      </div>
    </div>
  );
}

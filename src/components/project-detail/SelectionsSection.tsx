// @ts-nocheck
import { useState, useEffect } from 'react';
import { Package, Download, RefreshCw, Sparkles, Edit2, Save, X, Trash2, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateSelections } from '../../lib/selectionGenerator';
import type { Database } from '../../lib/database.types';

type Selection = Database['public']['Tables']['selections']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

interface SelectionWithProduct extends Selection {
  product: Product;
}

interface SelectionsSectionProps {
  projectId: string;
}

export function SelectionsSection({ projectId }: SelectionsSectionProps) {
  const [selections, setSelections] = useState<SelectionWithProduct[]>([]);
  const [filteredSelections, setFilteredSelections] = useState<SelectionWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ quantity: number; finish: string; notes: string }>({
    quantity: 1,
    finish: '',
    notes: ''
  });
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadSelections();
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [selections, filterRoom, filterCategory]);

  const loadSelections = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('selections')
      .select(`
        *,
        product:products(*)
      `)
      .eq('project_id', projectId)
      .order('sort_order');

    if (data) {
      setSelections(data as any);
    }

    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...selections];

    if (filterRoom !== 'all') {
      filtered = filtered.filter(s => s.room_name === filterRoom);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(s => s.product.category === filterCategory);
    }

    setFilteredSelections(filtered);
  };

  const uniqueRooms = Array.from(new Set(selections.map(s => s.room_name)));
  const uniqueCategories = Array.from(new Set(selections.map(s => s.product.category)));

  const startEditing = (selection: SelectionWithProduct) => {
    setEditingId(selection.id);
    setEditValues({
      quantity: selection.quantity,
      finish: selection.finish || '',
      notes: selection.notes || ''
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveSelection = async (selectionId: string) => {
    const selection = selections.find(s => s.id === selectionId);
    if (!selection) return;

    const unitPrice = selection.unit_price || 0;
    const extendedPrice = Number(unitPrice) * editValues.quantity;

    await supabase
      .from('selections')
      .update({
        quantity: editValues.quantity,
        finish: editValues.finish || null,
        notes: editValues.notes || null,
        extended_price: extendedPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectionId);

    setEditingId(null);
    loadSelections();
  };

  const deleteSelection = async (selectionId: string) => {
    if (!confirm('Are you sure you want to remove this selection?')) return;

    await supabase.from('selections').delete().eq('id', selectionId);
    loadSelections();
  };

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      await supabase
        .from('projects')
        .update({ status: 'generating', updated_at: new Date().toISOString() })
        .eq('id', projectId);

      const { data: project } = await supabase
        .from('projects')
        .select('catalog_id')
        .eq('id', projectId)
        .single();

      if (!project?.catalog_id) {
        const { data: catalog } = await supabase
          .from('catalogs')
          .select('id')
          .eq('is_public', true)
          .limit(1)
          .maybeSingle();

        if (catalog) {
          await supabase
            .from('projects')
            .update({ catalog_id: catalog.id })
            .eq('id', projectId);

          await generateSelections(projectId, catalog.id);
        } else {
          await supabase
            .from('projects')
            .update({ status: 'questionnaire', updated_at: new Date().toISOString() })
            .eq('id', projectId);
        }
      } else {
        await generateSelections(projectId, project.catalog_id);
      }

      await loadSelections();
    } catch (error) {
      console.error('Error generating selections:', error);
      await supabase
        .from('projects')
        .update({ status: 'questionnaire', updated_at: new Date().toISOString() })
        .eq('id', projectId);
    }

    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading selections...</p>
      </div>
    );
  }

  if (selections.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 p-12 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Selections Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Complete the questionnaire to generate product selections
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50"
        >
          {generating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Generating Selections...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Selections
            </>
          )}
        </button>
      </div>
    );
  }

  const totalAmount = filteredSelections.reduce((sum, sel) => {
    const price = Number(sel.extended_price) || 0;
    return sum + price;
  }, 0);

  const displaySelections = filteredSelections.length > 0 ? filteredSelections : selections;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Product Selections</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {displaySelections.length} of {selections.length} items
              {(filterRoom !== 'all' || filterCategory !== 'all') && ' (filtered)'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-300">Total Estimate</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {selections.length > 0 && (
          <div className="flex gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Rooms</option>
                {uniqueRooms.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {(filterRoom !== 'all' || filterCategory !== 'all') && (
              <button
                onClick={() => {
                  setFilterRoom('all');
                  setFilterCategory('all');
                }}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        <div className="space-y-4">
          {displaySelections.map((selection) => (
            <div key={selection.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              {editingId === selection.id ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    {selection.product.image_url && (
                      <img
                        src={selection.product.image_url}
                        alt={selection.product.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{selection.product.name}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={editValues.quantity}
                            onChange={(e) => setEditValues(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Finish</label>
                          <input
                            type="text"
                            value={editValues.finish}
                            onChange={(e) => setEditValues(prev => ({ ...prev, finish: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                        <textarea
                          value={editValues.notes}
                          onChange={(e) => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveSelection(selection.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  {selection.product.image_url && (
                    <img
                      src={selection.product.image_url}
                      alt={selection.product.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{selection.product.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">SKU: {selection.product.sku}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Brand: {selection.product.brand}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Category: {selection.product.category}</p>
                        {selection.finish && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">Finish: {selection.finish}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Qty: {selection.quantity}</p>
                        {selection.unit_price && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">@ ${Number(selection.unit_price).toFixed(2)}</p>
                        )}
                        {selection.extended_price && (
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            ${Number(selection.extended_price).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Room: {selection.room_name}</p>
                    {selection.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">{selection.notes}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => startEditing(selection)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSelection(selection.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
          <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-5 h-5" />
            Download Selection Book
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-5 h-5" />
            Download Quote Sheet
          </button>
        </div>
      </div>
    </div>
  );
}

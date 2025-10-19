// @ts-nocheck
import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, ClipboardList, Package, Settings, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { SelectionsSection } from '../components/project-detail/SelectionsSection';
import { QuestionnaireForm } from '../components/questionnaire/QuestionnaireForm';
import { FileUpload } from '../components/files/FileUpload';
import { FileList } from '../components/files/FileList';
import { Navbar } from '../components/layout/Navbar';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectDetailProps {
  projectId: string;
}

type TabType = 'overview' | 'files' | 'questionnaire' | 'selections';

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (!error && data) {
      setProject(data);
    }

    setLoading(false);
  };

  const handleBackToDashboard = () => {
    window.location.href = '/';
  };

  const updateProjectStatus = async (newStatus: Project['status']) => {
    await supabase
      .from('projects')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    loadProject();
  };

  const handleDeleteProject = async () => {
    if (!project || deleteConfirmation !== project.name) {
      return;
    }

    setDeleting(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setDeleting(false);
      alert('Delete operation timed out. Please try again.');
    }, 30000); // 30 second timeout
    
    try {
      // Delete associated files first
      const { data: files } = await supabase
        .from('project_files')
        .select('file_path')
        .eq('project_id', projectId);

      if (files && files.length > 0) {
        const filePaths = files.map(file => file.file_path);
        await supabase.storage.from('project-files').remove(filePaths);
      }

      // Delete project (this will cascade delete related records)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error deleting project:', error);
        alert(`Failed to delete project: ${error.message}`);
        setDeleting(false);
        return;
      }

      // Redirect to dashboard
      window.location.href = '/';
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error deleting project:', error);
      alert(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
          <button
            onClick={handleBackToDashboard}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const canApprove = project.status === 'review';
  const canExport = project.status === 'approved';

  const tabs: { id: TabType; label: string; icon: typeof FileText }[] = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'files', label: 'Plans & Files', icon: FileText },
    { id: 'questionnaire', label: 'Questionnaire', icon: ClipboardList },
    { id: 'selections', label: 'Selections', icon: Package }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      <Navbar />

      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              {project.client_name && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Client: {project.client_name}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
              {canApprove && (
                <button
                  onClick={() => updateProjectStatus('approved')}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Approve</span>
                </button>
              )}
              {canExport && (
                <button
                  onClick={() => updateProjectStatus('exported')}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  <Package className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Mark as Exported</span>
                  <span className="sm:hidden">Export</span>
                </button>
              )}
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Delete Project</span>
                <span className="sm:hidden">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 lg:px-6 py-4 font-medium transition-colors flex-1 ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm lg:text-base text-center leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'overview' && <OverviewTab project={project} onUpdate={loadProject} />}
          {activeTab === 'files' && <FilesTab projectId={project.id} />}
          {activeTab === 'questionnaire' && <QuestionnaireTab projectId={project.id} />}
          {activeTab === 'selections' && <SelectionsSection projectId={project.id} />}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Project
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This action cannot be undone. This will permanently delete the project, all associated files, and selections.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type the project name to confirm deletion:
              </label>
              <div className="bg-gray-50 dark:bg-slate-700 p-2 rounded border text-sm text-gray-600 dark:text-gray-400 mb-2">
                Project name: <span className="font-mono font-medium">{project.name}</span>
              </div>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Enter project name here"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
              {deleteConfirmation !== project.name && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {deleteConfirmation.length > 0 
                    ? `Project name doesn't match. Please type exactly: ${project.name}`
                    : "Please type the project name to enable deletion"
                  }
                </p>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmation('');
                  setDeleting(false);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={deleteConfirmation !== project.name || deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: Project['status']) {
  const colors = {
    draft: 'bg-gray-100 text-gray-700',
    questionnaire: 'bg-blue-100 text-blue-700',
    generating: 'bg-yellow-100 text-yellow-700',
    review: 'bg-purple-100 text-purple-700',
    approved: 'bg-green-100 text-green-700',
    exported: 'bg-slate-100 text-slate-700'
  };
  return colors[status] || colors.draft;
}

function getStatusLabel(status: Project['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

interface OverviewTabProps {
  project: Project;
  onUpdate: () => void;
}

function OverviewTab({ project, onUpdate }: OverviewTabProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [clientName, setClientName] = useState(project.client_name || '');
  const [clientEmail, setClientEmail] = useState(project.client_email || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    await supabase
      .from('projects')
      .update({
        name,
        client_name: clientName || null,
        client_email: clientEmail || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', project.id);

    setSaving(false);
    setEditing(false);
    onUpdate();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Project Information</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Email</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Project Name</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">{project.name}</p>
          </div>
          {project.client_name && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Client Name</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{project.client_name}</p>
            </div>
          )}
          {project.client_email && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Client Email</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{project.client_email}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {new Date(project.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FilesTab({ projectId }: { projectId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Upload Section - Takes 1 column on desktop */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Files</h3>
          <FileUpload
            projectId={projectId}
            onUploadComplete={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      </div>

      {/* Files List Section - Takes 2 columns on desktop */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Files</h3>
          <FileList
            key={refreshKey}
            projectId={projectId}
            onFileDeleted={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      </div>
    </div>
  );
}

function QuestionnaireTab({ projectId }: { projectId: string }) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const updateStatusToQuestionnaire = async () => {
      const { data: project } = await supabase
        .from('projects')
        .select('status')
        .eq('id', projectId)
        .single();

      if (project?.status === 'draft') {
        await supabase
          .from('projects')
          .update({ status: 'questionnaire', updated_at: new Date().toISOString() })
          .eq('id', projectId);
      }
    };

    updateStatusToQuestionnaire();
  }, [projectId]);

  return (
    <div>
      {completed ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-green-200 dark:border-green-700 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Questionnaire Completed!</h3>
          <p className="text-gray-600 dark:text-gray-300">Your selections are being generated. Check the Selections tab shortly.</p>
        </div>
      ) : (
        <QuestionnaireForm projectId={projectId} onComplete={() => setCompleted(true)} />
      )}
    </div>
  );
}

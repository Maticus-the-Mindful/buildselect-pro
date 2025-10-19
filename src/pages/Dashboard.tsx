// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FolderOpen, Calendar, User, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { WelcomeModal } from '../components/dashboard/WelcomeModal';
import { HeroSection } from '../components/dashboard/HeroSection';
import { ChecklistProgress } from '../components/dashboard/ChecklistProgress';
import { TrustMetrics } from '../components/dashboard/TrustMetrics';
import { StarterTemplates } from '../components/dashboard/StarterTemplates';
import { SampleProject } from '../components/dashboard/SampleProject';
import { WhatsNew } from '../components/dashboard/WhatsNew';
import { EmptyState } from '../components/dashboard/EmptyState';
import { Navbar } from '../components/layout/Navbar';

type Project = Database['public']['Tables']['projects']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export function Dashboard() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const [projectsResult, subResult] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false }),
      supabase
        .from('subscriptions')
        .select('*')
        .maybeSingle()
    ]);

    if (projectsResult.data) {
      setProjects(projectsResult.data);
      if (projectsResult.data.length === 0) {
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
        if (!hasSeenWelcome) {
          setShowWelcome(true);
        }
      }
    }
    if (subResult.data) setSubscription(subResult.data);

    setLoading(false);
  };

  const getStatusColor = (status: Project['status']) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      questionnaire: 'bg-blue-100 text-blue-700',
      generating: 'bg-yellow-100 text-yellow-700',
      review: 'bg-purple-100 text-purple-700',
      approved: 'bg-green-100 text-green-700',
      exported: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status: Project['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleProjectClick = (projectId: string) => {
    window.history.pushState({}, '', `/project/${projectId}`);
    window.location.reload();
  };

  const handleDeleteProject = async (project: Project, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete || deleteConfirmation !== projectToDelete.name) {
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
        .eq('project_id', projectToDelete.id);

      if (files && files.length > 0) {
        const filePaths = files.map(file => file.file_path);
        await supabase.storage.from('project-files').remove(filePaths);
      }

      // Delete project (this will cascade delete related records)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id);

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error deleting project:', error);
        alert(`Failed to delete project: ${error.message}`);
        setDeleting(false);
        return;
      }

      // Refresh the projects list
      loadData();
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
      setProjectToDelete(null);
      setDeleting(false);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error deleting project:', error);
      alert(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDeleting(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    console.log('Selected template:', templateId);
    // Template selection logic - will create project with template
    setShowNewProject(true);
  };

  const handleOpenSample = () => {
    console.log('Opening sample project');
    // Logic to open/create sample project
  };

  const handleWatchDemo = () => {
    console.log('Watch demo clicked');
    // Logic to show demo video/modal
  };

  const handleUploadPlan = () => {
    console.log('Upload plan clicked');
    // Logic to trigger file upload
    setShowNewProject(true);
  };

  const handleUseDemoCatalog = () => {
    console.log('Using Ferguson demo catalog');
    // Logic to set demo catalog as default
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors overflow-x-hidden">
      <Navbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full">
        {/* Hero Section - Always visible for new users or when no projects */}
        {projects.length === 0 && (
          <HeroSection
            onCreateProject={() => setShowNewProject(true)}
            onUploadPlan={handleUploadPlan}
            onWatchDemo={handleWatchDemo}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 min-h-0">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {projects.length === 0 ? (
              <>
                <EmptyState
                  onCreateProject={() => setShowNewProject(true)}
                  onUseDemoCatalog={handleUseDemoCatalog}
                />
                <StarterTemplates onSelectTemplate={handleSelectTemplate} />
                <SampleProject onOpenSample={handleOpenSample} />
              </>
            ) : (
              <>
                {/* Projects Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 md:p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Your Projects</h2>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">{projects.length} total projects</p>
                    </div>
                    <button
                      onClick={() => setShowNewProject(true)}
                      disabled={subscription && subscription.projects_used >= subscription.project_limit}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm sm:text-base"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      New Project
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 sm:p-5 border border-gray-200 dark:border-slate-600 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex-1">{project.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 sm:py-1 rounded text-xs font-medium flex-shrink-0 whitespace-nowrap ${getStatusColor(project.status)}`}>
                              {getStatusLabel(project.status)}
                            </span>
                            <button
                              onClick={(e) => handleDeleteProject(project, e)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {project.client_name && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="truncate">{project.client_name}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-3">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          Updated {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <ChecklistProgress />
              </>
            )}
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-4 sm:space-y-6">
            <TrustMetrics />
            <WhatsNew />
          </div>
        </div>
      </main>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onSuccess={() => {
            setShowNewProject(false);
            loadData();
          }}
        />
      )}

      {showWelcome && (
        <WelcomeModal
          onClose={() => {
            setShowWelcome(false);
            localStorage.setItem('hasSeenWelcome', 'true');
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && projectToDelete && (
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
                Project name: <span className="font-mono font-medium">{projectToDelete.name}</span>
              </div>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Enter project name here"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmation('');
                  setProjectToDelete(null);
                  setDeleting(false);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                disabled={deleteConfirmation !== projectToDelete.name || deleting}
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

interface NewProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function NewProjectModal({ onClose, onSuccess }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Get the current user session
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      setError('You must be logged in to create a project');
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: currentUser.id,
        name,
        client_name: clientName || null,
        client_email: clientEmail || null,
        status: 'draft'
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    if (data) {
      window.history.pushState({}, '', `/project/${data.id}`);
      window.location.reload();
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Project</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Smith Residence Renovation"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="John Smith"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Email
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

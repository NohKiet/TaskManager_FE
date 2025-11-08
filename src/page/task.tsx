import React, { useState, useMemo } from "react";
import Sidebar from "../common/sidebar";
import { MOCK_TASKS, MOCK_USERS, MOCK_ASSIGNMENTS } from "../utils/mockdata";
import type { ITask, IUser } from "../utils/interfaces";
import "./task.css";

// Extended task type for form (includes tags and attachments)
interface ITaskForm extends Omit<ITask, 'task_id' | 'created_at' | 'updated_at' | 'is_trashed'> {
  tags?: string[];
  attachments?: File[];
  assignees?: number[];
}

// Status mapping for Kanban columns
const STATUS_MAP: Record<string, string> = {
  'pending': 'To Do',
  'in progress': 'In Progress',
  'completed': 'Done',
  'on hold': 'To Do'
};

const REVERSE_STATUS_MAP: Record<string, ITask['status']> = {
  'To Do': 'pending',
  'In Progress': 'in progress',
  'Done': 'completed'
};

type ViewMode = 'kanban' | 'list';
type SortField = 'title' | 'due_date' | 'priority' | 'assignee';
type SortDirection = 'asc' | 'desc';

const Tasks: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [tasks, setTasks] = useState<ITask[]>(MOCK_TASKS.filter(t => !t.is_trashed));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [draggedTask, setDraggedTask] = useState<ITask | null>(null);

  // Mock tags for tasks (in real app, this would come from the database)
  const [taskTags, setTaskTags] = useState<Record<number, string[]>>({
    1: ['documentation', 'analysis'],
    2: ['database', 'design', 'urgent'],
    3: ['frontend', 'backend', 'authentication']
  });

  // Get all unique categories and tags
  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category));
    return Array.from(cats);
  }, [tasks]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    Object.values(taskTags).forEach(tagArray => {
      tagArray.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [taskTags]);

  // Get assignees for a task
  const getTaskAssignees = (taskId: number): IUser[] => {
    const assignmentUserIds = MOCK_ASSIGNMENTS
      .filter(a => a.task_id === taskId)
      .map(a => a.user_id);
    return MOCK_USERS.filter(u => assignmentUserIds.includes(u.user_id));
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filter by assignee
    if (filterAssignee !== 'all') {
      const userId = parseInt(filterAssignee);
      const assignedTaskIds = MOCK_ASSIGNMENTS
        .filter(a => a.user_id === userId)
        .map(a => a.task_id);
      filtered = filtered.filter(t => assignedTaskIds.includes(t.task_id));
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Filter by tag
    if (filterTag !== 'all') {
      filtered = filtered.filter(t => taskTags[t.task_id]?.includes(filterTag));
    }

    return filtered;
  }, [tasks, filterAssignee, filterCategory, filterTag]);

  // Sort tasks for list view
  const sortedTasks = useMemo(() => {
    if (viewMode !== 'list') return filteredTasks;

    const sorted = [...filteredTasks].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'due_date':
          aVal = new Date(a.due_date).getTime();
          bVal = new Date(b.due_date).getTime();
          break;
        case 'priority':
          const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;
        case 'assignee':
          const aAssignees = getTaskAssignees(a.task_id);
          const bAssignees = getTaskAssignees(b.task_id);
          aVal = aAssignees.length > 0 ? aAssignees[0].full_name : '';
          bVal = bAssignees.length > 0 ? bAssignees[0].full_name : '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredTasks, viewMode, sortField, sortDirection]);

  // Group tasks by status for Kanban
  const kanbanTasks = useMemo(() => {
    const grouped: Record<string, ITask[]> = {
      'To Do': [],
      'In Progress': [],
      'Done': []
    };

    filteredTasks.forEach(task => {
      const statusLabel = STATUS_MAP[task.status] || 'To Do';
      if (grouped[statusLabel]) {
        grouped[statusLabel].push(task);
      }
    });

    return grouped;
  }, [filteredTasks]);

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, task: ITask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!draggedTask) return;

    const newStatus = REVERSE_STATUS_MAP[targetStatus] || 'pending';
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.task_id === draggedTask.task_id
          ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
          : task
      )
    );
    setDraggedTask(null);
  };

  // Handle task creation/update
  const handleSubmitTask = (formData: ITaskForm) => {
    if (selectedTask) {
      // Update existing task
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.task_id === selectedTask.task_id
            ? {
                ...task,
                ...formData,
                updated_at: new Date().toISOString()
              }
            : task
        )
      );
      // Update tags
      if (formData.tags) {
        setTaskTags(prev => ({
          ...prev,
          [selectedTask.task_id]: formData.tags || []
        }));
      }
    } else {
      // Create new task
      const newTaskId = Math.max(...tasks.map(t => t.task_id), 0) + 1;
      const newTask: ITask = {
        task_id: newTaskId,
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_trashed: false
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
      // Save tags
      if (formData.tags && formData.tags.length > 0) {
        setTaskTags(prev => ({
          ...prev,
          [newTaskId]: formData.tags || []
        }));
      }
    }
    setIsFormOpen(false);
    setSelectedTask(null);
  };

  // Handle task deletion
  const handleDeleteTask = (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(prevTasks => prevTasks.filter(t => t.task_id !== taskId));
      setTaskTags(prev => {
        const newTags = { ...prev };
        delete newTags[taskId];
        return newTags;
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  // Get priority color
  const getPriorityColor = (priority: ITask['priority']) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#2ecc71';
      default:
        return '#9aa0a6';
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="tasks-main">
        <div className="tasks-header">
          <div>
            <h1 className="tasks-title">Tasks</h1>
            <p className="tasks-subtitle">Manage and organize your tasks</p>
          </div>
        </div>

        <div className="tasks-controls">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>

          <div className="filters">
            <select
              className="filter-select"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              <option value="all">All Assignees</option>
              {MOCK_USERS.map(user => (
                <option key={user.user_id} value={user.user_id.toString()}>
                  {user.full_name}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          <div className="tasks-header-right">
            <span className="task-count">{filteredTasks.length} tasks</span>
            <button className="new-task-btn" onClick={() => {
              setSelectedTask(null);
              setIsFormOpen(true);
            }}>
              + New Task
            </button>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <div className="kanban-board">
            {Object.entries(kanbanTasks).map(([status, statusTasks]) => (
              <div
                key={status}
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="kanban-column-header">
                  <h3>{status}</h3>
                  <span className="column-count">{statusTasks.length}</span>
                </div>
                <div className="kanban-column-content">
                  {statusTasks.map(task => {
                    const assignees = getTaskAssignees(task.task_id);
                    const tags = taskTags[task.task_id] || [];
                    return (
                      <div
                        key={task.task_id}
                        className="task-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                      >
                        <div className="task-card-header">
                          <h4 className="task-card-title">{task.title}</h4>
                          <div className="task-card-actions">
                            <button
                              className="icon-btn"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsFormOpen(true);
                              }}
                              title="Edit"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() => handleDeleteTask(task.task_id)}
                              title="Delete"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="task-card-description">{task.description}</p>
                        <div className="task-card-tags">
                          <span
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          >
                            {task.priority}
                          </span>
                          <span className="category-badge">{task.category}</span>
                          {tags.map(tag => (
                            <span key={tag} className="tag-badge">{tag}</span>
                          ))}
                        </div>
                        <div className="task-card-footer">
                          <span className="due-date">Due: {formatDate(task.due_date)}</span>
                          <span className="assignee-info">
                            Assigned to {assignees.length} {assignees.length === 1 ? 'person' : 'persons'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="list-view">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => {
                        setSortField('title');
                        setSortDirection(sortField === 'title' && sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => {
                        setSortField('assignee');
                        setSortDirection(sortField === 'assignee' && sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Assignee {sortField === 'assignee' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => {
                        setSortField('due_date');
                        setSortDirection(sortField === 'due_date' && sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Due Date {sortField === 'due_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => {
                        setSortField('priority');
                        setSortDirection(sortField === 'priority' && sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map(task => {
                  const assignees = getTaskAssignees(task.task_id);
                  return (
                    <tr key={task.task_id}>
                      <td>
                        <div className="table-task-title">
                          <strong>{task.title}</strong>
                          <span className="table-task-desc">{task.description}</span>
                        </div>
                      </td>
                      <td>
                        {assignees.length > 0 ? (
                          <div className="assignee-list">
                            {assignees.map(user => (
                              <span key={user.user_id} className="assignee-name">
                                {user.full_name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="no-assignee">Unassigned</span>
                        )}
                      </td>
                      <td>{formatDate(task.due_date)}</td>
                      <td>
                        <span
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge">{STATUS_MAP[task.status] || task.status}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-btn"
                            onClick={() => {
                              setSelectedTask(task);
                              setIsFormOpen(true);
                            }}
                            title="Edit"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => handleDeleteTask(task.task_id)}
                            title="Delete"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {isFormOpen && (
          <TaskFormModal
            task={selectedTask}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedTask(null);
            }}
            onSubmit={handleSubmitTask}
            users={MOCK_USERS}
            categories={categories}
            existingTags={allTags}
            taskTags={taskTags}
          />
        )}
      </main>
    </div>
  );
};

// Task Form Modal Component
interface TaskFormModalProps {
  task: ITask | null;
  onClose: () => void;
  onSubmit: (data: ITaskForm) => void;
  users: IUser[];
  categories: string[];
  existingTags: string[];
  taskTags: Record<number, string[]>;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  task,
  onClose,
  onSubmit,
  users,
  categories,
  existingTags,
  taskTags
}) => {
  const [formData, setFormData] = useState<ITaskForm>({
    title: task?.title || '',
    description: task?.description || '',
    start_date: task?.start_date || '',
    due_date: task?.due_date || '',
    completed_date: task?.completed_date || null,
    status: task?.status || 'pending',
    priority: task?.priority || 'medium',
    category: task?.category || '',
    tags: task ? (taskTags[task.task_id] || []) : [],
    attachments: [],
    assignees: task ? MOCK_ASSIGNMENTS.filter(a => a.task_id === task.task_id).map(a => a.user_id) : []
  });
  const [tagInput, setTagInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...files]
      }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || []
    }));
  };

  const handleToggleAssignee = (userId: number) => {
    setFormData(prev => {
      const assignees = prev.assignees || [];
      if (assignees.includes(userId)) {
        return { ...prev, assignees: assignees.filter(id => id !== userId) };
      } else {
        return { ...prev, assignees: [...assignees, userId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.due_date) {
      alert('Please fill in required fields (Title and Due Date)');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter task title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              {!task ? (
                // When creating new task: use input with datalist for free text input
                <>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    list="category-list"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Enter or select category"
                  />
                  <datalist id="category-list">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </>
              ) : (
                // When editing: use select dropdown
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Enter task description"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date">Start Date</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="due_date">Due Date *</label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on hold">On Hold</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Assignees</label>
            <div className="assignee-checkboxes">
              {users.map(user => (
                <label key={user.user_id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.assignees?.includes(user.user_id) || false}
                    onChange={() => handleToggleAssignee(user.user_id)}
                  />
                  <span>{user.full_name} ({user.username})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type a tag and press Enter"
              />
              <button type="button" onClick={handleAddTag} className="add-tag-btn">
                Add
              </button>
            </div>
            <div className="tags-list">
              {formData.tags?.map(tag => (
                <span key={tag} className="tag-item">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {existingTags.length > 0 && (
              <div className="existing-tags">
                <span className="existing-tags-label">Existing tags:</span>
                {existingTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className="existing-tag-btn"
                    onClick={() => {
                      if (!formData.tags?.includes(tag)) {
                        setFormData(prev => ({
                          ...prev,
                          tags: [...(prev.tags || []), tag]
                        }));
                      }
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="attachments">Attachments (Images & Files)</label>
            <input
              type="file"
              id="attachments"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
            />
            {selectedFiles.length > 0 && (
              <div className="files-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="file-remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tasks;

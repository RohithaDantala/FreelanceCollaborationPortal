import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, reset } from '../redux/slices/projectSlice';

const CreateProject = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web_development',
    skillsRequired: '',
    budgetMin: '',
    budgetMax: '',
    estimatedDuration: '',
    maxMembers: 5,
    isPublic: true,
    tags: '',
  });

  const [milestones, setMilestones] = useState([
    { title: '', description: '', dueDate: '' },
  ]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.projects
  );

  useEffect(() => {
    if (isSuccess) {
      navigate('/my-projects');
    }

    return () => {
      dispatch(reset());
    };
  }, [isSuccess, navigate, dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleMilestoneChange = (index, field, value) => {
    const newMilestones = [...milestones];
    newMilestones[index][field] = value;
    setMilestones(newMilestones);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', dueDate: '' }]);
  };

  const removeMilestone = (index) => {
    const newMilestones = milestones.filter((_, i) => i !== index);
    setMilestones(newMilestones);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const projectData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      skillsRequired: formData.skillsRequired
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s),
      budget: {
        min: parseFloat(formData.budgetMin) || 0,
        max: parseFloat(formData.budgetMax) || 0,
        currency: 'USD',
      },
      timeline: {
        estimatedDuration: formData.estimatedDuration,
      },
      milestones: milestones.filter((m) => m.title),
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t),
      isPublic: formData.isPublic,
      maxMembers: parseInt(formData.maxMembers),
    };

    dispatch(createProject(projectData));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Create New Project
            </h1>
            <p className="text-gray-600">
              Fill in the details to start your project and find collaborators
            </p>
          </div>

          {/* Error Message */}
          {isError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., E-commerce Website Development"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe your project in detail..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="web_development">Web Development</option>
                      <option value="mobile_app">Mobile App</option>
                      <option value="design">Design</option>
                      <option value="writing">Writing</option>
                      <option value="marketing">Marketing</option>
                      <option value="data_science">Data Science</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Team Members
                    </label>
                    <input
                      type="number"
                      name="maxMembers"
                      value={formData.maxMembers}
                      onChange={handleChange}
                      min="1"
                      max="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills Required (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="skillsRequired"
                    value={formData.skillsRequired}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., React, Node.js, MongoDB"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., urgent, remote, fullstack"
                  />
                </div>
              </div>
            </div>

            {/* Budget & Timeline */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Budget & Timeline
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Budget ($)
                  </label>
                  <input
                    type="number"
                    name="budgetMin"
                    value={formData.budgetMin}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Budget ($)
                  </label>
                  <input
                    type="number"
                    name="budgetMax"
                    value={formData.budgetMax}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    name="estimatedDuration"
                    value={formData.estimatedDuration}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., 2 months"
                  />
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Milestones (Optional)
                </h2>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  + Add Milestone
                </button>
              </div>

              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Milestone {index + 1}
                      </span>
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) =>
                          handleMilestoneChange(index, 'title', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Milestone title"
                      />
                      <textarea
                        value={milestone.description}
                        onChange={(e) =>
                          handleMilestoneChange(index, 'description', e.target.value)
                        }
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Description"
                      />
                      <input
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) =>
                          handleMilestoneChange(index, 'dueDate', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div className="border-t pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Make this project public (visible to all freelancers)
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
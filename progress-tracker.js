/**
 * SQLGram Progress Tracker
 * Tracks user progress through tutorials and stores in localStorage
 */

class ProgressTracker {
  constructor() {
    this.storageKey = 'sqlgram_progress';
    this.progress = this.loadProgress();
    this.tutorialsList = [
      'select', 'where', 'join', 'group-by', 
      'order-by', 'insert', 'update', 'delete'
    ];
  }

  /**
   * Load progress from localStorage
   * @returns {Object} - User progress data
   */
  loadProgress() {
    const storedProgress = localStorage.getItem(this.storageKey);
    if (storedProgress) {
      try {
        return JSON.parse(storedProgress);
      } catch (e) {
        console.error('Error parsing progress data:', e);
        return this._getDefaultProgress();
      }
    }
    return this._getDefaultProgress();
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (e) {
      console.error('Error saving progress data:', e);
    }
  }

  /**
   * Get default progress structure
   * @private
   * @returns {Object} - Default progress object
   */
  _getDefaultProgress() {
    // Create a default progress object with all tutorials initialized
    const tutorials = {};
    
    this.tutorialsList.forEach(id => {
      tutorials[id] = {
        started: false,
        completed: false,
        exercises: {},
        percentComplete: 0,
        lastVisited: null
      };
    });
    
    return {
      tutorials,
      overallPercentage: 0,
      lastActive: new Date().toISOString()
    };
  }

  /**
   * Get progress for a specific tutorial
   * @param {string} tutorialId - ID of the tutorial
   * @returns {Object} - Tutorial progress data
   */
  getTutorialProgress(tutorialId) {
    if (!this.progress.tutorials[tutorialId]) {
      this.progress.tutorials[tutorialId] = {
        started: false,
        completed: false,
        exercises: {},
        percentComplete: 0,
        lastVisited: null
      };
      this.saveProgress();
    }
    return this.progress.tutorials[tutorialId];
  }

  /**
   * Mark a tutorial as started
   * @param {string} tutorialId - ID of the tutorial
   */
  startTutorial(tutorialId) {
    const tutorial = this.getTutorialProgress(tutorialId);
    tutorial.started = true;
    tutorial.lastVisited = new Date().toISOString();
    this.progress.lastActive = new Date().toISOString();
    this._updateOverallProgress();
    this.saveProgress();
  }

  /**
   * Mark a tutorial as completed
   * @param {string} tutorialId - ID of the tutorial
   */
  completeTutorial(tutorialId) {
    const tutorial = this.getTutorialProgress(tutorialId);
    tutorial.completed = true;
    tutorial.percentComplete = 100;
    tutorial.lastVisited = new Date().toISOString();
    this.progress.lastActive = new Date().toISOString();
    this._updateOverallProgress();
    this.saveProgress();
  }

  /**
   * Update exercise progress within a tutorial
   * @param {string} tutorialId - ID of the tutorial
   * @param {string} exerciseId - ID of the exercise
   * @param {boolean} completed - Whether the exercise is completed
   */
  updateExerciseProgress(tutorialId, exerciseId, completed) {
    const tutorial = this.getTutorialProgress(tutorialId);
    
    // If exercise not in progress yet, initialize it
    if (!tutorial.exercises[exerciseId]) {
      tutorial.exercises[exerciseId] = {
        attempts: 0,
        completed: false,
        lastAttempt: null
      };
    }
    
    // Update exercise data
    tutorial.exercises[exerciseId].attempts++;
    tutorial.exercises[exerciseId].completed = completed;
    tutorial.exercises[exerciseId].lastAttempt = new Date().toISOString();
    
    // Update last active timestamp
    this.progress.lastActive = new Date().toISOString();
    
    // Update overall tutorial progress percentage
    this._updateTutorialPercentage(tutorialId);
    this._updateOverallProgress();
    this.saveProgress();
    
    // Update UI
    this._updateProgressUI(tutorialId);
  }

  /**
   * Update the percentage complete for a tutorial based on exercise completion
   * @private
   * @param {string} tutorialId - ID of the tutorial
   */
  _updateTutorialPercentage(tutorialId) {
    const tutorial = this.getTutorialProgress(tutorialId);
    const exercises = Object.values(tutorial.exercises);
    
    if (exercises.length === 0) {
      tutorial.percentComplete = tutorial.started ? 10 : 0;
    } else {
      const completedExercises = exercises.filter(ex => ex.completed).length;
      const totalExercises = exercises.length;
      
      // Calculate percentage - minimum 10% if started
      const basePercent = tutorial.started ? 10 : 0;
      const exercisePercent = totalExercises > 0 
        ? (completedExercises / totalExercises) * 90 
        : 0;
      
      tutorial.percentComplete = Math.round(basePercent + exercisePercent);
      
      // If all exercises are complete, mark tutorial as completed
      if (completedExercises === totalExercises && totalExercises >= 5) {
        tutorial.completed = true;
        tutorial.percentComplete = 100;
      }
    }
  }

  /**
   * Update overall progress percentage across all tutorials
   * @private
   */
  _updateOverallProgress() {
    const tutorials = Object.values(this.progress.tutorials);
    const totalTutorials = tutorials.length;
    
    if (totalTutorials === 0) {
      this.progress.overallPercentage = 0;
    } else {
      const totalPercentage = tutorials.reduce(
        (sum, tutorial) => sum + tutorial.percentComplete, 0
      );
      this.progress.overallPercentage = Math.round(totalPercentage / totalTutorials);
    }
  }

  /**
   * Update progress UI elements on the page
   * @private
   * @param {string} tutorialId - ID of the tutorial (optional)
   */
  _updateProgressUI(tutorialId = null) {
    // Update overall progress if on homepage
    const overallProgressEls = document.querySelectorAll('.overall-progress .progress-bar');
    overallProgressEls.forEach(el => {
      el.style.width = `${this.progress.overallPercentage}%`;
      el.setAttribute('aria-valuenow', this.progress.overallPercentage);
    });
    
    // Update progress text
    const progressTextEls = document.querySelectorAll('.overall-progress .progress-text');
    progressTextEls.forEach(el => {
      el.textContent = `${this.progress.overallPercentage}% Complete`;
    });
    
    // If on a tutorial page, update that tutorial's progress
    if (tutorialId) {
      const tutorial = this.getTutorialProgress(tutorialId);
      
      // Update tutorial header progress bar
      const tutorialProgressEl = document.querySelector('.tutorial-progress .progress-bar');
      if (tutorialProgressEl) {
        tutorialProgressEl.style.width = `${tutorial.percentComplete}%`;
        tutorialProgressEl.setAttribute('aria-valuenow', tutorial.percentComplete);
      }
      
      // Update tutorial progress text
      const tutorialProgressTextEl = document.querySelector('.tutorial-progress .progress-text');
      if (tutorialProgressTextEl) {
        tutorialProgressTextEl.textContent = `${tutorial.percentComplete}% Complete`;
      }
    }
    
    // Update all tutorial cards on homepage
    this.tutorialsList.forEach(id => {
      const tutorialCard = document.querySelector(`[data-tutorial-id="${id}"] .progress-bar`);
      if (tutorialCard) {
        const percent = this.getTutorialProgress(id).percentComplete;
        tutorialCard.style.width = `${percent}%`;
        tutorialCard.setAttribute('aria-valuenow', percent);
      }
    });
  }

  /**
   * Get total progress percentage across all tutorials
   * @returns {number} - Percentage complete (0-100)
   */
  getOverallProgress() {
    return this.progress.overallPercentage;
  }

  /**
   * Get all tutorial progress data for the dashboard
   * @returns {Object} - Tutorial progress data
   */
  getAllTutorialProgress() {
    return this.progress.tutorials;
  }

  /**
   * Reset all progress data
   */
  resetProgress() {
    this.progress = this._getDefaultProgress();
    this.saveProgress();
    this._updateProgressUI();
  }
  
  /**
   * Initialize progress tracking and UI updates
   */
  initTracking() {
    // Update UI with current progress
    this._updateProgressUI();
    
    // Detect current tutorial page if any
    const tutorialMatch = location.pathname.match(/tutorials\/([a-z-]+)\.html/);
    if (tutorialMatch && tutorialMatch[1]) {
      const tutorialId = tutorialMatch[1];
      this.startTutorial(tutorialId);
    }
    
    // Add data attributes to tutorial cards for easier selection
    document.querySelectorAll('.topic-card').forEach(card => {
      const href = card.getAttribute('href');
      if (href) {
        const tutorialMatch = href.match(/tutorials\/([a-z-]+)\.html/);
        if (tutorialMatch && tutorialMatch[1]) {
          card.setAttribute('data-tutorial-id', tutorialMatch[1]);
        }
      }
    });
  }
}

// Create global instance
const progressTracker = new ProgressTracker();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  progressTracker.initTracking();
});


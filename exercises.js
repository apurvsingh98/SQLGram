/**
 * SQLGram Exercises
 * Handles the interactive tutorial exercises functionality
 */

class SQLExercises {
  constructor() {
    // Store editor instances by exercise ID
    this.editors = {};
    
    // Store exercise configurations
    this.exerciseConfigs = {
      // SELECT tutorial exercises
      'select-1': {
        requiredKeywords: ['SELECT', 'FROM', 'products'],
        requiredPatterns: ['SELECT\\s+product_name,\\s*price\\s+FROM\\s+products'],
        solution: 'SELECT product_name, price FROM products;'
      },
      'select-2': {
        requiredKeywords: ['SELECT', 'FROM', 'users'],
        requiredPatterns: ['SELECT\\s+\\*\\s+FROM\\s+users'],
        solution: 'SELECT * FROM users;'
      },
      'select-3': {
        requiredKeywords: ['SELECT', 'FROM', 'orders'],
        requiredPatterns: ['SELECT\\s+id,\\s*user_id,\\s*total_amount\\s+FROM\\s+orders'],
        solution: 'SELECT id, user_id, total_amount FROM orders;'
      },
      'select-4': {
        requiredKeywords: ['SELECT', 'FROM', 'products', 'LIMIT'],
        requiredPatterns: ['SELECT\\s+\\*\\s+FROM\\s+products\\s+LIMIT\\s+3'],
        solution: 'SELECT * FROM products LIMIT 3;'
      },
      'select-5': {
        requiredKeywords: ['SELECT', 'FROM', 'users', 'username', 'email'],
        requiredPatterns: ['SELECT\\s+username,\\s*email\\s+FROM\\s+users'],
        solution: 'SELECT username, email FROM users;'
      },
      
      // WHERE tutorial exercises
      'where-1': {
        requiredKeywords: ['SELECT', 'FROM', 'users', 'WHERE'],
        requiredPatterns: ['SELECT\\s+\\*\\s+FROM\\s+users\\s+WHERE\\s+age\\s*>\\s*30'],
        solution: 'SELECT * FROM users WHERE age > 30;'
      },
      'where-2': {
        requiredKeywords: ['SELECT', 'FROM', 'products', 'WHERE'],
        requiredPatterns: ['SELECT\\s+product_name,\\s*price\\s+FROM\\s+products\\s+WHERE\\s+category\\s*=\\s*[\'"]Electronics[\'"]'],
        solution: 'SELECT product_name, price FROM products WHERE category = "Electronics";'
      },
      
      // Additional exercises would be defined here for other tutorials
    };
    
    // Track active tutorial
    this.activeTutorial = this.detectTutorial();
  }
  
  /**
   * Detect which tutorial page we're on from the URL
   * @returns {string|null} - Tutorial ID or null
   */
  detectTutorial() {
    const path = window.location.pathname;
    const match = path.match(/tutorials\/([a-z-]+)\.html/);
    return match ? match[1] : null;
  }
  
  /**
   * Initialize exercise editors and functionality
   */
  init() {
    // Find all exercise editors on the page
    const exerciseEditors = document.querySelectorAll('.sql-editor');
    
    // Initialize each editor
    exerciseEditors.forEach(editorEl => {
      const exerciseId = editorEl.id.replace('editor-', '');
      const fullExerciseId = `${this.activeTutorial}-${exerciseId}`;
      
      // Create CodeMirror editor
      const editor = CodeMirror.fromTextArea(editorEl, {
        mode: 'text/x-sql',
        theme: 'dracula',
        lineNumbers: true,
        indentWithTabs: true,
        smartIndent: true,
        lineWrapping: true,
        matchBrackets: true,
        extraKeys: {
          'Ctrl-Enter': () => this.runExercise(exerciseId),
          'Cmd-Enter': () => this.runExercise(exerciseId)
        }
      });
      
      // Set editor height
      editor.setSize(null, 100);
      
      // Store editor reference
      this.editors[exerciseId] = editor;
      
      // Set up run button
      const runBtn = document.querySelector(`.run-btn[data-exercise="${exerciseId}"]`);
      if (runBtn) {
        runBtn.addEventListener('click', () => this.runExercise(


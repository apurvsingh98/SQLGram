/**
 * SQLGram Playground
 * Handles the interactive SQL playground functionality
 */

class SQLPlayground {
  constructor() {
    // Editor instance
    this.editor = null;
    
    // DOM elements
    this.editorContainer = document.getElementById('playground-editor');
    this.runButton = document.getElementById('run-query-btn');
    this.resetButton = document.getElementById('reset-db-btn');
    this.clearButton = document.getElementById('clear-editor-btn');
    this.resultsContainer = document.getElementById('query-results');
    this.resultsTable = document.getElementById('results-table');
    this.resultsMessage = document.getElementById('results-message');
    this.executionTime = document.getElementById('execution-time');
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.sampleQueries = document.querySelectorAll('.sample-query');
    this.historyList = document.getElementById('query-history-list');
    
    // Query history
    this.queryHistory = this.loadQueryHistory();
    
    // Sample database schema
    this.sampleSchema = `
/* Database Schema */

-- Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  age INTEGER,
  created_at TEXT
);

-- Products Table
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  product_name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT,
  stock INTEGER
);

-- Orders Table
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  total_amount REAL NOT NULL,
  order_date TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Order Items Table
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders (id),
  FOREIGN KEY (product_id) REFERENCES products (id)
);
`;
  }

  /**
   * Initialize the playground
   */
  init() {
    // Initialize CodeMirror editor if container exists
    if (this.editorContainer) {
      this.editor = CodeMirror.fromTextArea(this.editorContainer, {
        mode: 'text/x-sql',
        theme: 'dracula',
        lineNumbers: true,
        indentWithTabs: true,
        smartIndent: true,
        lineWrapping: true,
        matchBrackets: true,
        autofocus: true,
        extraKeys: {
          'Ctrl-Enter': () => this.executeQuery(),
          'Cmd-Enter': () => this.executeQuery()
        }
      });
      
      // Set editor height
      this.editor.setSize(null, 200);
      
      // Set default query
      this.editor.setValue("-- Write your SQL query here\nSELECT * FROM users LIMIT 5;");
    }
    
    // Initialize SQL engine
    this.initializeSQLEngine();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Display query history
    this.displayQueryHistory();
    
    // Show schema in sidebar if it exists
    const schemaDisplay = document.getElementById('schema-display');
    if (schemaDisplay) {
      schemaDisplay.textContent = this.sampleSchema;
    }
  }
  
  /**
   * Initialize SQL.js engine
   */
  initializeSQLEngine() {
    // Show loading indicator
    if (this.loadingIndicator) {
      this.loadingIndicator.classList.remove('d-none');
    }
    
    // Initialize the SQL engine
    sqlEngine.init().then(() => {
      // Hide loading indicator
      if (this.loadingIndicator) {
        this.loadingIndicator.classList.add('d-none');
      }
      
      // Enable run button
      if (this.runButton) {
        this.runButton.disabled = false;
      }
    }).catch(err => {
      console.error('Failed to initialize SQL engine:', err);
      this.showError('Failed to initialize SQL database. Please refresh the page and try again.');
    });
  }
  
  /**
   * Set up event listeners for buttons
   */
  setupEventListeners() {
    // Run query button
    if (this.runButton) {
      this.runButton.addEventListener('click', () => this.executeQuery());
    }
    
    // Reset database button
    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => this.resetDatabase());
    }
    
    // Clear editor button
    if (this.clearButton) {
      this.clearButton.addEventListener('click', () => this.clearEditor());
    }
    
    // Sample query buttons
    if (this.sampleQueries) {
      this.sampleQueries.forEach(btn => {
        btn.addEventListener('click', () => {
          const query = btn.getAttribute('data-query');
          if (query && this.editor) {
            this.editor.setValue(query);
            this.editor.focus();
          }
        });
      });
    }
    
    // Tabs for schema/history
    const schemaTabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    if (schemaTabs) {
      schemaTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', (e) => {
          if (e.target.id === 'history-tab') {
            this.displayQueryHistory();
          }
        });
      });
    }
  }
  
  /**
   * Execute the current SQL query
   */
  executeQuery() {
    if (!this.editor) return;
    
    const query = this.editor.getValue().trim();
    if (!query) {
      this.showError('Please enter an SQL query.');
      return;
    }
    
    // Show loading indicator
    if (this.loadingIndicator) {
      this.loadingIndicator.classList.remove('d-none');
    }
    
    // Disable run button
    if (this.runButton) {
      this.runButton.disabled = true;
    }
    
    // Execute query
    sqlEngine.executeQuery(query).then(result => {
      // Hide loading indicator
      if (this.loadingIndicator) {
        this.loadingIndicator.classList.add('d-none');
      }
      
      // Enable run button
      if (this.runButton) {
        this.runButton.disabled = false;
      }
      
      // Display results
      this.displayResults(result);
      
      // Add to query history
      this.addToQueryHistory(query, result.success);
    }).catch(err => {
      console.error('Error executing query:', err);
      this.showError('An unexpected error occurred while executing your query.');
      
      // Hide loading indicator
      if (this.loadingIndicator) {
        this.loadingIndicator.classList.add('d-none');
      }
      
      // Enable run button
      if (this.runButton) {
        this.runButton.disabled = false;
      }
    });
  }
  
  /**
   * Reset the database to its initial state
   */
  resetDatabase() {
    // Show loading indicator
    if (this.loadingIndicator) {
      this.loadingIndicator.classList.remove('d-none');
    }
    
    // Reset database
    sqlEngine.resetDatabase().then(() => {
      // Hide loading indicator
      if (this.loadingIndicator) {
        this.loadingIndicator.classList.add('d-none');
      }
      
      // Show success message
      this.showSuccess('Database has been reset to its initial state.');
    }).catch(err => {
      console.error('Error resetting database:', err);
      this.showError('Failed to reset database.');
      
      // Hide loading indicator
      if (this.loadingIndicator) {
        this.loadingIndicator.classList.add('d-none');
      }
    });
  }
  
  /**
   * Clear the editor
   */
  clearEditor() {
    if (this.editor) {
      this.editor.setValue('');
      this.editor.focus();
    }
  }
  
  /**
   * Display query results
   * @param {Object} result - Query execution result
   */
  displayResults(result) {
    if (!this.resultsContainer || !this.resultsTable || !this.resultsMessage) {
      return;
    }
    
    // Show the results container
    this.resultsContainer.classList.remove('d-none');
    
    // Update execution time if element exists
    if (this.executionTime) {
      this.executionTime.textContent = `${result.executionTime} ms`;
    }
    
    // Display message based on success/failure
    if (result.success) {
      this.resultsMessage.classList.remove('text-danger');
      this.resultsMessage.classList.add('text-success');
    } else {
      this.resultsMessage.classList.remove('text-success');
      this.resultsMessage.classList.add('text-danger');
    }
    this.resultsMessage.textContent = result.message;
    
    // Clear the table
    this.resultsTable.innerHTML = '';
    
    // If no results or failed query, return
    if (!result.success || result.results.length === 0) {
      return;
    }
    
    // Build table from results
    const headers = Object.keys(result.results[0]);
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    this.resultsTable.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    result.results.forEach(row => {
      const tr = document.createElement('tr');
      headers.forEach(header => {
        const td = document.createElement('td');
        td.textContent = row[header] !== null ? row[header] : 'NULL';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    this.resultsTable.appendChild(tbody);
  }
  
  /**
   * Show an error message
   * @param {string} message - Error message
   */
  showError(message) {
    if (this.resultsMessage) {
      this.resultsMessage.classList.remove('text-success');
      this.resultsMessage.classList.add('text-danger');
      this.resultsMessage.textContent = message;
      this.resultsContainer.classList.remove('d-none');
    }
  }
  
  /**
   * Show a success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    if (this.resultsMessage) {
      this.resultsMessage.classList.remove('text-danger');
      this.resultsMessage.classList.add('text-success');
      this.resultsMessage.textContent = message;
      this.resultsContainer.classList.remove('d-none');
    }
  }
  
  /**
   * Add query to history
   * @param {string} query - SQL query
   * @param {boolean} success - Whether the query was successful
   */
  addToQueryHistory(query, success) {
    const timestamp = new Date().toISOString();
    this.queryHistory.unshift({
      query,
      success,
      timestamp
    });
    
    // Limit history to 20 items
    if (this.queryHistory.length > 20) {
      this.queryHistory.pop();
    }
    
    // Save to localStorage
    this.saveQueryHistory();
    
    // Update display if history tab is active
    const historyTab = document.getElementById('history-tab');
    if (historyTab && historyTab.classList.contains('active')) {
      this.displayQueryHistory();
    }
  }
  
  /**
   * Load query history from localStorage
   * @returns {Array} - Query history
   */
  loadQueryHistory() {
    try {
      const history = localStorage.getItem('sqlgram_query_history');
      return history ? JSON.parse(history) : [];
    } catch (e) {
      console.error('Error loading query history:', e);
      return [];
    }
  }
  
  /**
   * Save query history to localStorage
   */
  saveQueryHistory() {
    try {
      localStorage.setItem('sqlgram_query_history', JSON.stringify(this.queryHistory));
    } catch (e) {
      console.error('Error saving query history:', e);
    }
  }
  
  /**
   * Display query history in the UI
   */
  displayQueryHistory() {
    if (!this.historyList) return;
    
    // Clear current history list
    this.historyList.innerHTML = '';
    
    if (this.queryHistory.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'list-group-item text-center text-muted';
      emptyItem.textContent = 'No query history yet';
      this.historyList.appendChild(emptyItem);
      return;
    }
    
    // Add each query to the list
    this.queryHistory.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'list-group-item history-item';
      
      // Format date
      const date = new Date(item.timestamp);
      const dateStr = date.toLocaleString();
      
      // Create status badge
      const badge = document.createElement('span');
      badge.className = `badge ${item.success ? 'bg-success' : 'bg-danger'} me-2`;
      badge.textContent = item.success ? 'Success' : 'Error';
      
      // Create query text
      const queryText = document.createElement('code');
      queryText.className = 'query-text';
      queryText.textContent = item.query.length > 50 
        ? item.query.substring(0, 50) + '...' 
        : item.query;
      
      // Create click event to load this query
      li.addEventListener('click', () => {
        if (this.editor) {
          this.editor.setValue(item.query);
          this.editor.focus();
        }
      });
      
      // Create time display
      const timeText = document.createElement('small');
      timeText.className = 'text-muted d-block mt-1';
      timeText.textContent = dateStr;
      
      // Assemble the list item
      li.appendChild(badge);
      li.appendChild(queryText);
      li.appendChild(timeText);
      this.historyList.appendChild(li);
    });
  }
}

// Initialize playground when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const playground = new SQLPlayground();
  playground.init();
});


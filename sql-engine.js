/**
 * SQLGram SQL Engine
 * Handles SQL query validation and execution using SQL.js
 */

class SQLEngine {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.initPromise = null;
    this.defaultTables = {
      users: [
        { id: 1, username: 'john', email: 'john@example.com', age: 25, created_at: '2023-01-15' },
        { id: 2, username: 'alice', email: 'alice@example.com', age: 28, created_at: '2023-02-20' },
        { id: 3, username: 'carol', email: 'carol@example.com', age: 42, created_at: '2023-03-10' },
        { id: 4, username: 'david', email: 'david@example.com', age: 19, created_at: '2023-04-05' },
        { id: 5, username: 'bob', email: 'bob@example.com', age: 35, created_at: '2023-05-22' }
      ],
      products: [
        { id: 1, product_name: 'Laptop', price: 999.99, category: 'Electronics', stock: 25 },
        { id: 2, product_name: 'Smartphone', price: 699.99, category: 'Electronics', stock: 50 },
        { id: 3, product_name: 'Headphones', price: 149.99, category: 'Electronics', stock: 100 },
        { id: 4, product_name: 'Coffee Maker', price: 89.99, category: 'Kitchen', stock: 30 },
        { id: 5, product_name: 'Desk Chair', price: 199.99, category: 'Furniture', stock: 15 }
      ],
      orders: [
        { id: 1, user_id: 1, total_amount: 1149.98, order_date: '2023-06-10' },
        { id: 2, user_id: 2, total_amount: 699.99, order_date: '2023-06-12' },
        { id: 3, user_id: 3, total_amount: 239.98, order_date: '2023-06-15' },
        { id: 4, user_id: 5, total_amount: 1199.98, order_date: '2023-06-20' },
        { id: 5, user_id: 1, total_amount: 89.99, order_date: '2023-06-25' }
      ],
      order_items: [
        { id: 1, order_id: 1, product_id: 1, quantity: 1, price: 999.99 },
        { id: 2, order_id: 1, product_id: 3, quantity: 1, price: 149.99 },
        { id: 3, order_id: 2, product_id: 2, quantity: 1, price: 699.99 },
        { id: 4, order_id: 3, product_id: 3, quantity: 1, price: 149.99 },
        { id: 5, order_id: 3, product_id: 4, quantity: 1, price: 89.99 },
        { id: 6, order_id: 4, product_id: 1, quantity: 1, price: 999.99 },
        { id: 7, order_id: 4, product_id: 5, quantity: 1, price: 199.99 },
        { id: 8, order_id: 5, product_id: 4, quantity: 1, price: 89.99 }
      ]
    };
  }

  /**
   * Initialize the SQL.js database
   * @returns {Promise} - Resolves when DB is initialized
   */
  init() {
    if (this.initialized) {
      return Promise.resolve(this.db);
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Initialize SQL.js
      initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
      }).then(SQL => {
        try {
          // Create a new database
          this.db = new SQL.Database();
          
          // Create tables and insert default data
          this._createDefaultTables();
          
          this.initialized = true;
          resolve(this.db);
        } catch (err) {
          console.error('Error initializing SQL database:', err);
          reject(err);
        }
      }).catch(err => {
        console.error('Failed to load SQL.js:', err);
        reject(err);
      });
    });

    return this.initPromise;
  }

  /**
   * Reset the database to its default state
   */
  resetDatabase() {
    if (!this.initialized) {
      return this.init();
    }

    // Drop all existing tables
    this._dropAllTables();
    
    // Create default tables
    this._createDefaultTables();
    
    return Promise.resolve(this.db);
  }

  /**
   * Execute an SQL query
   * @param {string} sqlQuery - The SQL query to execute
   * @returns {Promise<Object>} - Query results and metadata
   */
  executeQuery(sqlQuery) {
    return this.init().then(() => {
      try {
        // Execute the query
        const startTime = performance.now();
        const results = this.db.exec(sqlQuery);
        const endTime = performance.now();
        
        // Format the results
        const formattedResults = this._formatResults(results);
        
        return {
          success: true,
          results: formattedResults,
          executionTime: (endTime - startTime).toFixed(2),
          message: formattedResults.length > 0 ? 
            `Query executed successfully. Returned ${formattedResults.length} row(s).` : 
            'Query executed successfully. No results returned.'
        };
      } catch (err) {
        return {
          success: false,
          results: [],
          executionTime: 0,
          message: `Error: ${err.message}`
        };
      }
    });
  }

  /**
   * Validate an SQL query against an expected result pattern
   * @param {string} sqlQuery - The SQL query to validate
   * @param {Object} exerciseConfig - Configuration for validation
   * @returns {Promise<Object>} - Validation results
   */
  validateQuery(sqlQuery, exerciseConfig) {
    return this.executeQuery(sqlQuery).then(result => {
      if (!result.success) {
        return {
          valid: false,
          message: result.message,
          results: []
        };
      }

      // If we have a validation query, use that to compare results
      if (exerciseConfig.validationQuery) {
        return this.executeQuery(exerciseConfig.validationQuery).then(validationResult => {
          if (!validationResult.success) {
            return {
              valid: false,
              message: 'Internal validation error',
              results: result.results
            };
          }

          // Compare the results
          const isValid = this._compareResults(result.results, validationResult.results, exerciseConfig);
          
          return {
            valid: isValid,
            message: isValid ? 
              'Correct! Your query produces the expected results.' : 
              'Your query doesn\'t match the expected output.',
            results: result.results
          };
        });
      }

      // Otherwise, just check if the query matches required patterns
      const patternMatch = this._matchQueryPatterns(sqlQuery, exerciseConfig);
      
      return {
        valid: patternMatch.valid,
        message: patternMatch.valid ? 
          'Correct! Your query matches the expected pattern.' : 
          patternMatch.message,
        results: result.results
      };
    });
  }

  /**
   * Format SQL.js results into a more usable structure
   * @private
   * @param {Array} results - SQL.js result array
   * @returns {Array} - Formatted results
   */
  _formatResults(results) {
    if (!results || results.length === 0) {
      return [];
    }

    const result = results[0];
    const columns = result.columns;
    const values = result.values;

    return values.map(row => {
      const rowObj = {};
      columns.forEach((col, i) => {
        rowObj[col] = row[i];
      });
      return rowObj;
    });
  }

  /**
   * Create default tables and insert data
   * @private
   */
  _createDefaultTables() {
    // Create users table
    this.db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        age INTEGER,
        created_at TEXT
      )
    `);

    // Create products table
    this.db.run(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        product_name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT,
        stock INTEGER
      )
    `);

    // Create orders table
    this.db.run(`
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        total_amount REAL NOT NULL,
        order_date TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create order_items table
    this.db.run(`
      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // Insert data
    this._insertDefaultData('users', this.defaultTables.users);
    this._insertDefaultData('products', this.defaultTables.products);
    this._insertDefaultData('orders', this.defaultTables.orders);
    this._insertDefaultData('order_items', this.defaultTables.order_items);
  }

  /**
   * Insert default data into a table
   * @private
   * @param {string} tableName - Table to insert into
   * @param {Array} data - Data array
   */
  _insertDefaultData(tableName, data) {
    if (!data || data.length === 0) return;

    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(',');
    
    const stmt = this.db.prepare(`INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`);
    
    data.forEach(row => {
      const values = columns.map(col => row[col]);
      stmt.run(values);
    });
    
    stmt.free();
  }

  /**
   * Drop all tables from the database
   * @private
   */
  _dropAllTables() {
    // Get all table names
    const tables = this.db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    
    // Format results to get table names
    const tableNames = this._formatResults(tables).map(row => row.name);
    
    // Drop each table, except for sqlite_sequence (used for autoincrement)
    tableNames.forEach(tableName => {
      if (tableName !== 'sqlite_sequence') {
        this.db.run(`DROP TABLE IF EXISTS ${tableName}`);
      }
    });
  }

  /**
   * Compare two result sets for equality
   * @private
   * @param {Array} results1 - First result set
   * @param {Array} results2 - Second result set (expected results)
   * @param {Object} config - Comparison configuration
   * @returns {boolean} - True if results match
   */
  _compareResults(results1, results2, config) {
    // If the row counts don't match and we care about count, it's not valid
    if (config.checkRowCount && results1.length !== results2.length) {
      return false;
    }

    // If we only care about structure, check if columns match
    if (config.checkStructureOnly && results1.length > 0 && results2.length > 0) {
      const columns1 = Object.keys(results1[0]).sort();
      const columns2 = Object.keys(results2[0]).sort();
      
      return JSON.stringify(columns1) === JSON.stringify(columns2);
    }

    // If we're checking specific columns only
    if (config.checkColumns && config.checkColumns.length > 0) {
      // For each row in results1, there should be a matching row in results2
      const columnsToCheck = config.checkColumns;
      
      for (const row1 of results1) {
        let found = false;
        for (const row2 of results2) {
          let match = true;
          for (const col of columnsToCheck) {
            if (row1[col] !== row2[col]) {
              match = false;
              break;
            }
          }
          if (match) {
            found = true;
            break;
          }
        }
        if (!found) {
          return false;
        }
      }
      return true;
    }

    // Default: strict equality of the entire result sets
    return JSON.stringify(results1) === JSON.stringify(results2);
  }

  /**
   * Match SQL query against required patterns
   * @private
   * @param {string} sqlQuery - SQL query to check
   * @param {Object} config - Pattern configuration
   * @returns {Object} - Validation results
   */
  _matchQueryPatterns(sqlQuery, exerciseConfig) {
    const query = sqlQuery.toLowerCase();
    
    // Check for required keywords
    if (exerciseConfig.requiredKeywords) {
      for (const keyword of exerciseConfig.requiredKeywords) {
        if (!query.includes(keyword.toLowerCase())) {
          return {
            valid: false,
            message: `Your query should include the '${keyword}' keyword.`
          };
        }
      }
    }
    
    // Check for required patterns
    if (exerciseConfig.requiredPatterns) {
      for (const pattern of exerciseConfig.requiredPatterns) {
        const regex = new RegExp(pattern, 'i');
        if (!regex.test(query)) {
          return {
            valid: false,
            message: `Your query doesn't match the expected pattern.`
          };
        }
      }
    }
    
    // Check for forbidden keywords
    if (exerciseConfig.forbiddenKeywords) {
      for (const keyword of exerciseConfig.forbiddenKeywords) {
        if (query.includes(keyword.toLowerCase())) {
          return {
            valid: false,
            message: `Your query should not include the '${keyword}' keyword.`
          };
        }
      }
    }
    
    return { valid: true };
  }
}

// Create a global instance for use throughout the application
const sqlEngine = new SQLEngine();


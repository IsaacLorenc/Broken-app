const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
// Helper function that facilitates the construction of SQL update statements 
// (SET clause) based on JavaScript objects. 
// It ensures proper formatting of column names and values, 
// leveraging parameterized queries for security and efficiency 
// when updating database records.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {

// Checks for empty data and throws error if no data was provided in the update
  
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  // Iterates over each key in dataToUpdate

  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

// Returns results

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

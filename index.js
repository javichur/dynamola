/**
 * @name Dynamola
 * @file Dynamola, the DynamoDB easy library for Lambda functions.
 * (https://github.com/javichur/dynamola)
 * @author Javier Campos (https://javiercampos.es).
 * @version 1.0.1
 * @license MIT
 * @param {string} tableName nombre de la tabla en DynamoDB.
 * @param {string} primaryKeyName nombre de la clave principal de la tabla.
 * @param {string} primarySortKeyName nombre de la clave de ordenación de la tabla (opcional).
 */
const AWS = require('aws-sdk');

class Dynamola {
  /**
   * @example
   * // constructor, para una tabla con clave principal y clave de ordenación:
   * let myDb = new Dynamola("nombreMiTablaMensajes", "userId", "fechaHora");
   * @example
   * // constructor, para una tabla con solo clave principal:
   * let myDb = new Dynamola("nombreMiTablaUsuarios", "userId", null);
   */
  constructor(tableName, primaryKeyName, primarySortKeyName) {
    this.tableName = tableName;
    this.primaryKeyName = primaryKeyName;
    this.primarySortKeyName = primarySortKeyName;

    this.docClient = new AWS.DynamoDB.DocumentClient();
    // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.03.htmlclear
  }


  /**
   * Obtiene un elemento en una tabla con clave principal compuesta (clave partición +
   * clave ordenación).
   * @param {string} primaryKeyValue valor de la clave de partición.
   * @param {string} primarySortKeyValue valor de la clave de ordenación.
   * @returns {Promise<Object>} promise con el elemento.
   */
  getItemWithPrimarySortKey(primaryKeyValue, primarySortKeyValue) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
      };

      params.Key = this.createKey(primaryKeyValue, primarySortKeyValue);

      this.docClient.get(params, (err, data) => {
        if (err) {
          this.customConsoleError('Unable to read item. Error JSON:', err);
          return reject(JSON.stringify(err, null, 2));
        }
        this.customConsoleLog('GetItem succeeded:', data);
        return resolve(data.Item);
      });
    });
  }

  /**
   * Obtiene un elemento en una tabla que no tenga clave de ordenación.
   * @param {string} primaryKeyValue valor de la clave de partición.
   * @returns {Promise<Object>} promise con el elemento.
   */
  getItem(primaryKeyValue) {
    return this.getItemWithPrimarySortKey(primaryKeyValue, null);
  }

  /**
   * Añade un elemento a la tabla, con una clave de partición + clave de ordenación y
   * un conjunto de atributos.
   *
   * @param {string} primaryKeyValue valor de la clave de partición del elemento a insertar.
   * @param {string} primarySortKeyValue valor de la clave de ordenación del elemento a insertar.
   * @param {Object} itemAttributes conjunto de atributos del elemento a insertar.
   * @returns {Promise<Object>} promise de la inserción.
   */
  addItemWithPrimarySortKey(primaryKeyValue, primarySortKeyValue, itemAttributes) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
      };

      params.Item = this.createKey(primaryKeyValue, primarySortKeyValue);

      // Add properties
      for (let i = 0; i < Object.keys(itemAttributes).length; i += 1) {
        const name = Object.keys(itemAttributes)[i];
        params.Item[name] = itemAttributes[name];
      }

      this.docClient.put(params, (err, data) => {
        if (err) {
          this.customConsoleError('Unable to insert:', err);
          return reject(JSON.stringify(err, null, 2));
        }
        this.customConsoleLog('Saved Data:', data);
        return resolve(data);
      });
    });
  }

  /**
 * Añade un elemento a la tabla, con una clave de partición y un conjunto de atributos.
 *
 * @param {string} primaryKeyValue valor de la clave de partición del elemento a insertar.
 * @param {Object} itemAttributes conjunto de atributos del elemento a insertar.
 * @returns {Promise<Object>} promise de la inserción.
 */
  addItem(primaryKeyValue, itemAttributes) {
    return this.addItemWithPrimarySortKey(primaryKeyValue, null, itemAttributes);
  }


  /**
   * Elimina un elemento a la tabla, con una clave de partición y clave de ordenación.
   *
   * @param {string} primaryKeyValue valor de la clave de partición del elemento a eliminar.
   * @param {string} primarySortKeyValue valor de la clave de ordenación del elemento a eliminar.
   * @returns {Promise<Object>} promise de la eliminación.
   */
  deleteItemWithPrimarySortKey(primaryKeyValue, primarySortKeyValue) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
      };

      params.Key = this.createKey(primaryKeyValue, primarySortKeyValue);

      this.docClient.delete(params, (err, data) => {
        if (err) {
          this.customConsoleError('Unable to delete item. Error JSON: ', err);
          return reject(JSON.stringify(err, null, 2));
        }
        this.customConsoleLog('DeleteItem succeeded:', data);
        return resolve();
      });
    });
  }

  /**
   * Elimina un elemento a la tabla, con una clave de partición.
   *
   * @param {string} primaryKeyValue valor de la clave de partición del elemento a eliminar.
   * @returns {Promise<Object>} promise de la eliminación.
   */
  deleteItem(primaryKeyValue) {
    return this.deleteItemWithPrimarySortKey(primaryKeyValue, null);
  }


  /**
   * Actualiza un elemento a la tabla, con una clave de partición + clave de ordenación, y
   * listado de atributos-valores que se actualizarán.
   *
   * @param {string} primaryKeyValue valor de la clave de partición del elemento a actualizar.
   * @param {string} primarySortKeyValue valor de la clave de ordenación del elemento a actualizar.
   * @param {Object} itemAttributesToChange listado de atributos-valores que se actualizarán.
   * @returns {Promise<Object>} promise de la actualización.
   */
  updateItemWithPrimarySortKey(primaryKeyValue, primarySortKeyValue, itemAttributesToChange) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
      };

      params.Key = this.createKey(primaryKeyValue, primarySortKeyValue);

      let strUpdateExpression = 'set';
      params.ExpressionAttributeValues = {};
      for (let i = 0; i < Object.keys(itemAttributesToChange).length; i += 1) {
        const name = Object.keys(itemAttributesToChange)[i];

        strUpdateExpression += ` ${name} = :${name}_value`;
        params.ExpressionAttributeValues[`:${name}_value`] = itemAttributesToChange[name];
      }

      params.UpdateExpression = strUpdateExpression;
      params.ReturnValues = 'UPDATED_NEW';

      this.docClient.update(params, (err, data) => {
        if (err) {
          this.customConsoleError('Unable to update item. Error JSON:', err);
          return reject(JSON.stringify(err, null, 2));
        }
        this.customConsoleLog('UpdateItem succeeded:', data);
        return resolve();
      });
    });
  }

  /**
   * Actualiza un elemento a la tabla, con una clave de partición, y
   * listado de atributos-valores que se actualizarán.
   *
   * @param {string} primaryKeyValue valor de la clave de partición del elemento a actualizar.
   * @param {Object} itemAttributesToChange listado de atributos-valores que se actualizarán.
   * @returns {Promise<Object>} promise de la actualización.
   */
  updateItem(primaryKeyValue, itemAttributesToChange) {
    return this.updateItemWithPrimarySortKey(primaryKeyValue, null, itemAttributesToChange);
  }


  createKey(primaryKeyValue, primarySortKeyValue) {
    const ret = {};
    ret[this.primaryKeyName] = primaryKeyValue; // add key
    if (primarySortKeyValue) {
      ret[this.primarySortKeyName] = primarySortKeyValue; // add sort key (optional)
    }

    return ret;
  }

  customConsoleLog(msg, data) {
    console.log(`${msg} ${JSON.stringify(data, null, 2)}`);
  }

  customConsoleError(msg, err) {
    console.error(`${msg} ${JSON.stringify(err, null, 2)}`);
  }
}

module.exports = Dynamola;

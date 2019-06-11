/**
 * @name Dynamola
 * @file Dynamola, the DynamoDB easy library for Lambda functions.
 * (https://github.com/javichur/dynamola)
 * @author Javier Campos (https://javiercampos.es).
 * @version 1.0.3
 * @license MIT
 * @param {string} tableName nombre de la tabla en DynamoDB.
 * @param {string} partitionKeyName nombre de la Clave de Partición de la tabla.
 * @param {string} sortKeyName nombre de la Clave de Ordenación de la tabla (opcional).
 */
const AWS = require('aws-sdk');

class Dynamola {
  /**
   * @example
   * // constructor, para tabla con Clave Principal Compuesta (Clave Partición y Clave Ordenación)
   * let myDb = new Dynamola("nombreMiTablaMensajes", "userId", "fechaHora");
   * @example
   * // constructor, para tabla con Clave Principal Simple (solo Clave Partición):
   * let myDb = new Dynamola("nombreMiTablaUsuarios", "userId", null);
   */
  constructor(tableName, partitionKeyName, sortKeyName) {
    this.tableName = tableName;
    this.partitionKeyName = partitionKeyName;
    this.sortKeyName = sortKeyName;

    this.docClient = new AWS.DynamoDB.DocumentClient();
    // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.03.htmlclear
  }


  /**
   * Obtiene un elemento en una tabla con clave principal compuesta (clave partición +
   * clave ordenación).
   * @param {string} partitionKeyValue valor de la clave de partición.
   * @param {string} sortKeyValue valor de la clave de ordenación.
   * @returns {Promise<Object>} promise con el elemento.
   */
  getItemWithPrimarySortKey(partitionKeyValue, sortKeyValue) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
      };

      params.Key = this.createKey(partitionKeyValue, sortKeyValue);

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
   * Obtiene un elemento en una tabla con Clave Partición (Clave Principal Simple)
   * @param {string} partitionKeyValue valor de la clave de partición.
   * @returns {Promise<Object>} promise con el elemento.
   */
  getItem(partitionKeyValue) {
    return this.getItemWithPrimarySortKey(partitionKeyValue, null);
  }

  /**
   * Añade un elemento a la tabla, con una clave de partición + clave de ordenación y
   * un conjunto de atributos.
   *
   * @param {string} partitionKeyValue valor de la clave de partición del elemento a insertar.
   * @param {string} sortKeyValue valor de la clave de ordenación del elemento a insertar.
   * @param {Object} itemAttributes conjunto de atributos del elemento a insertar.
   * @returns {Promise<Object>} promise de la inserción.
   */
  addItemWithPrimarySortKey(partitionKeyValue, sortKeyValue, itemAttributes) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
      };

      params.Item = this.createKey(partitionKeyValue, sortKeyValue);

      // Add properties
      for (let i = 0; i < Object.keys(itemAttributes).length; i += 1) {
        const name = Object.keys(itemAttributes)[i];
        params.Item[name] = itemAttributes[name];
      }

      this.docClient.put(params, (err, data) => {
        if (err) {
          this.customConsoleError('Unable to insert:', err);
          return reject(err);
        }
        this.customConsoleLog('Saved Data:', data);
        return resolve(data);
      });
    });
  }

  /**
 * Añade un elemento a la tabla, con una clave de partición y un conjunto de atributos.
 *
 * @param {string} partitionKeyValue valor de la clave de partición del elemento a insertar.
 * @param {Object} itemAttributes conjunto de atributos del elemento a insertar.
 * @returns {Promise<Object>} promise de la inserción.
 */
  addItem(partitionKeyValue, itemAttributes) {
    return this.addItemWithPrimarySortKey(partitionKeyValue, null, itemAttributes);
  }


  /**
   * Elimina un elemento a la tabla, con una clave de partición y clave de ordenación.
   *
   * @param {string} partitionKeyValue valor de la clave de partición del elemento a eliminar.
   * @param {string} sortKeyValue valor de la clave de ordenación del elemento a eliminar.
   * @returns {Promise<Object>} promise de la eliminación.
   */
  deleteItemWithPrimarySortKey(partitionKeyValue, sortKeyValue) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
      };

      params.Key = this.createKey(partitionKeyValue, sortKeyValue);

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
   * @param {string} partitionKeyValue valor de la clave de partición del elemento a eliminar.
   * @returns {Promise<Object>} promise de la eliminación.
   */
  deleteItem(partitionKeyValue) {
    return this.deleteItemWithPrimarySortKey(partitionKeyValue, null);
  }


  /**
   * Actualiza un elemento a la tabla, con una clave de partición + clave de ordenación, y
   * listado de atributos-valores que se actualizarán.
   *
   * @param {string} partitionKeyValue valor de la clave de partición del elemento a actualizar.
   * @param {string} sortKeyValue valor de la clave de ordenación del elemento a actualizar.
   * @param {Object} itemAttributesToChange listado de atributos-valores que se actualizarán.
   * @returns {Promise<Object>} promise de la actualización.
   */
  updateItemWithPrimarySortKey(partitionKeyValue, sortKeyValue, itemAttributesToChange) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
      };

      params.Key = this.createKey(partitionKeyValue, sortKeyValue);

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
   * @param {string} partitionKeyValue valor de la clave de partición del elemento a actualizar.
   * @param {Object} itemAttributesToChange listado de atributos-valores que se actualizarán.
   * @returns {Promise<Object>} promise de la actualización.
   */
  updateItem(partitionKeyValue, itemAttributesToChange) {
    return this.updateItemWithPrimarySortKey(partitionKeyValue, null, itemAttributesToChange);
  }


  createKey(partitionKeyValue, sortKeyValue) {
    const ret = {};
    ret[this.partitionKeyName] = partitionKeyValue; // add key
    if (sortKeyValue) {
      ret[this.sortKeyName] = sortKeyValue; // add sort key (optional)
    }

    return ret;
  }

  /**
   * Crea una tabla dynamodb básica, con:
   * - una clave de partición con nombre "Key" y tipo string.
   * - sin clave de ordenación.
   * - con capacidad aprovisionada de 5 lecturas y 5 escrituras.
   * - sin índices secundarios.
   * @param {string} tableName nombre de la tabla
   */
  static createTableBasic(tableName) {
    return new Promise((resolve, reject) => {
      const params = {
        AttributeDefinitions: [
          {
            AttributeName: 'Key',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'Key',
            KeyType: 'HASH',
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
        TableName: tableName,
      };

      const dynamodb = new AWS.DynamoDB();
      dynamodb.createTable(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }

  customConsoleLog(msg, data) {
    console.log(`${msg} ${JSON.stringify(data, null, 2)}`);
  }

  customConsoleError(msg, err) {
    console.error(`${msg} ${JSON.stringify(err, null, 2)}`);
  }
}

module.exports = Dynamola;

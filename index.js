/**
 * @name Dynamola
 * @file Dynamola, the DynamoDB easy library for Lambda functions.
 * (https://github.com/javichur/dynamola)
 * @author Javier Campos (https://javiercampos.es).
 * @version 1.4.0
 * @license MIT
 * @param {string} tableName nombre de la tabla en DynamoDB.
 * @param {string} partitionKeyName nombre de la Clave de Partición de la tabla.
 * @param {string} sortKeyName nombre de la Clave de Ordenación de la tabla (opcional).
 */
const AWS = require('aws-sdk');
const ParamsBuilder = require('./paramsBuilder.js');

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
          Dynamola.customConsoleError('Unable to read item. Error JSON:', err);
          return reject(JSON.stringify(err, null, 2));
        }
        Dynamola.customConsoleLog('GetItem succeeded:', data);
        return resolve(data.Item);
      });
    });
  }

  /**
   * Obtiene un elemento en una tabla con Clave Principal Simple (solo Clave Partición)
   * @param {string} partitionKeyValue valor de la clave de partición.
   * @returns {Promise<Object>} promise con el elemento.
   */
  getItem(partitionKeyValue) {
    return this.getItemWithPrimarySortKey(partitionKeyValue, null);
  }


  /**
   * En tablas con Clave Principal Compuesta (partición+ordenación), devuelve todos los items para
   * el valor de Clave de Partición dado.
   * @param {string} partitionKeyValue valor de la clave de partición.
   * @returns {Promise<Object>} promise con array de elementos.
   */
  getAllItemsByPartitionKey(partitionKeyValue) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
        KeyConditionExpression: '#partitionKey = :val',
        ExpressionAttributeNames: {
          '#partitionKey': this.partitionKeyName,
        },
        ExpressionAttributeValues: {
          ':val': partitionKeyValue,
        },
      };

      this.docClient.query(params, (err, data) => {
        if (err) {
          Dynamola.customConsoleError('Unable to read items. Error JSON:', err);
          return reject(JSON.stringify(err, null, 2));
        }
        Dynamola.customConsoleLog('getAllItems... succeeded:', data);
        return resolve(data.Items);
      });
    });
  }


  /**
   * En tablas con Clave Principal Compuesta (partición+ordenación), devuelve todos los items para
   * el valor de Clave de Partición dado, cuya Clave de Ordenación está en el rango dado.
   * @param {string} partitionKeyValue valor de la clave de partición.
   * @param {string} rangeFrom inicio rango de la clave de ordenación.
   * @param {string} rangeTo fin rango de la clave de ordenación.
   * @returns {Promise<Object>} promise con array de elementos.
   */
  getItemsBySortKeyInRange(partitionKeyValue, sortKeyRangeFrom, sortKeyRangeTo) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
        KeyConditionExpression: '#partitionKey = :val and #sortKey between :from and :to',
        ExpressionAttributeNames: {
          '#partitionKey': this.partitionKeyName,
          '#sortKey': this.sortKeyName,
        },
        ExpressionAttributeValues: {
          ':val': partitionKeyValue,
          ':from': sortKeyRangeFrom,
          ':to': sortKeyRangeTo,
        },
      };

      this.docClient.query(params, (err, data) => {
        if (err) {
          Dynamola.customConsoleError('Unable to read items. Error JSON:', err);
          return reject(JSON.stringify(err, null, 2));
        }
        Dynamola.customConsoleLog('getItemsBySortKeyInRange() succeeded:', data);
        return resolve(data.Items);
      });
    });
  }

 /**
   * Busca utilizando un Índice Local Secundario (LSI) de la tabla.
   * @param {*} partitionKeyValue Valor de la Clave de Partición, para la búsqueda.
   * @param {*} lsiValue Valor del LSI, para la búsqueda.
   * @param {string} lsiIndexName Nombre del índice LSI.
   * @param {string} lsiAttributeName Nombre del atributo (perteneciente al LSI) por el cual
   * realizar la consulta.
   * @param {string} operator Operador utilizado en la consulta (=, <, >, <=, >=).
   * @returns {Promise<Object>} promise con array de elementos.
   */
  getItemsByLSI(partitionKeyValue, lsiValue, lsiIndexName, lsiAttributeName, operator) {
    return new Promise((resolve, reject) => {
      const valirOperators = ['=', '<', '<=', '>', '>='];
      if (!valirOperators.includes(operator)) {
        return reject(new Error(`Invalid operator: ${operator}`));
      }

      const params = {
        TableName: this.tableName,
        IndexName: lsiIndexName,
        KeyConditionExpression: `#partitionKey = :val_pk and #lsi ${operator} :val_lsi`,
        ExpressionAttributeNames: {
          '#partitionKey': this.partitionKeyName,
          '#lsi': lsiAttributeName,
        },
        ExpressionAttributeValues: {
          ':val_pk': partitionKeyValue,
          ':val_lsi': lsiValue,
        },
      };

      this.docClient.query(params, (err, data) => {
        if (err) {
          Dynamola.customConsoleError('Unable to read items. Error JSON:', err);
          return reject(JSON.stringify(err, null, 2));
        }
        Dynamola.customConsoleLog('getItemsByLSI() succeeded:', data);
        return resolve(data.Items);
      });
    });
  }

  /**
   * Devuelve todos los items cuyo valor de partition key está entre los 2 valores dados.
   * ADVERTENCIA: Se recomienda que diseñes tus tablas DynamoDB para no tener que
   * utilizar este método, ya que éste necesita usar internamente scan(),
   * que es más costoso que Query().
   * @param {string} partitionKeyFrom Inicio del rango de la clave de partición.
   * @param {string} partitionKeyTo Fin del rango de la clave de partición.
   * @returns {Promise<Object>} promise con array de elementos.
   */
  getItemsByPartitionKeyInRange(partitionKeyFrom, partitionKeyTo) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
        FilterExpression: '#partitionKey between :from and :to',
        ExpressionAttributeNames: {
          '#partitionKey': this.partitionKeyName,
        },
        ExpressionAttributeValues: {
          ':from': partitionKeyFrom,
          ':to': partitionKeyTo,
        },
      };

      this.docClient.scan(params, (err, data) => {
        if (err) {
          Dynamola.customConsoleError('Unable to read items. Error JSON:', err);
          return reject(JSON.stringify(err, null, 2));
        }
        Dynamola.customConsoleLog('getItemsByPartitionKeyInRange() succeeded:', data);
        return resolve(data.Items);
      });
    });
  }


  /**
   * Añade un elemento a la tabla, con una clave de partición + clave de ordenación y
   * un conjunto de atributos.
   *
   * @param {string} partitionKeyValue valor de la clave de partición del elemento a insertar.
   * @param {string} sortKeyValue valor de la clave de ordenación del elemento a insertar.
   * @param {Object} itemAttributes conjunto de atributos del elemento a insertar.
   * @returns {Promise<Object>} promise de la inserción. revolve(Item) o reject(err)
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
          Dynamola.customConsoleError('Unable to insert:', err);
          return reject(err);
        }
        // The ReturnValues parameter is used by several DynamoDB operations;
        // however, PutItem (and put) does not recognize any values other than NONE or ALL_OLD.
        Dynamola.customConsoleLog('Saved Data. ', data);
        return resolve(params.Item); // devuelve input
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
   * Añade un elemento en la tabla a partir de un objeto, que debe tener al menos 1 atributo
   * llamado como la Clave de Partición y, si hay clave de ordenación, otro atributo llamado
   * como la clave de ordenación. Además, puede tener otros atributos que también se
   * almacenarán en la tabla con sus nombres.
   *
   * @param {object} item item que se guardará en la tabla.
   * @returns {Promise<Object>} promise de la inserción.
   */
  addItemFromObject(item) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
      };

      // comprobar que contiene valor para Clave Partición (obligado) y Clave Ordenación (opcional)
      let partitionKeyFound = false;
      let sortKeyFound = false;
      for (let i = 0; i < Object.keys(item).length; i += 1) {
        const name = Object.keys(item)[i];
        if (name === this.partitionKeyName) {
          partitionKeyFound = true;
        } else if (this.sortKeyName != null && name === this.sortKeyName) {
          sortKeyFound = true;
        }
      }

      if (partitionKeyFound === false) {
        const err = `El objeto no tiene atributo llamado como la Clave Partición "${this.partitionKeyName}"`;
        Dynamola.customConsoleError('Unable to insert:', err);
        return reject(err);
      }
      if (this.sortKeyName !== null && sortKeyFound === false) {
        const err = `El objeto no tiene atributo llamado como la Clave Ordenación "${this.sortKeyName}".`;
        Dynamola.customConsoleError('Unable to insert:', err);
        return reject(err);
      }

      params.Item = item;

      this.docClient.put(params, (err, data) => {
        if (err) {
          Dynamola.customConsoleError('Unable to insert:', err);
          return reject(err);
        }
        // The ReturnValues parameter is used by several DynamoDB operations;
        // however, PutItem (and put) does not recognize any values other than NONE or ALL_OLD.
        Dynamola.customConsoleLog('Saved Data. ', data);
        return resolve(params.Item); // devuelve input
      });
    });
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
        ReturnValues: 'ALL_OLD',
      };

      params.Key = this.createKey(partitionKeyValue, sortKeyValue);

      this.docClient.delete(params, (err, data) => {
        if (err) {
          Dynamola.customConsoleError('Unable to delete item. Error JSON: ', err);
          return reject(JSON.stringify(err, null, 2));
        }
        Dynamola.customConsoleLog('DeleteItem succeeded:', data);
        return resolve(data.Attributes);
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
   * No funciona con espacios en los nombres de los atributos.
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
        ReturnValues: 'UPDATED_NEW',
      };

      params.Key = this.createKey(partitionKeyValue, sortKeyValue);

      let strUpdateExpression = 'set';
      params.ExpressionAttributeValues = {};
      for (let i = 0; i < Object.keys(itemAttributesToChange).length; i += 1) {
        const name = Object.keys(itemAttributesToChange)[i];
        // const nameNorm = `${name.replace(/\s/g, '_')}_value`; // no es suficiente

        strUpdateExpression += ` ${name} = :${name}_value`;
        params.ExpressionAttributeValues[`:${name}_value`] = itemAttributesToChange[name];
      }

      params.UpdateExpression = strUpdateExpression;

      this.docClient.update(params, (err, data) => {
        if (err) {
          Dynamola.customConsoleError('Unable to update item. Error JSON:', err);
          return reject(JSON.stringify(err, null, 2));
        }
        Dynamola.customConsoleLog('UpdateItem succeeded:', data);
        return resolve(data.Attributes);
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


  /**
   * Incrementando de forma atómica el valor de un atributo en X cantidad.
   * @param {string} partitionKeyValue valor de la clave de partición del elemento a actualizar.
   * @param {string} sortKeyValue valor de la clave de ordenación del elemento a actualizar.
   * @param {string} attributeName nombre del atributo a incrementar.
   * @param {int} increment cantidad en la que se incrementa el valor.
   * @returns {Promise<Object>} promise de la actualización.
   */
  incrementCounterWithPrimarySortKey(partitionKeyValue, sortKeyValue, attributeName, increment) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.tableName,
        ReturnValues: 'UPDATED_NEW',
        UpdateExpression: `set ${attributeName} = ${attributeName} + :inc`,
        ExpressionAttributeValues: {
          ':inc': increment,
        },
      };

      params.Key = this.createKey(partitionKeyValue, sortKeyValue);

      this.docClient.update(params, (err, data) => {
        if (err) {
          Dynamola.customConsoleError('Unable to update item. Error JSON:', err);
          return reject(JSON.stringify(err, null, 2));
        }
        Dynamola.customConsoleLog('UpdateItem succeeded:', data);
        return resolve(data.Attributes);
      });
    });
  }


  /**
   * Incrementando de forma atómica el valor de un atributo en X unidades.
   * @param {string} partitionKeyValue valor de la clave de partición del elemento a actualizar.
   * @param {string} attributeName nombre del atributo a incrementar.
   * @param {int} increment cantidad en la que se incrementa el valor.
   * @returns {Promise<Object>} promise de la actualización.
   */
  incrementCounter(partitionKeyValue, attributeName, increment) {
    return this.incrementCounterWithPrimarySortKey(partitionKeyValue,
      null,
      attributeName,
      increment);
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
      const params = ParamsBuilder.getParamsToCreateBasicTable(tableName);

      const dynamodb = new AWS.DynamoDB();
      dynamodb.createTable(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }

  /**
   * Crea una tabla dynamodb básica, con:
   * - una clave de partición con nombre "Key" y tipo string.
   * - una clave de ordenación con nombre "KeySort" y tipo string.
   * - con capacidad aprovisionada de 5 lecturas y 5 escrituras.
   * - sin índices secundarios.
   * @param {string} tableName nombre de la tabla
   */
  static createTableBasicWithSortKey(tableName) {
    return new Promise((resolve, reject) => {
      const params = ParamsBuilder.getParamsToCreateBasicTableWithSortKey(tableName);

      const dynamodb = new AWS.DynamoDB();
      dynamodb.createTable(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }

  /**
   * Crea una tabla dynamodb básica, con:
   * - una clave de partición con nombre "Key" y tipo string.
   * - una clave de ordenación con nombre "KeySort" y tipo string.
   * - un atributo con nombre "Lsi", de tipo int.
   * - un LSI (Índice Local Secundario) llamado "Lsi-index",
   * que tiene como Clave de Partición y Ordenación a "Key" y "Lsi" respectivamente.
   * - con capacidad aprovisionada de 5 lecturas y 5 escrituras.
   * @param {string} tableName nombre de la tabla
   */
  static createTableBasicWithSortKeyAndLSI(tableName) {
    return new Promise((resolve, reject) => {
      const params = ParamsBuilder.getParamsToCreateBasicTableWithSortKeyAndLSI(tableName);

      const dynamodb = new AWS.DynamoDB();
      dynamodb.createTable(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }

  static customConsoleLog(msg, data) {
    console.log(`${msg} ${JSON.stringify(data, null, 2)}`); // eslint-disable-line no-console
  }

  static customConsoleError(msg, err) {
    console.error(`${msg} ${JSON.stringify(err, null, 2)}`); // eslint-disable-line no-console
  }
}

module.exports = Dynamola;

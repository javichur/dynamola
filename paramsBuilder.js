
/**
* @name ParamsBuilder
* @file paramsBuilder.js , utilizado por Dynamola.
* @author Javier Campos (https://javiercampos.es).
*
*/
class ParamsBuilder {
  static getParamsToCreateBasicTable(tableName) {
    return {
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
  }

  static getParamsToCreateBasicTableWithSortKey(tableName) {
    return {
      AttributeDefinitions: [
        {
          AttributeName: 'Key',
          AttributeType: 'S',
        },
        {
          AttributeName: 'SortKey',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'Key',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'SortKey',
          KeyType: 'RANGE',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      TableName: tableName,
    };
  }

  static getParamsToCreateBasicTableWithSortKeyAndLSI(tableName) {
    return {
      AttributeDefinitions: [
        {
          AttributeName: 'Key',
          AttributeType: 'S',
        },
        {
          AttributeName: 'SortKey',
          AttributeType: 'S',
        },
        {
          AttributeName: 'Lsi',
          AttributeType: 'N',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'Key',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'SortKey',
          KeyType: 'RANGE',
        },
      ],
      LocalSecondaryIndexes: [
        {
          IndexName: 'Lsi-index',
          KeySchema: [
            {
              AttributeName: 'Key',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'Lsi',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'KEYS_ONLY',
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      TableName: tableName,
    };
  }

  static getParamsToCreateBasicTableWithSortKeyGSI(tableName) {
    return {
      AttributeDefinitions: [
        {
          AttributeName: 'Key',
          AttributeType: 'S',
        },
        {
          AttributeName: 'SortKey',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'Key',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'SortKey',
          KeyType: 'RANGE',
        },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'Gsi-index',
          KeySchema: [
            {
              AttributeName: 'SortKey',
              KeyType: 'HASH',
            },
          ],
          Projection: {
            ProjectionType: 'KEYS_ONLY',
          },
          ProvisionedThroughput: { 
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
         }
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      TableName: tableName,
    };
  }
}

module.exports = ParamsBuilder;

const assert = require('assert')
const dynamola = require('../index')

describe('Dynamola tests', function () {
  describe('#Crear tabla "tablaprueba"', function () {
    it('Creación tabla "tablaprueba"', async () => {
      const AWS = require('aws-sdk');

      var credentials = new AWS.SharedIniFileCredentials({ profile: 'dynamodb-profile' });
      AWS.config.credentials = credentials;

      AWS.config.update({ region: 'eu-west-1' }); // eu-west-1 = Irlanda

      const result = await dynamola.createTableBasic('tablaprueba');
      assert.equal(result.TableDescription.TableName, 'tablaprueba');
    })
  })
})
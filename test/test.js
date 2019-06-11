const assert = require('assert');
const dynamola = require('../index');

const nombreTablaPruebas = 'tablaprueba';
const sharedCredentialsProfile = 'dynamodb-profile';
const awsRegion = 'eu-west-1';

const AWS = require('aws-sdk');

var credentials = new AWS.SharedIniFileCredentials({ profile: sharedCredentialsProfile });
AWS.config.credentials = credentials;

AWS.config.update({ region: awsRegion });

const dynamodb = new AWS.DynamoDB();

describe('Dynamola tests', function () {
  
  it('Creación tabla ' + nombreTablaPruebas, async () => {

    const result = await dynamola.createTableBasic(nombreTablaPruebas);

    assert.equal(result.TableDescription.TableName, nombreTablaPruebas);
  });
  
  it('Añadiendo item en la tabla', () => {

    let d = new dynamola(nombreTablaPruebas, 'Key', null);
    return d.addItem('item4', { 'otro atributo': 'valor 4' }).then((result) => {
      console.log("add result: " + JSON.stringify(result));
      assert.equal(result, 'added!'); // force error
    });
  });

  it('Obtener item de la tabla', () => {

    let d = new dynamola(nombreTablaPruebas, 'Key', null);
    return d.getItem('item4').then((result) => {
      console.log("get result: " + JSON.stringify(result));
      assert.equal(result.Key, 'item4');
      assert.equal(result['otro atributo'], 'valor 4');
    });
  });

  
  it('Borrar la tabla', async () => {    
    dynamodb.deleteTable({ TableName: nombreTablaPruebas }, function (err, data) {
      if (err) {
        console.error(`Unable to delete table "${nombreTablaPruebas}". Error JSON:`, JSON.stringify(err, null, 2));
      } else {
        console.log(`Deleted table "${nombreTablaPruebas}". Table description JSON:`, JSON.stringify(data, null, 2));
      }

      assert.equal(data.TableDescription.TableName, nombreTablaPruebas);
    });
  });
  
})
/**
 * Tests
 * 
 * links of interest:
 * - How to Test Promises with Mocha:
 *   https://wietse.loves.engineering/testing-promises-with-mocha-90df8b7d2e35 
 */
const assert = require('assert');
const dynamola = require('../index');

const NOMBRETABLAPRUEBAS = 'tablaprueba';
const ITEMPRUEBAS = {
  Key: 'item4',
  otroAtributo: 'valor otro atributo',
  'atr con espacios': 'valor atributo',
  atributoNum: 25
}

const NOMBRETABLAPRUEBASCOMPUESTA = 'tablapruebacompuesta';


const sharedCredentialsProfile = 'dynamodb-profile';
const awsRegion = 'eu-west-1';

const AWS = require('aws-sdk');

var credentials = new AWS.SharedIniFileCredentials({ profile: sharedCredentialsProfile });
AWS.config.credentials = credentials;

AWS.config.update({ region: awsRegion });

describe('Dynamola tests', function () {
  describe('Tabla con Clave Principal Simple (sin Clave Ordenación)', function () {
    /*
    it('Creación tabla ' + NOMBRETABLAPRUEBAS, async () => {
      const result = await dynamola.createTableBasic(NOMBRETABLAPRUEBAS);
      assert.equal(result.TableDescription.TableName, NOMBRETABLAPRUEBAS);
    });
    */

    it('Añadiendo item en la tabla', async () => {
      let d = new dynamola(NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await
        d.addItem(ITEMPRUEBAS.Key, {
          'otroAtributo': ITEMPRUEBAS.otroAtributo,
          'atr con espacios': ITEMPRUEBAS['atr con espacios'],
          atributoNum: ITEMPRUEBAS.atributoNum
        });

      console.log("add result: " + JSON.stringify(okOrKo));
      assert.equal(okOrKo.Key, ITEMPRUEBAS.Key);
    });


    it('Obtener item de la tabla', async () => {
      let d = new dynamola(NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await d.getItem(ITEMPRUEBAS.Key);

      assert.equal(okOrKo.Key, ITEMPRUEBAS.Key);
      assert.equal(okOrKo['otroAtributo'], ITEMPRUEBAS.otroAtributo);
      assert.equal(okOrKo['atr con espacios'], ITEMPRUEBAS['atr con espacios']);
    });


    it('Actualizar item de la tabla, atributo SIN espacios', async () => {
      const nuevoValor = 'valor actualizado';
      let d = new dynamola(NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await d.updateItem(ITEMPRUEBAS.Key, { otroAtributo: nuevoValor });

      assert.equal(okOrKo.otroAtributo, nuevoValor);
    });

    it('Incrementar contador atómico', async () => {
      const incremento = 10;
      let d = new dynamola(NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await d.incrementCounter(ITEMPRUEBAS.Key, 'atributoNum', incremento);

      assert.equal(okOrKo.atributoNum, ITEMPRUEBAS.atributoNum + incremento);
    });


    /* El método update de DynamoDB no soporta espacios en los nombres de los atributos.
    it('Actualizar item de la tabla, atributo CON espacios', async () => {
      const nuevoValor = 'valor actualizado espacio';
      let d = new dynamola(NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await d.updateItem(ITEMPRUEBAS.Key, { 'atr con espacios': nuevoValor});
      
      assert.equal(okOrKo['atr con espacios'], nuevoValor);
    });
    */

    it('Borrar item de la tabla', async () => {
      let d = new dynamola(NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await d.deleteItem(ITEMPRUEBAS.Key);

      assert.equal(okOrKo.Key, ITEMPRUEBAS.Key);
    });


    /*
    it('Borrar la tabla', async () => {
      const dynamodb = new AWS.DynamoDB();
      dynamodb.deleteTable({ TableName: NOMBRETABLAPRUEBAS }, function (err, data) {
        if (err) {
          console.error(`Unable to delete table "${NOMBRETABLAPRUEBAS}". Error JSON:`, JSON.stringify(err, null, 2));
        } else {
          console.log(`Deleted table "${NOMBRETABLAPRUEBAS}". Table description JSON:`, JSON.stringify(data, null, 2));
        }
  
        assert.equal(data.TableDescription.TableName, NOMBRETABLAPRUEBAS);
      });
    });
    */
  })

  describe('Tabla con Clave Principal Compuesta', function () {

    /*
    it('Creación tabla ' + NOMBRETABLAPRUEBASCOMPUESTA, async () => {
      const result = await dynamola.createTableBasicWithSortKey(NOMBRETABLAPRUEBASCOMPUESTA);
      assert.equal(result.TableDescription.TableName, NOMBRETABLAPRUEBASCOMPUESTA);
    });
    

    it('Obtener all items de la tabla para un Key', async () => {
      let d = new dynamola(NOMBRETABLAPRUEBASCOMPUESTA, 'Key', 'SortKey');
      const okOrKo = await d.getAllItemsByPartitionKey('2015');

      assert.equal(okOrKo.length, 2);
      assert.equal(okOrKo[0].Key, '2015');
      assert.equal(okOrKo[1].SortKey, 'valor sort de segundo item');
    });

    it('Obtener items en un RANGO', async () => {
      let d = new dynamola(NOMBRETABLAPRUEBASCOMPUESTA, 'Key', 'SortKey');
      const okOrKo = await d.getItemsByPartitionKeyInRange('2015', '3333', '4444');

      assert.equal(okOrKo.length, 6);
      assert.equal(okOrKo[0].Key, '2015');
      assert.equal(okOrKo[1].SortKey, '3500');
    });
    */

  })
})
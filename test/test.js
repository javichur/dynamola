/**
 * Tests. Pueden ejecutarse en Local o en AWS remoto, usando variable 'isLocal".
 * 
 * links of interest:
 * - How to Test Promises with Mocha:
 *   https://wietse.loves.engineering/testing-promises-with-mocha-90df8b7d2e35 
 */
const AWS = require('aws-sdk');
const assert = require('assert');
const Dynamola = require('../index');
const a = require('./assets.js');
const configurations = require('../config.json');


const isLocal = true; // Establece si los tests se ejecutan en DynamoDB local o en remoto.
// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html

const config = (isLocal === true) ? configurations.local : configurations.remote;

AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: config.profile });
AWS.config.update(config);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function esperarActivacionTablaCreada(nombreTabla, parent) {
  const dynamodb = new AWS.DynamoDB();
  let ms = 2000;
  let status;
  do {
    parent.timeout(ms += 3000);
    await sleep(3000);
    let ret = await dynamodb.describeTable({ TableName: nombreTabla })
      .promise();
    console.log('loop: ' + JSON.stringify(ret));
    status = ret.Table.TableStatus;
  } while (status == 'CREATING');

  return status;
}

describe('Dynamola tests', function () {
  describe('Tabla con Clave Principal Simple (sin Clave Ordenación)', function () {
    // Creación tabla con Clave Principal Simple.
    before(async function () {
      const result = await Dynamola.createTableBasic(a.NOMBRETABLAPRUEBAS);

      console.log('result: ' + JSON.stringify(result));

      assert.equal(result.TableDescription.TableName, a.NOMBRETABLAPRUEBAS);

      if (result.TableDescription.TableStatus == ' ACTIVE') {
        return;
      }

      status = await esperarActivacionTablaCreada(a.NOMBRETABLAPRUEBAS, this);
      assert.equal(status, 'ACTIVE');
    });

    it('Añadiendo item en la tabla', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await
        d.addItem(a.ITEM1.Key, {
          'otroAtributo': a.ITEM1.otroAtributo,
          atributoNum: a.ITEM1.atributoNum
        });

      console.log("add result: " + JSON.stringify(okOrKo));
      assert.equal(okOrKo.Key, a.ITEM1.Key);
    });


    it('Obtener item de la tabla', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await d.getItem(a.ITEM1.Key);

      assert.equal(okOrKo.Key, a.ITEM1.Key);
      assert.equal(okOrKo['otroAtributo'], a.ITEM1.otroAtributo);
    });


    it('Añadiendo desde Objeto item en la tabla', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBAS, 'Key', null);
      let okOrKo = await
        d.addItemFromObject(a.ITEM2);

      console.log("add result: " + JSON.stringify(okOrKo));
      assert.equal(okOrKo.Key, a.ITEM2.Key);
      assert.equal(okOrKo.otroAtributo, a.ITEM2.otroAtributo);

      okOrKo = await
        d.addItemFromObject(a.ITEM3);

      console.log("add result: " + JSON.stringify(okOrKo));
      assert.equal(okOrKo.Key, a.ITEM3.Key);
      assert.equal(okOrKo.otroAtributo, a.ITEM3.otroAtributo);
    });


    it('Obtener items en un RANGO de clave de partición', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBAS, 'Key', 'SortKey');
      const okOrKo = await d.getItemsByPartitionKeyInRange('cama', 'gato');

      assert.equal(okOrKo.length, 2);
    });

    it('Actualizar item de la tabla, 1 atributo SIN espacios', async () => {
      const nuevoValor = 'valor actualizado';
      let d = new Dynamola(a.NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await d.updateItem(a.ITEM1.Key, { otroAtributo: nuevoValor });

      assert.equal(okOrKo.otroAtributo, nuevoValor);
    });

    it('Actualizar item de la tabla, DOS atributos', async () => {
      const nuevoValor = 'valor actualizado de nuevo';
      const nuevoValor2 = 40;
      let d = new Dynamola(a.NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await d.updateItem(a.ITEM1.Key, { otroAtributo: nuevoValor, atributo4: nuevoValor2 });

      assert.equal(okOrKo.otroAtributo, nuevoValor);
      assert.equal(okOrKo.atributo4, nuevoValor2);
    });


    it('Incrementar contador atómico', async () => {
      const incremento = 10;
      let d = new Dynamola(a.NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await d.incrementCounter(a.ITEM1.Key, 'atributoNum', incremento);

      assert.equal(okOrKo.atributoNum, a.ITEM1.atributoNum + incremento);
    });


    /* El método update de DynamoDB no soporta espacios en los nombres de los atributos. */

    it('Borrar item de la tabla', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBAS, 'Key', null);
      const okOrKo = await d.deleteItem(a.ITEM1.Key);

      assert.equal(okOrKo.Key, a.ITEM1.Key);
    });


    after(function () {
      const dynamodb = new AWS.DynamoDB();
      dynamodb.deleteTable({ TableName: a.NOMBRETABLAPRUEBAS }, function (err, data) {
        if (err) {
          console.error(`Unable to delete table "${a.NOMBRETABLAPRUEBAS}". Error JSON:`, JSON.stringify(err, null, 2));
        } else {
          console.log(`Deleted table "${a.NOMBRETABLAPRUEBAS}"`);
        }

        assert.equal(data.TableDescription.TableName, a.NOMBRETABLAPRUEBAS);
      });
    });
  })


  describe('Tabla con Clave Principal Compuesta', function () {

    // Crear tabla con Clave Principal Compuesta
    before(async function () {
      const result = await Dynamola.createTableBasicWithSortKey(a.NOMBRETABLAPRUEBASCOMPUESTA);

      console.log('result: ' + JSON.stringify(result));

      assert.equal(result.TableDescription.TableName, a.NOMBRETABLAPRUEBASCOMPUESTA);

      if (result.TableDescription.TableStatus == ' ACTIVE') {
        return;
      }

      status = await esperarActivacionTablaCreada(a.NOMBRETABLAPRUEBASCOMPUESTA, this);
      assert.equal(status, 'ACTIVE');
    });


    it('Añadiendo desde Objeto item en tabla con Clave Principal Compuesta', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASCOMPUESTA, 'Key', null);

      let okOrKo = await d.addItemFromObject(a.SORTITEM1);
      console.log("add result: " + JSON.stringify(okOrKo));
      assert.equal(okOrKo.Key, a.SORTITEM1.Key);
      assert.equal(okOrKo.SortKey, a.SORTITEM1.SortKey);
      assert.equal(okOrKo.otroAtributo, a.SORTITEM1.otroAtributo);

      okOrKo = await d.addItemFromObject(a.SORTITEM2);
      console.log("add result: " + JSON.stringify(okOrKo));
      assert.equal(okOrKo.Key, a.SORTITEM2.Key);
      assert.equal(okOrKo.SortKey, a.SORTITEM2.SortKey);

      okOrKo = await d.addItemFromObject(a.SORTITEM3);
      console.log("add result: " + JSON.stringify(okOrKo));
      assert.equal(okOrKo.Key, a.SORTITEM3.Key);

      okOrKo = await d.addItemFromObject(a.SORTITEM4);
      console.log("add result: " + JSON.stringify(okOrKo));
      assert.equal(okOrKo.Key, a.SORTITEM4.Key);

      okOrKo = await d.addItemFromObject(a.SORTITEM5);
      console.log("add result: " + JSON.stringify(okOrKo));
      assert.equal(okOrKo.Key, a.SORTITEM5.Key);
    });


    it('Para una Clave Partition, obtener all items de la tabla.', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASCOMPUESTA, 'Key', 'SortKey');
      const okOrKo = await d.getAllItemsByPartitionKey('user1');

      assert.equal(okOrKo.length, 4);
      assert.equal(okOrKo[0].Key, 'user1');
    });


    it('Para 1 Clave Partición, obtener items en un RANGO de Clave de Ordenación.', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASCOMPUESTA, 'Key', 'SortKey');
      const okOrKo = await d.getItemsBySortKeyInRange('user1', '1980', '1994');

      assert.equal(okOrKo.length, 2);
      assert.equal(okOrKo[0].Key, 'user1');
      assert.equal((okOrKo[0].SortKey >= '1980' && okOrKo[0].SortKey <= '1994'), true);
    });

    it('Para 1 Clave Partición, obtener items BEGINS WITH de Clave de Ordenación.', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASCOMPUESTA, 'Key', 'SortKey');
      const okOrKo = await d.getItemsBySortKeyBeginsWith('user1', '199');

      assert.equal(okOrKo.length, 3);
      assert.equal(okOrKo[0].SortKey.startsWith('199'), true);
      assert.equal(okOrKo[1].SortKey.startsWith('199'), true);
      assert.equal(okOrKo[2].SortKey.startsWith('199'), true);
    });

    it('Obtener el item con valor máximo en SortKey', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASCOMPUESTA, 'Key', 'SortKey');
      const okOrKo = await d.getItemGreatestWithPrimarySortKey('user1');

      assert.equal(okOrKo.length, 1);
      assert.equal(okOrKo[0].SortKey, '1995');
    });


    after(function () {
      const dynamodb = new AWS.DynamoDB();
      dynamodb.deleteTable({ TableName: a.NOMBRETABLAPRUEBASCOMPUESTA }, function (err, data) {
        if (err) {
          console.error(`Unable to delete table "${a.NOMBRETABLAPRUEBASCOMPUESTA}". Error JSON:`,
            JSON.stringify(err, null, 2));
        } else {
          console.log(`Deleted table "${a.NOMBRETABLAPRUEBASCOMPUESTA}"`);
        }

        assert.equal(data.TableDescription.TableName, a.NOMBRETABLAPRUEBASCOMPUESTA);
      });
    });

  })


  describe('Tabla con LSI', function () {

    // Crear tabla con LSI
    before(async function () {
      const result = await Dynamola.createTableBasicWithSortKeyAndLSI(a.NOMBRETABLAPRUEBASLSI);

      console.log('result: ' + JSON.stringify(result));

      assert.equal(result.TableDescription.TableName, a.NOMBRETABLAPRUEBASLSI);

      if (result.TableDescription.TableStatus == ' ACTIVE') {
        return;
      }

      status = await esperarActivacionTablaCreada(a.NOMBRETABLAPRUEBASLSI, this);
      console.log('Tabla activa');
      assert.equal(status, 'ACTIVE');
    });


    it('Añadiendo desde Objeto item en tabla con LSI', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASLSI, 'Key', null);

      let okOrKo = await d.addItemFromObject(a.SORTITEM1);
      okOrKo = await d.addItemFromObject(a.SORTITEM2);
      okOrKo = await d.addItemFromObject(a.SORTITEM3);
      okOrKo = await d.addItemFromObject(a.SORTITEM4);
      okOrKo = await d.addItemFromObject(a.SORTITEM5);
      console.log("add result: " + JSON.stringify(okOrKo));
      assert.equal(okOrKo.Key, a.SORTITEM5.Key);
    });


    it('Para una Clave Partition, obtener all items de la tabla.', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASLSI, 'Key', 'SortKey');
      const okOrKo = await d.getAllItemsByPartitionKey('user1');

      assert.equal(okOrKo.length, 4);
      assert.equal(okOrKo[0].Key, 'user1');
    });

    it('getItemsByLSI(=5)', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASLSI, 'Key', 'SortKey');
      const okOrKo = await d.getItemsByLSI('user1', 5, 'Lsi-index', 'Lsi', '=');

      assert.equal(okOrKo.length, 2);
      assert.equal(okOrKo[0].Lsi, 5);
      assert.equal(okOrKo[1].Lsi, 5);
    });

    it('getItemsByLSI(<5)', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASLSI, 'Key', 'SortKey');
      const okOrKo = await d.getItemsByLSI('user1', 5, 'Lsi-index', 'Lsi', '<');

      assert.equal(okOrKo.length, 1);
      assert.equal(okOrKo[0].Lsi < 5, true);
    });

    it('getItemsByLSI(operator "z") -> reject', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASLSI, 'Key', 'SortKey');

      await d.getItemsByLSI('user1', 5, 'Lsi-index', 'Lsi', 'z').then(
        () => {
          assert.equal(true, false); // fallar
        },
        (err) => {
          assert.equal(err.message, 'Invalid operator: z');
        }
      );
    });

    it('getItemGreatestByLSI()', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASLSI, 'Key', 'SortKey');

      const okOrKo = await d.getItemGreatestByLSI('user1', 'Lsi-index');

      assert.equal(okOrKo.length, 1);
      assert.equal(okOrKo[0].Lsi, 73);
    });

    after(function () {
      const dynamodb = new AWS.DynamoDB();
      dynamodb.deleteTable({ TableName: a.NOMBRETABLAPRUEBASLSI }, function (err, data) {
        if (err) {
          console.error(`Unable to delete table "${a.NOMBRETABLAPRUEBASLSI}". Error JSON:`,
            JSON.stringify(err, null, 2));
        } else {
          console.log(`Deleted table "${a.NOMBRETABLAPRUEBASLSI}"`);
        }

        assert.equal(data.TableDescription.TableName, a.NOMBRETABLAPRUEBASLSI);
      });
    });
  })

  describe('Tabla con GSI en SortKey', function () {

    // Crear tabla con GSI
    before(async function () {
      const result = await Dynamola.createTableBasicWithSortKeyGSI(a.NOMBRETABLAPRUEBASGSI);

      console.log('result: ' + JSON.stringify(result));

      assert.equal(result.TableDescription.TableName, a.NOMBRETABLAPRUEBASGSI);

      if (result.TableDescription.TableStatus == ' ACTIVE') {
        return;
      }

      status = await esperarActivacionTablaCreada(a.NOMBRETABLAPRUEBASGSI, this);
      console.log('Tabla activa');
      assert.equal(status, 'ACTIVE');
    });


    it('Añadiendo desde Objeto item en tabla con GSI', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASGSI, 'Key', null);

      let okOrKo = await d.addItemFromObject(a.SORTITEM1);
      okOrKo = await d.addItemFromObject(a.SORTITEM2);
      okOrKo = await d.addItemFromObject(a.SORTITEM3);
      okOrKo = await d.addItemFromObject(a.SORTITEM4);
      okOrKo = await d.addItemFromObject(a.SORTITEM5);
      console.log("add result: " + JSON.stringify(okOrKo));
      assert.equal(okOrKo.Key, a.SORTITEM5.Key);
    });


    it('getItemsByGSI(=1995)', async () => {
      let d = new Dynamola(a.NOMBRETABLAPRUEBASGSI, 'Key', 'SortKey');
      const okOrKo = await d.getItemsByGSI('1995', 'Gsi-index','SortKey');

      assert.equal(okOrKo.length, 2);
      assert.equal(okOrKo[0].SortKey, '1995');
      assert.equal(okOrKo[1].SortKey, '1995');
    });

    after(function () {
      const dynamodb = new AWS.DynamoDB();
      dynamodb.deleteTable({ TableName: a.NOMBRETABLAPRUEBASGSI }, function (err, data) {
        if (err) {
          console.error(`Unable to delete table "${a.NOMBRETABLAPRUEBASGSI}". Error JSON:`,
            JSON.stringify(err, null, 2));
        } else {
          console.log(`Deleted table "${a.NOMBRETABLAPRUEBASGSI}"`);
        }

        assert.equal(data.TableDescription.TableName, a.NOMBRETABLAPRUEBASGSI);
      });
    });
  })
})
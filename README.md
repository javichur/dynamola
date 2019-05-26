# dynamola

DynamoDB easy library for Lambda functions.

## Ejemplo de uso

```

const Dynamola = require('dynamola');
let myDb = new Dynamola("nombre-tabla-en-dynamodb", "nombre-primary-key-en-dynamodb", null);

myDb.getItem(userID).then((data) => {
    if(!data){
        // item no existe
    }
    else {
        // item devuelto OK
    }
})
.catch((err) => {
    // error al acceder a dynamodb
});
```
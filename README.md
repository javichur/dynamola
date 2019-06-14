# dynamola

 [![NPM Version](https://img.shields.io/npm/v/dynamola.svg?style=flat)](https://npmjs.org/package/dynamola)

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

## Configuración inicial

1. Crea tu tabla DynamoDB desde https://console.aws.amazon.com/dynamodb, indicando nombre de la tabla, nombre de la clave de partición (Partition Key) y opcionalmente el nombre de la clave de ordenación (Sort Key).

2. Opciones de acceso:
a. Si vas a acceder a la tabla DynamoDB desde AWS (por ejemplo, desde una función AWS Lambda), crea una política de seguridad (https://console.aws.amazon.com/iam/home#/policies), que tenga acceso limitado a tu tabla DynamoDB. A continuación, añade la política recién creada al rol de ejecución de la función AWS Lambda (https://console.aws.amazon.com/iam/home?#/roles).Ejemplo de política de seguridad:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:UpdateItem"
            ],
            "Resource": "<ARN de tu tabla DynamoDB>"
        }
    ]
}
```

b. Si quieres acceder a la tabla DynamoDB desde fuera de Amazon Web Services, puedes utilizar un fichero de credenciales compartidas (https://docs.aws.amazon.com/es_es/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html). Este método se usa por ejemplo en los tests de este módulo.

## Conceptos

1. Clave de Partición (Partition Key).
2. Clave de Ordenación (Sort Key).
3. Clave Principal Simple (Simple Primary Key). Formada solo por Clave de Partición.
4. Clave Principal Compuesta (Composite Primary Key). Formada por una Clave de Partición y una Clave de Ordenación.

## Proyectos de ejemplo que usa Dynamola para leer y escribir en DynamoDB de AWS

https://github.com/javichur/Alexa-Skill-Lavaplatos

https://github.com/javichur/alexa-skill-nevera-estado/
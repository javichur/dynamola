module.exports = {
    NOMBRETABLAPRUEBAS: 'tablaprueba',
    ITEM1: {
        Key: 'item1',
        otroAtributo: 'valor otro atributo',
        atributoNum: 25
    },
    ITEM2: {
        Key: 'casa',
        otroAtributo: 'la la la',
        atributoNum: 2
    },
    ITEM3: {
        Key: 'coche',
        otroAtributo: 'motor',
        atributoNum: 3
    },
    NOMBRETABLAPRUEBASCOMPUESTA: 'tablapruebacompuesta',
    /* Escenario en los items para tabla con Clave Principal Compuesta:
    - SORTITEM1 y SORTITEM2 tienen misma Clave Partición.
    - SORTITEM2 y SORTITEM3 tienen misma Clave de Ordenación.
     */
    SORTITEM1: {
        Key: 'user1',
        SortKey:'1990',
        otroAtributo: 'motor',
        atributoNum: 3,
        Lsi: 5
    },
    SORTITEM2: {
        Key: 'user1',
        SortKey:'1995',
        otroAtributo: 'verde',
        atributoNum: 5,
        Lsi: 5
    },
    SORTITEM3: {
        Key: 'user2',
        SortKey:'1995',
        otroAtributo: 'rojo',
        atributoNum: 30,
        Lsi: 5
    },
    SORTITEM4: {
        Key: 'user1',
        SortKey:'1993',
        otroAtributo: 'amarillo',
        atributoNum: 3,
        Lsi: 4
    },
    NOMBRETABLAPRUEBASLSI: 'tablapruebaLSI',
};
# Test Autoescuela

Test Autoescuela, una Skill para Amazon Alexa, publicada en https://www.amazon.es/Javier-Campos-Test-autoescuela/dp/B07L8JGTG7

Código fuente traducido a castellano y con comentarios "extra".

Siénte libre para utilizar este proyecto como punto de partida para crear tu Skill de tipo Quiz / Trivial / preguntas y respuestas.

## Configuración

Para reutilizar esta skill, recuerda hacer estos cambios:

1. En el fichero '/lambda/custom/package.json', editar 'name', 'description' y 'author'.
2. En el fichero del modelo (/models/es-ES.json), editar 'invocationName'.
3. En los ficheros de strings '/lambda/custom/strings/', editar las constantes que aparecen. Sobretodo 'SKILL_NAME'.
4. Añade tus preguntas y respuestas en los ficheros '/lambda/custom/strings/preguntas-*.js'.

## Otras consideraciones

1. Desde noviembre 2019, este proyecto utiliza como base el template <https://github.com/javichur/alexa-skill-clean-code-template>, el cual facilita el trabajo con multitud de utilidades como:

- [x] Load and save info from/to session (LoadSessionIntent, SaveSessionIntent).
- [x] Load and save data from/to Dynamodb (LoadDynamoDBIntent, SaveDynamoDBIntent).
- [x] Using external APIs (UseApiIntent).
- [x] Get user info like name, email or phone (CheckPermisionsIntent).
- [x] Using built-in slots (ColorIntent).
- [x] APL touch support (ListadoItemSelected).

2. Al configurar tu función Lambda en AWS, recuerda habilitar que solo pueda ser invocada por el APPLICATION_ID de tu Skill. Esde ID lo obtendrás en https://developer.amazon.com/alexa/console/ask
3. Esta versión está preparada para preguntas con 3 opciones posibles (A, B y C), pero es fácil modificarla para añadir más.

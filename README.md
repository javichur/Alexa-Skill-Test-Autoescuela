# Test Autoescuela
Test Autoescuela, una Skill para Amazon Alexa, publicada en https://www.amazon.es/Javier-Campos-Test-autoescuela/dp/B07L8JGTG7

Código fuente traducido a castellano y con comentarios "extra" para fines educativos.

Siénte libre para utilizar este proyecto como punto de partida para crear tu Skill de tipo Quiz / Trivial / preguntas y respuestas.

## Configuración
Para reutilizar esta skill, recuerda hacer estos cambios:
1. En el fichero 'package.json', editar 'name', 'description' y 'author'.
2. En el fichero del modelo (modelo/es-ES.json), editar 'invocationName'.
3. En el fichero 'index.js', editar las constantes que aparecen al inicio. Sobretodo 'SKILL_NAME'.
4. Añade tus preguntas y respuestas en el fichero 'preguntas.js'.

## Otras consideraciones
1. Al configurar tu función Lambda en AWS, recuerda habilitar que solo pueda ser invocada por el APPLICATION_ID de tu Skill. Esde ID lo obtendrás en https://developer.amazon.com/alexa/console/ask
2. Esta versión está preparada para preguntas con 3 opciones posibles (A, B y C), pero es fácil modificarla para añadir más.

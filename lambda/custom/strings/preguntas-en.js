/* Extracto del listado de preguntas para la skill. 
 * Completar con más preguntas.
 * El formato es heredado de otro proyecto.
 * Si el nº total de preguntas es elevado, considerar utilizar base de datos.
*/
module.exports = {
  PREGUNTAS: [
    {
      id: 1,
      imagen: 'http://revista.dgt.es/Galerias/test/N-244/Test244-P1.jpg',
      texto: 'On the motorways, what is the minimum speed allowed for passenger cars?',
      respuestas: [
        {
          respuesta: '40 km/h.',
          correcta: false,
        },
        {
          respuesta: '50 km/h.',
          correcta: false,
        },
        {
          respuesta: '60 km/h.',
          correcta: true,
        },
      ],
    },
    {
      id: 2,
      imagen: 'http://revista.dgt.es/Galerias/test/N-244/Test244-P2.jpg',
      texto: 'When starting a gasoline engine, it is convenient...',
      respuestas: [
        {
          respuesta: 'Accelerate empty to warm up as soon as possible.',
          correcta: false,
        },
        {
          respuesta: 'Start the route immediately after starting the engine.',
          correcta: true,
        },
        {
          respuesta: 'Wait a few minutes before starting the route so that the engine warms up.',
          correcta: false,
        },
      ],
    },
  ],
};

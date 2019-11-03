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
      texto: 'En las autovías, ¿cuál es la velocidad mínima permitida para turismos?',
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
      texto: 'Al poner en marcha un motor de gasolina, es conveniente...',
      respuestas: [
        {
          respuesta: 'Acelerar en vacío para que se caliente cuanto antes.',
          correcta: false,
        },
        {
          respuesta: 'Iniciar la marcha inmediatamente después de arrancar el motor.',
          correcta: true,
        },
        {
          respuesta: 'Esperar unos minutos antes de iniciar la marcha para que el motor se caliente.',
          correcta: false,
        },
      ],
    }
  ]
};
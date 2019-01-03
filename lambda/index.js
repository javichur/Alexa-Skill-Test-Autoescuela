/* eslint-disable  func-names */
/* eslint-disable  no-console */

/* Skill "Test Autoescuela" para Alexa Amazon.
 * Creada por Javier Campos (https://javiercampos.es).
 * Código fuente traducido a castellano y con comentarios "extra" para fines educativos.
 * Siénte libre para utilizar este proyecto como punto de partida para crear tu Skill de tipo Quiz / Trivial / preguntas y respuestas.
*/

/* 1. Cargamos las dependencias y las preguntas. */
const Alexa = require('ask-sdk');
const preguntas = require('./preguntas');

/* 2. Constantes */
const skillBuilder = Alexa.SkillBuilders.standard();
const PREGUNTAS = preguntas.PREGUNTAS_ES_ES;
const SKILL_NAME = 'Test Autoescuela';
const WELCOME_MESSAGE = '¡Bienvenido a ' + SKILL_NAME + '! Voy a hacerte preguntas para que practiques el examen de permiso B de conducir. Las preguntas se han extraído de la web de la DGT en 2018. Contesta a las preguntas diciendo A, B o C. ¡Empezamos!';
const WELCOME_REPROMPT = 'Contesta a las preguntas diciendo A, B o C. Para recibir ayuda, por favor di ayuda. Para salir, di salir.';
const DISPLAY_CARD_TITLE = SKILL_NAME;
const HELP_MESSAGE = 'Voy a hacerte preguntas para que practiques el examen de permiso B de conducir. Las preguntas se han extraído de la web de la DGT en 2018. Contesta a la última pregunta diciendo A,B o C. También puedes salir. ¿Qué respondes?';
const HELP_REPROMPT = HELP_MESSAGE;
const STOP_MESSAGE = '<say-as interpret-as="interjection">Hasta luego</say-as>';
const NO_ENTIENDO_REPITE_POR_FAVOR = '<say-as interpret-as="interjection">¿cómorr?</say-as>. Lo siento, no te he entendido. Repite por favor.';


/* 3. Manejadores */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {        

    const item = obtenerPreguntaAleatoriaYGuardarlaEnSesion(handlerInput);
    
    let ret = "Pregunta: " + preguntaToString(item);

    return handlerInput.responseBuilder
      .speak(WELCOME_MESSAGE + " " + ret)
      .reprompt(WELCOME_REPROMPT + " " + ret) /* usamos 'reprompt' para que la skill se quede esperando respuesta del usuario. */
      .getResponse();
  },
};


const RespuestaHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'RespuestaIntent';
  },
  handle(handlerInput) {    
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const itemSlot = handlerInput.requestEnvelope.request.intent.slots.respuesta;
    
    let itemNameMatched = "nada";  // lo que matchea con la respuesta dada por el usuario (A, B o C).
        
    if (itemSlot && itemSlot.resolutions && 
      itemSlot.resolutions.resolutionsPerAuthority) {
        /* Guardamos la opción elegida por el usuario (A, B o C); no lo que ha pronunciado. 
           Es decir, sí ha pronunciado "be" lo que nos guardamos es "B". 
           Esto lo podemos hacer porque a la hora de crear el modelo, hemos definido "be" como sinónimo de "B".
        */
        itemNameMatched = itemSlot.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    }
    else{
        // caso no posible. El intent de tipo RespuestaIntent llevará un value.
    }


    if (itemSlot && itemSlot.value) {
      let index = -1; // índice de la opción escogida en el array de respuestas (A=0; B=1; C=2)
      if(itemNameMatched == "A") index = 0;
      else if(itemNameMatched == "B") index = 1;
      else if(itemNameMatched == "C") index = 2;
      else{        
        return handlerInput.responseBuilder
          .speak("Respuesta no válida. Contesta con A, B o C.")
          .withSimpleCard(DISPLAY_CARD_TITLE)
          .reprompt(HELP_REPROMPT)
          .getResponse();
      }
      
      /* si la respuesta elegida es la correcta... */
      if(sessionAttributes.lastPregunta.respuestas[index].correcta == true){
        
        var item = obtenerPreguntaAleatoriaYGuardarlaEnSesion(handlerInput); // obtener la siguiente pregunta
        
        return handlerInput.responseBuilder
          .speak("¡Respuesta Correcta! Siguiente pregunta: " + preguntaToString(item))
          .withSimpleCard(DISPLAY_CARD_TITLE)
          .reprompt(HELP_REPROMPT)
          .getResponse();
      }
      else{ /* si la respuesta escogida NO es la correcta... */
        return handlerInput.responseBuilder
          .speak("Respuesta incorrecta. No es la " + itemNameMatched + ". Vuelve a intentarlo. " + preguntaToString(sessionAttributes.lastPregunta))
          .withSimpleCard(DISPLAY_CARD_TITLE)
          .reprompt(HELP_REPROMPT)
          .getResponse();
      }      
    }
  }
};


const HelpHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {    
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};


const ExitHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent');
  },
  handle(handlerInput) {    
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      /* para que la skill se cierre y no se quede esperando al usuario, ahora no usamos 'reprompt' */
      .getResponse();
  },
};


const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    console.log("Inside SessionEndedRequestHandler");
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  },
};


const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`); // imprimiremos el error por consola    
    
    return handlerInput.responseBuilder
      .speak(NO_ENTIENDO_REPITE_POR_FAVOR)
      .reprompt(NO_ENTIENDO_REPITE_POR_FAVOR)
      .getResponse();
  },
};


/* 4. Métodos adicionales */

/**
  * @desc convierte una pregunta (enunciado y sus 3 opciones) en una única cadena de texto
  * @param pregunta $pregunta
  * @return string - texto listo para ser pronunciado por Alexa, incluye pregunta final.
*/
function preguntaToString(pregunta){
    let ret = pregunta.texto;
    ret += " A: " + pregunta.respuestas[0].respuesta + " ";
    ret += "B: " + pregunta.respuestas[1].respuesta + " ";
    ret += "C: " + pregunta.respuestas[2].respuesta + " ";

    /* Importante terminar con una pregunta, para que el usuario sepa 
    que tiene que contestar y para que Amazon certifique la Skill. */
    ret += "¿Qué letra eliges?";
    
    return ret;
  }


/**
  * @desc devuelve un item aleatorio del array
  * @param array $arrayOfItems
  * @return object - item aleatorio.
*/
function getRandomItem(arrayOfItems) {
  let i = 0;
  i = Math.floor(Math.random() * arrayOfItems.length);
  return (arrayOfItems[i]);
};

/**
  * @desc selecciona aleatoriamente, guarda en sesión y devuelve una pregunta aleatoria
  * @param object handlerInput
  * @return object - la pregunta escogida aleatoriamente.
*/
function obtenerPreguntaAleatoriaYGuardarlaEnSesion(handlerInput){

    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    var item = getRandomItem(PREGUNTAS); // obtiene una pregunta aleatoriamente.
    sessionAttributes.lastPregunta = item; // guarda la pregunta en la sesión del usuario.
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    
    return item;
}


/* 5. Configuración de Lambda */
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    RespuestaHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

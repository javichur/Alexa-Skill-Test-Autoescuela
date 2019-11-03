/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable global-require */

/* Skill "Test Autoescuela" para Alexa Amazon.
 * Creada por Javier Campos (https://javiercampos.es).
 * Código fuente traducido a castellano y con comentarios "extra" para fines educativos.
 * Siénte libre para utilizar este proyecto como punto de partida para crear tu Skill de
 * tipo Quiz / Trivial / preguntas y respuestas.
*/

/* 1. Cargamos las dependencias y las preguntas. */
const Alexa = require('ask-sdk-core');
const Dynamola = require('dynamola');
const Settings = require('./settings.js');

const db = new Dynamola(Settings.TABLE_NAME_DYNAMODB, Settings.PARTITION_KEY_NAME, null);

const myDocumentPregunta = require('./apl/documentPregunta.json');
const myDatasourcePregunta = require('./apl/myDataSourcePregunta');

// GlobalHandlers: ErrorHandler, SessionEndedRequestHandler...
const GlobalHandlers = require('./handlers/globalHandlers.js');

/* 2. Cadenas e idioma */
let t = null; // cadenas de texto localizadas. Se inicializa en myLocalizationInterceptor()
let langSkill = null; // current language ('es-ES', 'en-US', 'en', etc...)
let PREGUNTAS = null; // Se inicializa en myLocalizationInterceptor()

/* 3. Funciones adicionales */
/**
  * @desc convierte una pregunta (enunciado y sus N opciones) en una única cadena de texto
  * @param pregunta $pregunta
  * @return string - texto listo para ser pronunciado por Alexa, incluye pregunta final.
*/
function preguntaToString(pregunta) {
  let ret = `${pregunta.texto} `;
  for (let i = 0; i < pregunta.respuestas.length; i += 1) {
    ret += `${String.fromCharCode('A'.charCodeAt() + i)}: ${pregunta.respuestas[i].respuesta} `;
  }

  /* Importante terminar con una pregunta, para que el usuario sepa
    que tiene que contestar y para que Amazon certifique la Skill. */
  ret += t.QUE_LETRA_ELIGES;

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
}


async function actualizarBBDD(userId, arrayFalladosSession) {
  const attr = {};
  attr[Settings.INFO_ATTR_NAME] = arrayFalladosSession;

  return db.updateItem(userId, attr);
}

async function actualizarIdsFalladosUltimaVezEnSessionYBBDD(userId, arrayFalladosSession, idPregunta, acertadaQ) {
  const i = arrayFalladosSession.indexOf(idPregunta);

  if (acertadaQ) {
    if (i !== -1) {
      arrayFalladosSession.splice(i, 1);
      await actualizarBBDD(userId, arrayFalladosSession);
    }
  } else if (i === -1) {
    arrayFalladosSession.unshift(idPregunta);
    await actualizarBBDD(userId, arrayFalladosSession);
  }
}


/**
  * @desc guarda en sesión la pregunta y devuelve una pregunta en responseBuilder (soporte APL)
  * @param object item - la pregunta
  * @param object handlerInput
  * @param prefijoSpeak - texto que se lee antes de la pregunta.
  * @param prefijoReprompt - texto que se lee antes de la pregunta en el repromt.
  * @param letraEnRojo - letra de la respuesta que debe aparecer en color rojo.
  * @return object - la pregunta escogida aleatoriamente.
*/
function guardarPreguntaEnSesionYDevolverResponseBuilder(item, handlerInput, prefijoSpeak, prefijoReprompt, letraEnRojo) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

  sessionAttributes.lastPregunta = item; // guarda la pregunta en la sesión del usuario.
  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

  const strPregunta = preguntaToString(item);

  if (handlerInput.requestEnvelope.context.System.device.supportedInterfaces['Alexa.Presentation.APL']) { /* si hay soporte APL... */
    myDatasourcePregunta.preguntaData.title = t.SKILL_NAME;
    myDatasourcePregunta.preguntaData.hintText = t.HINT_TEXT;

    myDatasourcePregunta.preguntaData.image = item.imagen;
    myDatasourcePregunta.preguntaData.enunciado = item.texto;
    myDatasourcePregunta.preguntaData.respuestaA = item.respuestas[0].respuesta;
    myDatasourcePregunta.preguntaData.respuestaB = item.respuestas[1].respuesta;
    myDatasourcePregunta.preguntaData.respuestaC = item.respuestas[2].respuesta;

    myDatasourcePregunta.preguntaData.colorA = (letraEnRojo === 'A') ? '@colorRed800' : '@colorGray800';
    myDatasourcePregunta.preguntaData.colorB = (letraEnRojo === 'B') ? '@colorRed800' : '@colorGray800';
    myDatasourcePregunta.preguntaData.colorC = (letraEnRojo === 'C') ? '@colorRed800' : '@colorGray800';

    myDatasourcePregunta.preguntaData.alerta = (sessionAttributes.idsFalladosUltimaVez.includes(item.id)
      && sessionAttributes.idLastPreguntaFallada !== item.id) ? t.ALERTA_PREGUNTA : null;

    if (letraEnRojo != null) myDatasourcePregunta.preguntaData.respuestaDichaPorUsuarioIncorrecta = `'${letraEnRojo}' ${t.ESTA_MAL}`;
    else myDatasourcePregunta.preguntaData.respuestaDichaPorUsuarioIncorrecta = null;


    return handlerInput.responseBuilder
      .speak(prefijoSpeak + strPregunta)
      .reprompt(prefijoReprompt + strPregunta)
      .addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        version: '1.0',
        document: myDocumentPregunta,
        datasources: myDatasourcePregunta,
      })
      .getResponse();
  }
  /* Si no hay soporte APL... */
  return handlerInput.responseBuilder
    .speak(prefijoSpeak + strPregunta)
    .reprompt(prefijoReprompt + strPregunta) /* usamos 'reprompt' para que la skill se quede esperando respuesta del usuario. */
    .getResponse();
}


function mostrarStats(handlerInput) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

  const txt = `${t.TUS_STATS} ${sessionAttributes.totalAciertos} ${t.STATS_LEYENDA_2}. ${
    +sessionAttributes.totalFallos} ${t.STATS_LEYENDA_3}. ${t.DI_ATRAS_PARA_VOLVER}`;

  if (handlerInput.requestEnvelope.context.System.device.supportedInterfaces['Alexa.Presentation.APL']) { /* si hay soporte APL... */
    const myDocumentStats = require('./apl/documentStats.json');
    const myDatasourceStats = require('./apl/myDataSourceStats');


    let paciertos = 0;
    let pfallos = 0;
    if (sessionAttributes.totalPreguntasContestadas === 0) {

    } else {
      paciertos = (sessionAttributes.totalAciertos * 100 / sessionAttributes.totalPreguntasContestadas).toFixed(0);
      pfallos = (sessionAttributes.totalFallos * 100 / sessionAttributes.totalPreguntasContestadas).toFixed(0);
    }

    myDatasourceStats.statsData.title = t.SKILL_NAME;
    myDatasourceStats.statsData.enunciadoStats = t.TUS_STATS;
    myDatasourceStats.statsData.hintText = t.HINT_VOLVER;

    myDatasourceStats.statsData.leyenda1 = t.STATS_LEYENDA_1;
    myDatasourceStats.statsData.valor1 = `${sessionAttributes.totalPreguntasContestadas} (100%)`;
    myDatasourceStats.statsData.ancho1 = '100%';

    myDatasourceStats.statsData.leyenda2 = t.STATS_LEYENDA_2;
    myDatasourceStats.statsData.valor2 = `${sessionAttributes.totalAciertos} (${paciertos}%)`;
    myDatasourceStats.statsData.ancho2 = `${paciertos}%`;

    myDatasourceStats.statsData.leyenda3 = t.STATS_LEYENDA_3;
    myDatasourceStats.statsData.valor3 = `${sessionAttributes.totalFallos} (${pfallos}%)`;
    myDatasourceStats.statsData.ancho3 = `${pfallos}%`;

    return handlerInput.responseBuilder
      .speak(txt)
      .reprompt(txt)
      .addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        version: '1.0',
        document: myDocumentStats,
        datasources: myDatasourceStats,
      })
      .getResponse();
  }
  /* Si no hay soporte APL... */
  return handlerInput.responseBuilder
    .speak(txt)
    .reprompt(txt)
    .getResponse();
}

// Initialize 't' and 'langSkill' with user language or default language.
const myLocalizationInterceptor = {
  process(handlerInput) {
    const langUser = handlerInput.requestEnvelope.request.locale;

    if (langUser) {
      try {
        t = require(`./strings/${langUser}.js`); // eslint-disable-line import/no-dynamic-require
        langSkill = langUser;
        PREGUNTAS = require(`./strings/preguntas-${langSkill}`).PREGUNTAS; // eslint-disable-line import/no-dynamic-require
        return;
      } catch (e) {
        // console.log(`Error reading strings. langUser: ${langUser}`);
      }

      const lang = langUser.split('-')[0];
      try {
        t = require(`./strings/${lang}.js`); // eslint-disable-line import/no-dynamic-require
        langSkill = lang;
        PREGUNTAS = require(`./strings/preguntas-${langSkill}`).PREGUNTAS; // eslint-disable-line import/no-dynamic-require
        return;
      } catch (e) {
        // console.log(`Error reading strings. lang: ${lang}`);
      }
    }

    // default lang
    langSkill = Settings.DEFAULT_LANGUAGE;
    t = require(`./strings/${langSkill}.js`); // eslint-disable-line import/no-dynamic-require
    PREGUNTAS = require(`./strings/preguntas-${langSkill}`).PREGUNTAS; // eslint-disable-line import/no-dynamic-require
  },
};

/* Devuelve los ids de las preguntas que ha fallado el usuario, en un array, se obtiene de DynamoDB.
   Si el usuario falla una pregunta pero luego la acierta, dicho ID ya no aparecerá aquí.
*/
async function devolverIdsFalladosUltimaVezDesdeBBDD(userId) {
  return db.getItem(userId).then((data) => {
    if (!data) {
      // console.log('getItem devuelve nada.');
      return [];
    }
    return data[Settings.INFO_ATTR_NAME];
  })
    .catch(err =>
      // console.log(`Error en getItem: ${err}`);
      []);
}

/* 4. Manejadores de intents */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.idLastPreguntaFallada = -1;
    sessionAttributes.totalPreguntasContestadas = 0; // inicializar contadores de preguntas/aciertos/fallos
    sessionAttributes.totalAciertos = 0;
    sessionAttributes.totalFallos = 0;
    sessionAttributes.idsFalladosUltimaVez = await devolverIdsFalladosUltimaVezDesdeBBDD(handlerInput.requestEnvelope.context.System.user.userId);
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    const item = getRandomItem(PREGUNTAS); // obtiene una pregunta aleatoriamente.
    return guardarPreguntaEnSesionYDevolverResponseBuilder(item, handlerInput, `${t.WELCOME_MESSAGE} ${t.LA_PREGUNTA}`, `${t.WELCOME_REPROMPT} ${t.LA_PREGUNTA}`, null);
  },
};


async function procesarRespuesta(itemNameMatched, sessionAttributes, handlerInput) {
  if (itemNameMatched) {
    // índice de la opción escogida en el array de respuestas (A=0; B=1; C=2, etc...)
    const index = itemNameMatched.charCodeAt() - 'A'.charCodeAt();

    if (itemNameMatched.length !== 1 || sessionAttributes.lastPregunta.respuestas.length < (index + 1)) { // si no existe la respuesta seleccionada...
      return guardarPreguntaEnSesionYDevolverResponseBuilder(sessionAttributes.lastPregunta, handlerInput,
        `${t.RESPUESTA_INCORRECTA}. '${itemNameMatched}' ${t.NO_EXISTE_EN_ESTA_PREGUNTA}. ${t.VUELVE_A_INTENTARLO}. `, t.LA_PREGUNTA, null);
    }
    if (sessionAttributes.lastPregunta.respuestas[index].correcta === true) { /* si la respuesta elegida es la correcta... */
      if (sessionAttributes.idLastPreguntaFallada !== sessionAttributes.lastPregunta.id) {
        sessionAttributes.totalPreguntasContestadas += 1; // contar respuesta y acierto, solo 1 vez por pregunta y turno
        sessionAttributes.totalAciertos += 1;

        sessionAttributes.idLastPreguntaFallada = -1;

        // borro la pregunta de la lista de preguntas falladas solo si la ha acertado a la primera en este turno.
        await actualizarIdsFalladosUltimaVezEnSessionYBBDD(handlerInput.requestEnvelope.context.System.user.userId,
          sessionAttributes.idsFalladosUltimaVez, sessionAttributes.lastPregunta.id, true);
      }
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
      const item = getRandomItem(PREGUNTAS); // obtiene una pregunta aleatoriamente.
      return guardarPreguntaEnSesionYDevolverResponseBuilder(item, handlerInput, `${t.RESPUESTA_CORRECTA} ${t.NEXT_QUESTION} `, t.LA_PREGUNTA, null);
    }
    /* si la respuesta escogida NO es la correcta... */

    if (sessionAttributes.idLastPreguntaFallada !== sessionAttributes.lastPregunta.id) { // optimización: si usuario falla > 1 vez seguidas la misma pregunta, lo guardo solo 1 vez.
      sessionAttributes.totalPreguntasContestadas += 1; // contar respuesta y fallo, solo 1 vez por pregunta y turno
      sessionAttributes.totalFallos += 1;

      sessionAttributes.idLastPreguntaFallada = sessionAttributes.lastPregunta.id;

      await actualizarIdsFalladosUltimaVezEnSessionYBBDD(handlerInput.requestEnvelope.context.System.user.userId,
        sessionAttributes.idsFalladosUltimaVez, sessionAttributes.lastPregunta.id, false);
    }

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return guardarPreguntaEnSesionYDevolverResponseBuilder(sessionAttributes.lastPregunta, handlerInput,
      `${t.RESPUESTA_INCORRECTA}. ${t.LETRA} "${itemNameMatched}" <break time="50ms"/><emphasis level="strong">${t.ESTA_MAL}</emphasis>. ${t.VUELVE_A_INTENTARLO}. `, t.LA_PREGUNTA, itemNameMatched);
  }
  // si usuario ha contestado con algo raro que no hace match con "A", "B", etc...
  return guardarPreguntaEnSesionYDevolverResponseBuilder(sessionAttributes.lastPregunta, handlerInput,
    `${t.NO_ENTIENDO_REPITE_POR_FAVOR} `, t.LA_PREGUNTA, null);
}


const RespuestaHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RespuestaIntent';
  },
  async handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const itemSlot = handlerInput.requestEnvelope.request.intent.slots.respuesta;

    let itemNameMatched = 'nada'; // lo que matchea con la respuesta dada por el usuario (A, B, C...).

    if (itemSlot && itemSlot.resolutions
      && itemSlot.resolutions.resolutionsPerAuthority
      && itemSlot.resolutions.resolutionsPerAuthority[0].values
      && itemSlot.resolutions.resolutionsPerAuthority[0].values[0].value.name
    ) {
      /* Guardamos la opción elegida por el usuario (A, B, C...); no lo que ha pronunciado.
           Es decir, sí ha pronunciado "be" lo que nos guardamos es "B".
           Esto lo podemos hacer porque a la hora de crear el modelo, hemos definido "be" como sinónimo de "B".
        */
      itemNameMatched = itemSlot.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    } else {
      // caso posible si no hay match.
      itemNameMatched = null;
    }

    return procesarRespuesta(itemNameMatched, sessionAttributes, handlerInput);
  },
};


const NextHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NextIntent';
  },
  handle(handlerInput) {
    const item = getRandomItem(PREGUNTAS); // obtiene una pregunta aleatoriamente.
    return guardarPreguntaEnSesionYDevolverResponseBuilder(item, handlerInput, t.NEXT_QUESTION, t.LA_PREGUNTA, null); // obtener la siguiente pregunta
  },
};


const RepeatHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'VolverIntent');
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    return guardarPreguntaEnSesionYDevolverResponseBuilder(sessionAttributes.lastPregunta, handlerInput, t.REPITO_LA_PREGUNTA, t.LA_PREGUNTA, null);
  },
};


const HelpHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    if (handlerInput.requestEnvelope.context.System.device.supportedInterfaces['Alexa.Presentation.APL']) { /* si hay soporte APL... */
      const myDocumentHelp = require('./apl/documentHelp.json');
      const myDatasourceHelp = require('./apl/myDataSourceHelp');

      myDatasourceHelp.helpData.title = t.SKILL_NAME;
      myDatasourceHelp.helpData.hintText = t.HINT_TEXT;
      myDatasourceHelp.helpData.enunciadoAyuda = t.ENUNCIADO_HELP;
      myDatasourceHelp.helpData.otrasSkillsRecomendadas = t.OTRAS_SKILLS;


      return handlerInput.responseBuilder
        .speak(t.HELP_MESSAGE)
        .reprompt(t.HELP_MESSAGE)
        .addDirective({
          type: 'Alexa.Presentation.APL.RenderDocument',
          version: '1.0',
          document: myDocumentHelp,
          datasources: myDatasourceHelp,
        })
        .getResponse();
    }
    /* Si no hay soporte APL... */
    return handlerInput.responseBuilder
      .speak(t.HELP_MESSAGE)
      .reprompt(t.HELP_MESSAGE)
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
      .speak(t.STOP_MESSAGE)
      .withShouldEndSession(true)
      /* para que la skill se cierre y no se quede esperando al usuario, ahora no usamos 'reprompt' */
      .getResponse();
  },
};


const StatsHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'StatsIntent');
  },
  handle(handlerInput) {
    return mostrarStats(handlerInput);
  },
};


const EventHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent';
  },
  async handle(handlerInput) {
    const args = handlerInput.requestEnvelope.request.arguments;
    const event = args[0];
    const itemNameMatched = args[1];

    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    switch (event) {
      case 'contestarPreguntaEvent':
        return procesarRespuesta(itemNameMatched, sessionAttributes, handlerInput);
      case 'botonStatsClickEvent':
        return mostrarStats(handlerInput);
      case 'backEvent':
        return guardarPreguntaEnSesionYDevolverResponseBuilder(sessionAttributes.lastPregunta, handlerInput, t.REPITO_LA_PREGUNTA, t.LA_PREGUNTA, null);
      default:
        // Caso imposible.
        return null;
    }
  },
};


/* 5. Configuración de Lambda */
const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    RespuestaHandler,
    NextHandler,
    RepeatHandler,
    HelpHandler,
    ExitHandler,
    EventHandler,
    StatsHandler,
    GlobalHandlers.SessionEndedRequestHandler,
    GlobalHandlers.IntentReflectorHandler, // last
  )
  .addRequestInterceptors(myLocalizationInterceptor)
  .addErrorHandlers(GlobalHandlers.ErrorHandler)
  .lambda();

var TelegramBot = require('node-telegram-bot-api');
var bot = new TelegramBot(BOT_TOKEN, {polling: true});

var dates = [
	"Lunes 13:00",
	"Lunes 14:00",
	"Lunes 15:00",
	"Lunes 16:00",
	"Martes 13:00",
	"Martes 14:00",
	"Martes 15:00",
	"Martes 16:00",
	"Miercoles 13:00",
	"Miercoles 14:00",
	"Miercoles 15:00",
	"Miercoles 16:00",
	"Jueves 13:00",
	"Jueves 14:00",
	"Jueves 15:00",
	"Jueves 16:00",
	"Viernes 13:00",
	"Viernes 14:00",
	"Viernes 15:00",
	"Viernes 16:00"
	];

var registro = {};

function getRandomArbitrary(minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum) + minimum);
}

var sendMessage = function(chatId,text,replyTo) {
	bot.sendMessage(chatId, text, replyTo ? {
		reply_to_message_id:replyTo, reply_markup:JSON.stringify({force_reply:false, selective:true})
	} : {});
};

var datesKeyboard = function() {
	var keyboard = [["Ocultar teclado"]];
	for (var i = 0; i < dates.length; i++) {
		var date1 = dates[i] + " 1ª Semana";
		var date2 = dates[i] + " 2ª Semana";
		keyboard.push([date1, date2]);
	}
	return keyboard;
};

var deleteDate = function (user, register, date) {
	if(register.fechas.length==0){
		return "No has elegido nada!! 🙈";
	}
	for (var i = 0; i < register.fechas.length; i++){
		if (register.fechas[i].fecha.search(date) == 0) {
			for (var j = 0; j < register.fechas[i].usuarios.length; j++) {
				if (register.fechas[i].usuarios[j] === user) {
					register.fechas[i].usuarios.splice(j, 1);
				}
			}
		}
	}
	return "Fechas borradas!! 💪"
}

var selectDateAndMore = function(register) {
	if(register.fechas.length==0){
		return "Nadie ha elegido nada!! 😡";
	}
	var message = "";
	var f = register.fechas[0];
	for (var i = 1; i < register.fechas.length; i++) {
		if (f.usuarios.length < register.fechas[i].usuarios.length) {
			f = register.fechas[i];
		}
	}
	message += "\nFecha: " + f.fecha + "\n";
	message += "Acta: " + f.usuarios[getRandomArbitrary(0, f.usuarios.length)] + "\n";
	message += "Resumen: " + f.usuarios[getRandomArbitrary(0, f.usuarios.length)] + "\n";
	message += "\nPuntos del dia: \n";
	for (var i = 0; i < register.puntos.length; i++) {
		message += (i+1) + ") " + register.puntos[i] + "\n";
	}
	message += (register.puntos.length + 1) +") Otros";
	return message;
}

var resumen = function(register) {
	if(register.fechas.length==0){
		return "Nadie ha elegido nada!! 😡";
	}

	var top = [register.fechas[0]];
	var message = "El top de fechas es:\n";
	for (var i = 1; i < register.fechas.length; i++) {
		var f = register.fechas[i];
		if (f.usuarios.length > top[0].usuarios.length) {
			top[4] = top[3];
			top[3] = top[2];
			top[2] = top[1];
			top[1] = top[0];
			top[0] = f;
		} else if (top[1] == null || f.usuarios.length > top[1].usuarios.length) {
			top[4] = top[3];
			top[3] = top[2];
			top[2] = top[1];
			top[1] = f;
		} else if (top[2] == null || f.usuarios.length > top[2].usuarios.length) {
			top[4] = top[3];
			top[3] = top[2];
			top[2] = f;
		} else if (top[3] == null || f.usuarios.length > top[3].usuarios.length) {
			top[4] = top[3];
			top[3] = f;
		} else if (top[4] == null || f.usuarios.length > top[4].usuarios.length) {
			top[4] = f;
		}
	}
	for (var i = 0; i < 5; i++) {
		if (top[i]) {
			message += top[i].fecha + ":";
			for (var j = 0; j < top[i].usuarios.length - 1; j++) {
				message += " " + top[i].usuarios[j] + ",";
			}
			message += " " + top[i].usuarios[top[i].usuarios.length - 1] + "\n";
		} else {
			break;
		}
	}

	message += "\n";
	if (register.puntos.length > 0) {
		message += "Por ahora los puntos del dia son:\n";
		for (var i = 0; i < register.puntos.length; i++) {
			message += (i+1) + ") " + register.puntos[i] + "\n";
		}
	} else {
		message += "No hay puntos del dia!!! 😭 "
	}
	return message;
};

var handleMessage = function(message) {
	var text = message.text || "";
	var chatId = message.chat.id;

	if (message.from) {
		var user = message.from.username || message.from.first_name;
		user = parseUser(user);
		switch(true) {
			case text.search(/\/fecha/i) == 0:
				if (registro[chatId]) {
					sendMessage(chatId, "Terminad antes de volver a empezar :)", message.message_id);
				} else {
					registro[chatId] = {fechas:[], puntos:[]};
					bot.sendMessage(chatId, "Añadid las fechas que querais :O :P", {
						reply_markup : JSON.stringify(
							{one_time_keyboard:false, keyboard:datesKeyboard(), selective:false}
						)
					});
				}
				break;
			case text.search(/\/resumen/i) == 0:
				if (registro[chatId]) {
					sendMessage(chatId, resumen(registro[chatId]), message.message_id);
				} else {
					sendMessage(chatId, "No hay resumen porque no hay nada :)", message.message_id);
				}
				break;
			case text.search(/\/punto/i) == 0:
				if (registro[chatId]) {
					var puntoAdd = text.substring(6, text.length);
					registro[chatId].puntos.push(puntoAdd);
					sendMessage(chatId, "Punto añadido 😄👍", message.message_id);
				} else {
					sendMessage(chatId, "No habeis iniciado ☹️ Que prisas teneis!!!", message.message_id);
				}
				break;
			case text.search(/\/borrar_punto/i) == 0:
				if (registro[chatId]) {
					var puntoDelete = text.substring(13, text.length);
					var ind = registro[chatId].puntos.indexOf(puntoDelete);
					if (ind > -1) {
						registro[chatId].puntos.splice(ind, 1);
						sendMessage(chatId, "Punto borrado D:", message.message_id);
					}
				} else {
					sendMessage(chatId, "No hay ningun punto 😒", message.message_id);
				}
				break;
			case text.search(/\/borrar_fecha/i) == 0:
				if (registro[chatId]) {
					var fechaDelete = text.substring(14, text.length);
					sendMessage(chatId, deleteDate(user, registro[chatId], fechaDelete), message.message_id);
				} else {
					sendMessage(chatId, "Para borrar una fecha tiene que haber antes 😒", message.message_id);
				}
				break
			case text.search(/\/fin/i) == 0:
				if(registro[chatId]){
					bot.sendMessage(chatId, selectDateAndMore(registro[chatId]), {reply_markup:JSON.stringify(
						{hide_keyboard:true, selective:false}
					)});
					registro[chatId] = null;
				} else {
					sendMessage(chatId,"No hay nada activo :P",message.message_id);
				}
				break;
			default:
				if (registro[chatId]) {
					if (text === "Ocultar teclado") {
						bot.sendMessage(chatId, "Fuera teclado 😋", {
							reply_markup : JSON.stringify(
								{hide_keyboard:true, selective:true}
							)
						});
					}
					var indexSemana = (text.indexOf(" 1ª Semana") != -1) ? text.indexOf(" 1ª Semana") : text.indexOf(" 2ª Semana");
					var index = dates.indexOf(text.substring(0, indexSemana));
					if (index != -1) {
						for (var i = 0; i < registro[chatId].fechas.length; i++) {
							if (registro[chatId].fechas[i].fecha === (dates[index] + text.substring(indexSemana, text.length))) {
								registro[chatId].fechas[i].usuarios.push(user);
								return;
							}
						}
						registro[chatId].fechas.push({fecha:dates[index]  + text.substring(indexSemana, text.length), usuarios:[user]});
					}
				}
		}
	}
};

bot.on('message', handleMessage);

//------------------------------------------------------------------------------
// LiFx to IOT
// Markus van Kempen - mvk@ca.ibm.com
//------------------------------------------------------------------------------
var mqtt = require('mqtt');
var url = require('url');
var macUtil = require('getmac');
var properties = require('properties');
var connected = false;
var request = require('request');
//lifx
var lifxObj = require('lifx-api');
var lifx = new lifxObj("YOUR LIFX TOKEN"); //https://community.lifx.com/

console.log("Start lifx-api");
//lifx.listLights("all", displaylifxAll);
console.log("Toggle Power");
function toggleLiFx()
{
lifx.listLights("all", displaylifxAll);
}
function displaylifxAll(resp)
{
console.log(resp);
var obj = JSON.parse( resp );
console.log("LIFX respose: ");

console.log("Light label:" +obj[0].label);
console.log("Light name:" +obj[0].group.name);

  var myJsonData = {
         "d": {
           "myName": "LiFx Light",
           "deviceName" : obj[0].group.name,
           "deviceId"    : obj[0].id,
           "last_seen"  : obj[0].last_seen,
           "connected" : obj[0].connected,
           "power":  obj[0].power
          }
        };

console.log("Publish (Topic: iot-2/evt/status/fmt/json) LiFX Message : "+JSON.stringify(myJsonData));
//subscribe to iot-2/type/mvk-laptoplan/id/00-21-CC-C8-6F-1B/evt/+/fmt/json
    //   client.publish('iot-2/evt/MVK/fmt/json', JSON.stringify(myJsonData), function() {
client.publish('iot-2/evt/status/fmt/json', JSON.stringify(myJsonData), function() {
       });



setTimeout(toggleLiFx, 10000);
}

/**
 */

"option strict";



properties.parse('./config.properties', {path: true}, function(err, cfg) {
  if (err) {
    console.error('A file named config.properties containing the device registration from the IBM IoT Cloud is missing.');
    console.error('The file must contain the following properties: org, type, id, auth-token. nestusername and nestpassword');
    throw e;
  }
  macUtil.getMac(function(err, macAddress) {
    if (err) throw err;
    var deviceId = macAddress.replace(/:/gi, '');
    console.log('Device MAC Address: ' + deviceId);

//    if(cfg.id != deviceId) {
//    	console.warn('The device MAC address does not match the ID in the configuration file.');
//    }
//cfg.org = 'quickstart';
    var clientId = ['d', cfg.org, cfg.type, cfg.id].join(':');


//    client = mqtt.createSecureClient('8883', cfg.org + '.messaging.internetofthings.ibmcloud.com',
    client = mqtt.createClient('1883',   cfg.org + '.messaging.internetofthings.ibmcloud.com',
      {
        "clientId" : clientId,
//		 "clientId" : 'd:quickstart:paho-client:8c705ae36b0c',
        "keepalive" : 30,
//        "username" : "",
//        "password" : ""
        "username" : "use-token-auth",
        "password" : cfg['auth-token']
      });

    client.on('connect', function() {
	  console.log('MQTT client connected to IBM IoT Cloud.');
	  console.log("We are DeviceID  : "+cfg.id);


// does not work
//iot-2/type/mvk-laptoplan/id/00-21-CC-C8-6F-1B/cmd/MVK/fmt/json
//client.subscribe('iot-2/type/+/id/00-21-CC-C8-6F-1B/+/MVK/fmt/json');
//console.log("Subscribe : "+'iot-2/type/+/id/00-21-CC-C8-6F-1B/+/MVK/fmt/json');

// Note - as a device you can only subscribe to CMD
//publish to : iot-2/type/mvk-laptoplan/id/00-21-CC-C8-6F-1B/cmd/MVK/fmt/json
/* example message
    {
        "d": {"myName": "Paho client",
             "TargetTemp": 60
        }
    }
*/

// received events: iot-2/type/mvk-laptoplan/id/00-21-CC-C8-6F-1B/evt/+/fmt/json

client.subscribe('iot-2/cmd/+/fmt/json');
console.log("Subscribe : "+'iot-2/cmd/+/fmt/json');

//     pushlifxdata();
toggleLiFx();


    });//client.on


	client.on('message', function(topic, message) {
    console.log(">>>>> Topic: " +topic + "  Msg: "+message);

	myData = JSON.parse(message);

	if (myData.d.Action != null)
	{
		Action = myData.d.Action;
    console.log("Action Light" + myData.d.Action);

    if (myData.d.Action == 0) //toggle
      lifx.setToggle("all",function(resp) { console.log( JSON.parse(resp) ) });
    if (myData.d.Action == 1)
      lifx.setPower("all","on",1,function(resp) { console.log( JSON.parse(resp) ) });

    if (myData.d.Action == 2)
    lifx.setPower("all","off",1,function(resp) { console.log( JSON.parse(resp) ) });

//    cycle = myData.d.Cycle;
//    cycle = myData.d.Second;
    if (myData.d.Action == 3)
      lifx.breatheEffect("all", "blue", "red", 2, 3, false, true, 0.25,   function(resp) { console.log( JSON.parse(resp) ) });
	}else{
		console.log("Error ins message item ToggleLight not found in topic"+message);

	}


	});///client.on('message', f

    client.on('error', function(err) {
	  console.log('client error' + err);
	  process.exit(1);
    });
    client.on('MQTT close', function(msg) {
	  console.log('client closed: '+msg);
	  process.exit(1);
    });


  });
});
